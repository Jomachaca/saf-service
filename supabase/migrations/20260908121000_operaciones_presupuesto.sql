-- Operaciones de la Fase 2.
--
-- Mismo reparto que en la Fase 1: acá vive la atomicidad —la escritura y su
-- `evento_orden` entran juntas— y nada más. En particular **el cálculo del IGV
-- no está acá**: vive en `src/lib/dinero.ts` y los montos llegan ya calculados.
-- Duplicar esa aritmética en SQL crearía dos fuentes de verdad que se separan,
-- que es justo lo que la decisión 16 pide evitar.

-- ---------------------------------------------------------------------------
-- Bitácora suelta, para acciones que no cambian nada más
-- ---------------------------------------------------------------------------

create function public.registrar_evento(
  p_orden_id  uuid,
  p_tipo      text,
  p_payload   jsonb default '{}'::jsonb
)
returns void
language sql
as $$
  insert into evento_orden (orden_id, tipo, payload, actor)
  values (p_orden_id, p_tipo, coalesce(p_payload, '{}'::jsonb), auth.uid());
$$;

comment on function public.registrar_evento is
  'Para hechos que no modifican otra tabla, como LINK_GENERADO al abrir WhatsApp (decisión 9).';

-- ---------------------------------------------------------------------------
-- Diagnóstico
-- ---------------------------------------------------------------------------

create function public.guardar_diagnostico(
  p_orden_id       uuid,
  p_hallazgos      text,
  p_recomendacion  text,
  p_mecanico       text default ''
)
returns uuid
language plpgsql
as $$
declare
  v_id      uuid;
  v_existia boolean;
begin
  select id into v_id from diagnostico where orden_id = p_orden_id;
  v_existia := v_id is not null;

  if v_existia then
    update diagnostico
    set hallazgos = btrim(p_hallazgos),
        recomendacion = btrim(p_recomendacion),
        mecanico = btrim(coalesce(p_mecanico, '')),
        actualizado_en = now()
    where id = v_id;
  else
    insert into diagnostico (orden_id, hallazgos, recomendacion, mecanico)
    values (
      p_orden_id,
      btrim(p_hallazgos),
      btrim(p_recomendacion),
      btrim(coalesce(p_mecanico, ''))
    )
    returning id into v_id;
  end if;

  insert into evento_orden (orden_id, tipo, payload, actor)
  values (
    p_orden_id,
    case when v_existia then 'DIAGNOSTICO_ACTUALIZADO' else 'DIAGNOSTICO_GUARDADO' end,
    jsonb_build_object('mecanico', btrim(coalesce(p_mecanico, ''))),
    auth.uid()
  );

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Presupuesto: guardar el borrador
-- ---------------------------------------------------------------------------

create function public.guardar_presupuesto(
  p_orden_id             uuid,
  p_lineas               jsonb,
  p_subtotal_centimos    integer,
  p_igv_centimos         integer,
  p_total_centimos       integer,
  p_igv_incluido         boolean,
  p_igv_tasa_bp          integer,
  p_tiempo_estimado_min  integer default null
)
returns uuid
language plpgsql
as $$
declare
  v_presupuesto_id uuid;
  v_version        integer;
begin
  if jsonb_typeof(p_lineas) <> 'array' or jsonb_array_length(p_lineas) = 0 then
    raise exception 'Un presupuesto necesita al menos una línea.' using errcode = 'P0001';
  end if;

  select id into v_presupuesto_id
  from presupuesto
  where orden_id = p_orden_id and estado = 'BORRADOR';

  if v_presupuesto_id is null then
    select coalesce(max(version), 0) + 1 into v_version
    from presupuesto where orden_id = p_orden_id;

    insert into presupuesto (orden_id, version) values (p_orden_id, v_version)
    returning id into v_presupuesto_id;
  end if;

  update presupuesto
  set subtotal_centimos = p_subtotal_centimos,
      igv_centimos = p_igv_centimos,
      total_centimos = p_total_centimos,
      igv_incluido = p_igv_incluido,
      igv_tasa_bp = p_igv_tasa_bp,
      tiempo_estimado_min = p_tiempo_estimado_min
  where id = v_presupuesto_id;

  -- Las líneas se reemplazan enteras: es un borrador, y así no hay que
  -- reconciliar cuáles se editaron, cuáles se borraron y cuáles son nuevas.
  delete from linea_presupuesto where presupuesto_id = v_presupuesto_id;

  insert into linea_presupuesto (
    presupuesto_id, concepto, cantidad, precio_unitario_centimos,
    servicio_catalogo_id, orden_visual
  )
  select
    v_presupuesto_id,
    btrim(linea->>'concepto'),
    (linea->>'cantidad')::numeric,
    (linea->>'precio_unitario_centimos')::integer,
    nullif(linea->>'servicio_catalogo_id', '')::uuid,
    (indice - 1)::smallint
  from jsonb_array_elements(p_lineas) with ordinality as t(linea, indice);

  insert into evento_orden (orden_id, tipo, payload, actor)
  values (
    p_orden_id,
    'PRESUPUESTO_GUARDADO',
    jsonb_build_object(
      'presupuesto_id', v_presupuesto_id,
      'lineas', jsonb_array_length(p_lineas),
      'total_centimos', p_total_centimos
    ),
    auth.uid()
  );

  return v_presupuesto_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Presupuesto: emitirlo
-- ---------------------------------------------------------------------------

create function public.enviar_presupuesto(p_presupuesto_id uuid)
returns text
language plpgsql
as $$
declare
  v_orden_id uuid;
  v_token    text;
begin
  update presupuesto
  set estado = 'ENVIADO', enviado_en = now()
  where id = p_presupuesto_id and estado = 'BORRADOR'
  returning orden_id into v_orden_id;

  if v_orden_id is null then
    raise exception 'Ese presupuesto ya fue enviado o no existe.' using errcode = 'P0001';
  end if;

  -- El token existe desde que se creó la orden; acá solo se devuelve para armar
  -- el enlace. Recién ahora se comparte con el cliente.
  select token_publico into v_token from orden_servicio where id = v_orden_id;

  insert into evento_orden (orden_id, tipo, payload, actor)
  values (
    v_orden_id,
    'PRESUPUESTO_ENVIADO',
    jsonb_build_object('presupuesto_id', p_presupuesto_id),
    auth.uid()
  );

  return v_token;
end;
$$;

-- ---------------------------------------------------------------------------
-- Respuesta del cliente desde /o/{token}
-- ---------------------------------------------------------------------------

create function public.responder_presupuesto(
  p_token     text,
  p_decision  text,
  p_nombre    text
)
returns jsonb
language plpgsql
as $$
declare
  v_orden_id       uuid;
  v_presupuesto_id uuid;
begin
  if p_decision not in ('APROBADO', 'RECHAZADO') then
    raise exception 'Decisión inválida.' using errcode = 'P0001';
  end if;

  select id into v_orden_id from orden_servicio where token_publico = p_token;
  if v_orden_id is null then
    raise exception 'Ese enlace no corresponde a ninguna orden.' using errcode = 'P0001';
  end if;

  -- Solo el presupuesto vigente, y solo si sigue esperando respuesta: el enlace
  -- se puede abrir muchas veces y la decisión se toma una sola.
  update presupuesto
  set estado = p_decision,
      respondido_en = now(),
      respondido_por = nullif(btrim(coalesce(p_nombre, '')), '')
  where id = (
    select id from presupuesto
    where orden_id = v_orden_id and estado = 'ENVIADO'
    order by version desc
    limit 1
  )
  returning id into v_presupuesto_id;

  if v_presupuesto_id is null then
    raise exception 'Este presupuesto ya fue respondido.' using errcode = 'P0001';
  end if;

  -- `actor` queda en NULL a propósito: detrás del enlace no hay una cuenta.
  -- Lo único que se puede afirmar es que alguien con el enlace respondió, y
  -- el nombre que escribió (regla 7).
  insert into evento_orden (orden_id, tipo, payload, actor, actor_descripcion)
  values (
    v_orden_id,
    case when p_decision = 'APROBADO' then 'PRESUPUESTO_APROBADO' else 'PRESUPUESTO_RECHAZADO' end,
    jsonb_build_object(
      'presupuesto_id', v_presupuesto_id,
      'nombre', nullif(btrim(coalesce(p_nombre, '')), '')
    ),
    null,
    'cliente vía enlace público'
  );

  return jsonb_build_object('orden_id', v_orden_id, 'presupuesto_id', v_presupuesto_id);
end;
$$;

grant execute on function
  public.registrar_evento,
  public.guardar_diagnostico,
  public.guardar_presupuesto,
  public.enviar_presupuesto
to authenticated;

revoke execute on function
  public.registrar_evento,
  public.guardar_diagnostico,
  public.guardar_presupuesto,
  public.enviar_presupuesto,
  public.responder_presupuesto
from anon;
