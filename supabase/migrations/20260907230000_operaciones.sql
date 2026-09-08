-- Operaciones de la Fase 1.
--
-- Cada una hace su escritura y su `evento_orden` en la misma transacción. Si el
-- evento se escribiera aparte, un fallo entre medio dejaría una orden que cambió
-- sin rastro de quién la cambió, que es justo lo que la decisión 14 quiere
-- evitar.
--
-- Las reglas de transición NO viven acá: son la función pura de
-- `src/lib/orden/estados.ts` (ARQUITECTURA.md §3). Estas funciones solo
-- garantizan atomicidad y que nadie pise el cambio de otro. Duplicar la tabla de
-- transiciones en SQL crearía dos fuentes de verdad que se separan con el tiempo.
--
-- Todas son SECURITY INVOKER (el default): corren con los permisos de quien
-- llama, así que la RLS del staff sigue mandando.

-- ---------------------------------------------------------------------------
-- Recepción rápida: cliente + vehículo + orden + evento en un solo viaje
-- ---------------------------------------------------------------------------

create function public.recepcionar_vehiculo(
  p_motivo            text,
  p_ubicacion         text,
  p_cliente_id        uuid    default null,
  p_cliente_nombre    text    default null,
  p_cliente_telefono  text    default null,
  p_vehiculo_id       uuid    default null,
  p_placa             text    default null,
  p_marca             text    default null,
  p_modelo            text    default null,
  p_anio              smallint default null,
  p_tipo              text    default null,
  p_kilometraje       integer default null,
  p_box_id            uuid    default null
)
returns uuid
language plpgsql
as $$
declare
  v_cliente_id  uuid := p_cliente_id;
  v_vehiculo_id uuid := p_vehiculo_id;
  v_orden_id    uuid;
begin
  if v_cliente_id is null then
    insert into cliente (nombre, telefono)
    values (btrim(p_cliente_nombre), btrim(p_cliente_telefono))
    returning id into v_cliente_id;
  end if;

  if v_vehiculo_id is null then
    -- La placa se normaliza acá y no en la aplicación: es la llave de búsqueda
    -- del taller y tiene que quedar igual venga de donde venga.
    insert into vehiculo (cliente_id, placa, marca, modelo, anio, tipo)
    values (
      v_cliente_id,
      upper(regexp_replace(coalesce(p_placa, ''), '\s', '', 'g')),
      btrim(p_marca),
      btrim(p_modelo),
      p_anio,
      p_tipo
    )
    returning id into v_vehiculo_id;
  else
    -- Vehículo conocido: si ya tiene una orden abierta, no se abre otra.
    if exists (
      select 1 from orden_servicio
      where vehiculo_id = v_vehiculo_id and estado <> 'LISTO'
    ) then
      raise exception 'Ese vehículo ya tiene una orden abierta.'
        using errcode = 'P0001';
    end if;

    select cliente_id into v_cliente_id from vehiculo where id = v_vehiculo_id;
  end if;

  insert into orden_servicio (
    vehiculo_id, cliente_id, motivo_ingreso, kilometraje, ubicacion, box_id
  )
  values (
    v_vehiculo_id, v_cliente_id, btrim(p_motivo), p_kilometraje, p_ubicacion, p_box_id
  )
  returning id into v_orden_id;

  insert into evento_orden (orden_id, tipo, payload, actor)
  values (
    v_orden_id,
    'ORDEN_CREADA',
    jsonb_build_object(
      'motivo', btrim(p_motivo),
      'kilometraje', p_kilometraje,
      'ubicacion', p_ubicacion,
      'box_id', p_box_id
    ),
    auth.uid()
  );

  return v_orden_id;
end;
$$;

comment on function public.recepcionar_vehiculo is
  'Alta completa desde /admin/ingreso. Crea cliente y vehículo solo si no se pasó su id.';

-- ---------------------------------------------------------------------------
-- Cambio de estado, con guarda contra pisadas
-- ---------------------------------------------------------------------------

create function public.cambiar_estado_orden(
  p_orden_id         uuid,
  p_estado_esperado  text,
  p_estado_nuevo     text,
  p_nota             text default null
)
returns text
language plpgsql
as $$
begin
  -- El `and estado = p_estado_esperado` es la guarda: si otra persona movió la
  -- orden entre que se pintó la pantalla y se apretó el botón, no se actualiza
  -- nada y avisamos, en vez de sobrescribir su cambio en silencio.
  update orden_servicio
  set estado = p_estado_nuevo
  where id = p_orden_id and estado = p_estado_esperado;

  if not found then
    raise exception 'La orden ya no está en %. Recarga la pantalla.', p_estado_esperado
      using errcode = 'P0001';
  end if;

  insert into evento_orden (orden_id, tipo, payload, actor)
  values (
    p_orden_id,
    'ESTADO_CAMBIADO',
    jsonb_build_object('desde', p_estado_esperado, 'hacia', p_estado_nuevo, 'nota', p_nota),
    auth.uid()
  );

  return p_estado_nuevo;
end;
$$;

-- ---------------------------------------------------------------------------
-- Mover el vehículo: box, patio o fuera. Independiente del estado (decisión 2)
-- ---------------------------------------------------------------------------

create function public.mover_orden(
  p_orden_id   uuid,
  p_ubicacion  text,
  p_box_id     uuid default null
)
returns void
language plpgsql
as $$
declare
  v_ubicacion_previa text;
  v_box_previo       uuid;
  v_tipo             text;
begin
  select ubicacion, box_id into v_ubicacion_previa, v_box_previo
  from orden_servicio
  where id = p_orden_id
  for update;

  if not found then
    raise exception 'No existe esa orden.' using errcode = 'P0001';
  end if;

  update orden_servicio
  set ubicacion = p_ubicacion,
      box_id = case when p_ubicacion = 'BOX' then p_box_id else null end
  where id = p_orden_id;

  v_tipo := case
    when p_ubicacion = 'BOX' and v_box_previo is null then 'BOX_ASIGNADO'
    when p_ubicacion = 'BOX' then 'BOX_CAMBIADO'
    when v_box_previo is not null then 'BOX_LIBERADO'
    else 'UBICACION_CAMBIADA'
  end;

  insert into evento_orden (orden_id, tipo, payload, actor)
  values (
    p_orden_id,
    v_tipo,
    jsonb_build_object(
      'ubicacion_previa', v_ubicacion_previa,
      'ubicacion', p_ubicacion,
      'box_previo', v_box_previo,
      'box_id', case when p_ubicacion = 'BOX' then p_box_id else null end
    ),
    auth.uid()
  );
end;
$$;

grant execute on function
  public.recepcionar_vehiculo,
  public.cambiar_estado_orden,
  public.mover_orden
to authenticated;

revoke execute on function
  public.recepcionar_vehiculo,
  public.cambiar_estado_orden,
  public.mover_orden
from anon;
