-- Los espacios del taller dejan de ser «boxes». Decisión 35.
--
-- El modelo decía BOX / PATIO / FUERA, y eso no describe al taller de
-- referencia: es un patio con autos y dos elevadores. «Box» no era un nombre
-- que se pudiera cambiar, era un comportamiento —el único con espacio
-- asignado y con cupo de uno—, así que renombrar las filas no alcanzaba.
--
-- Ahora hay dos ubicaciones, TALLER y FUERA, y los lugares son datos: una fila
-- de `espacio` con su nombre, su cupo y su tipo. Un vehículo en el taller puede
-- estar en un espacio o en ninguno; «en ninguno» es exactamente lo que antes
-- era PATIO, así que el taller puede quedarse sin espacios configurados y nada
-- se rompe: todos los autos figuran «en el taller».
--
-- No se pierde información: las órdenes que decían BOX conservan su espacio y
-- las que decían PATIO se quedan sin él, que es la misma distinción.

-- ---------------------------------------------------------------------------
-- 1. box → espacio, con cupo
-- ---------------------------------------------------------------------------

alter table box rename to espacio;

alter table espacio rename constraint box_pkey to espacio_pkey;
alter table espacio rename constraint box_nombre_key to espacio_nombre_key;

alter policy "staff opera boxes" on espacio rename to "staff opera espacios";

-- Un patio no es «de sedanes» ni «de camionetas»: entra lo que entre.
alter table espacio drop constraint box_tipo_check;
alter table espacio add constraint espacio_tipo_check
  check (tipo in ('SEDAN', 'GRANDE', 'AMBOS'));

alter table espacio add column capacidad smallint not null default 1
  check (capacidad > 0);

comment on table espacio is
  'Los lugares del taller: un patio, un elevador, la vereda de al lado. Son datos, no constantes en código, y cada uno dice cuántos vehículos le caben (decisión 35).';

comment on column espacio.capacidad is
  'Cuántos vehículos entran a la vez. Un elevador vale 1; un patio, los que quepan. Lo hace cumplir el disparador `espacio_con_cupo`.';

comment on column espacio.tipo is
  'Qué vehículos admite, a título informativo: la recepción lo muestra al elegir, pero no lo impide. El taller sabe mejor que el sistema si esa camioneta entra.';

-- ---------------------------------------------------------------------------
-- 2. La orden apunta a un espacio, y la ubicación se reduce a dos
-- ---------------------------------------------------------------------------

alter table orden_servicio rename column box_id to espacio_id;

-- Renombrar la columna no renombra su clave foránea, y el nombre se ve: es lo
-- que la aplicación busca en el mensaje de error al intentar borrar un espacio
-- que todavía tiene un vehículo adentro.
alter table orden_servicio
  rename constraint orden_servicio_box_id_fkey to orden_servicio_espacio_id_fkey;

drop index orden_box_ocupado_idx;
alter table orden_servicio drop constraint orden_box_coherente;
alter table orden_servicio drop constraint orden_servicio_ubicacion_check;
alter table orden_servicio alter column ubicacion drop default;

update orden_servicio set ubicacion = 'TALLER' where ubicacion in ('BOX', 'PATIO');

alter table orden_servicio alter column ubicacion set default 'TALLER';

alter table orden_servicio add constraint orden_ubicacion_valida
  check (ubicacion in ('TALLER', 'FUERA'));

-- Lo que está fuera del taller no ocupa ningún lugar de adentro.
alter table orden_servicio add constraint orden_espacio_coherente
  check (espacio_id is null or ubicacion = 'TALLER');

create index orden_espacio_idx on orden_servicio (espacio_id)
  where espacio_id is not null;

comment on column orden_servicio.ubicacion is
  'Independiente de `estado` (decisión 2). TALLER sin espacio es el auto que está acá pero no en un lugar asignado; era PATIO antes de la decisión 35.';

comment on column orden_servicio.espacio_id is
  'El lugar del taller donde está, si está en uno. Nulo es válido y no significa «fuera»: eso lo dice `ubicacion`.';

-- ---------------------------------------------------------------------------
-- 3. El cupo lo hace cumplir la base
-- ---------------------------------------------------------------------------
--
-- Antes era un índice único: un box, un auto. Con capacidad variable eso ya no
-- se puede expresar como índice, así que pasa a ser un disparador.
--
-- El `for update` sobre la fila del espacio no es decorativo: sin él, dos
-- recepciones simultáneas al mismo espacio cuentan las dos el mismo hueco y
-- entran las dos. Bloquear el espacio las pone en fila.
--
-- Cuenta las órdenes que están ahí, no las que están «activas»: una orden LISTO
-- cuyo dueño todavía no pasa a recoger sigue ocupando el lugar, y el tablero
-- debe decirlo (decisión 2).

create function public.espacio_con_cupo()
returns trigger
language plpgsql
as $$
declare
  v_nombre     text;
  v_capacidad  smallint;
  v_ocupados   integer;
begin
  if new.espacio_id is null then
    return new;
  end if;

  if tg_op = 'UPDATE' and new.espacio_id is not distinct from old.espacio_id then
    return new;
  end if;

  select nombre, capacidad into v_nombre, v_capacidad
  from espacio
  where id = new.espacio_id
  for update;

  if not found then
    raise exception 'No existe ese espacio.' using errcode = 'P0001';
  end if;

  select count(*) into v_ocupados
  from orden_servicio
  where espacio_id = new.espacio_id and id <> new.id;

  if v_ocupados >= v_capacidad then
    raise exception 'En «%» ya no queda sitio: entran % y hay %.',
      v_nombre, v_capacidad, v_ocupados
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

comment on function public.espacio_con_cupo is
  'Reemplaza al índice único que daba un auto por box. Bloquea la fila del espacio para que dos recepciones a la vez no se repartan el mismo hueco.';

create trigger espacio_con_cupo
  before insert or update of espacio_id on orden_servicio
  for each row execute function public.espacio_con_cupo();

-- ---------------------------------------------------------------------------
-- 4. Las dos funciones que escriben la ubicación
-- ---------------------------------------------------------------------------
--
-- Se borran y se vuelven a crear porque cambia el nombre de un parámetro, y eso
-- `create or replace` no lo permite.

drop function public.recepcionar_vehiculo(
  text, text, uuid, text, text, uuid, text, text, text, smallint, text, integer, uuid, uuid
);

create function public.recepcionar_vehiculo(
  p_motivo            text,
  p_ubicacion         text,
  p_cliente_id        uuid     default null,
  p_cliente_nombre    text     default null,
  p_cliente_telefono  text     default null,
  p_vehiculo_id       uuid     default null,
  p_placa             text     default null,
  p_marca             text     default null,
  p_modelo            text     default null,
  p_anio              smallint default null,
  p_tipo              text     default null,
  p_kilometraje       integer  default null,
  p_espacio_id        uuid     default null,
  p_reserva_id        uuid     default null
)
returns uuid
language plpgsql
as $$
declare
  v_cliente_id  uuid := p_cliente_id;
  v_vehiculo_id uuid := p_vehiculo_id;
  v_orden_id    uuid;
begin
  if v_vehiculo_id is not null then
    if exists (
      select 1 from orden_servicio
      where vehiculo_id = v_vehiculo_id and estado <> 'LISTO'
    ) then
      raise exception 'Ese vehículo ya tiene una orden abierta.'
        using errcode = 'P0001';
    end if;

    select cliente_id into v_cliente_id from vehiculo where id = v_vehiculo_id;

    if v_cliente_id is null then
      raise exception 'No existe ese vehículo.' using errcode = 'P0001';
    end if;
  else
    if v_cliente_id is null then
      insert into cliente (nombre, telefono)
      values (btrim(p_cliente_nombre), btrim(p_cliente_telefono))
      returning id into v_cliente_id;
    end if;

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
  end if;

  insert into orden_servicio (
    vehiculo_id, cliente_id, motivo_ingreso, kilometraje, ubicacion, espacio_id
  )
  values (
    v_vehiculo_id, v_cliente_id, btrim(p_motivo), p_kilometraje, p_ubicacion,
    case when p_ubicacion = 'TALLER' then p_espacio_id else null end
  )
  returning id into v_orden_id;

  -- La reserva se cierra en la misma transacción que abre la orden (decisión
  -- 28). Si alguien la canceló mientras tanto, no se crea nada: ni la orden, ni
  -- el cliente, ni el vehículo.
  if p_reserva_id is not null then
    update reserva
    set estado = 'CONVERTIDA', orden_id = v_orden_id, actualizado_en = now()
    where id = p_reserva_id and estado in ('PENDIENTE', 'CONFIRMADA');

    if not found then
      raise exception 'Esa reserva ya se recibió, se canceló o se marcó como no asistió. Recarga la agenda.'
        using errcode = 'P0001';
    end if;
  end if;

  insert into evento_orden (orden_id, tipo, payload, actor)
  values (
    v_orden_id,
    'ORDEN_CREADA',
    jsonb_build_object(
      'motivo', btrim(p_motivo),
      'kilometraje', p_kilometraje,
      'ubicacion', p_ubicacion,
      'espacio_id', case when p_ubicacion = 'TALLER' then p_espacio_id else null end,
      'reserva_id', p_reserva_id
    ),
    auth.uid()
  );

  return v_orden_id;
end;
$$;

comment on function public.recepcionar_vehiculo is
  'Alta completa desde /admin/ingreso. Crea cliente y vehículo solo si no se pasó su id. Con p_reserva_id, además convierte esa reserva.';

revoke execute on function public.recepcionar_vehiculo from public, anon;
grant execute on function public.recepcionar_vehiculo to authenticated;

drop function public.mover_orden(uuid, text, uuid);

create function public.mover_orden(
  p_orden_id    uuid,
  p_ubicacion   text,
  p_espacio_id  uuid default null
)
returns void
language plpgsql
as $$
declare
  v_ubicacion_previa text;
  v_espacio_previo   uuid;
  v_espacio_nuevo    uuid;
  v_tipo             text;
begin
  select ubicacion, espacio_id into v_ubicacion_previa, v_espacio_previo
  from orden_servicio
  where id = p_orden_id
  for update;

  if not found then
    raise exception 'No existe esa orden.' using errcode = 'P0001';
  end if;

  v_espacio_nuevo := case when p_ubicacion = 'TALLER' then p_espacio_id else null end;

  update orden_servicio
  set ubicacion = p_ubicacion,
      espacio_id = v_espacio_nuevo
  where id = p_orden_id;

  v_tipo := case
    when v_espacio_nuevo is not null and v_espacio_previo is null then 'ESPACIO_ASIGNADO'
    when v_espacio_nuevo is not null and v_espacio_nuevo <> v_espacio_previo then 'ESPACIO_CAMBIADO'
    when v_espacio_nuevo is null and v_espacio_previo is not null then 'ESPACIO_LIBERADO'
    else 'UBICACION_CAMBIADA'
  end;

  insert into evento_orden (orden_id, tipo, payload, actor)
  values (
    p_orden_id,
    v_tipo,
    jsonb_build_object(
      'ubicacion_previa', v_ubicacion_previa,
      'ubicacion', p_ubicacion,
      'espacio_previo', v_espacio_previo,
      'espacio_id', v_espacio_nuevo
    ),
    auth.uid()
  );
end;
$$;

comment on function public.mover_orden is
  'Mueve el vehículo de lugar sin tocar el estado (decisión 2). El cupo del espacio lo verifica el disparador `espacio_con_cupo`.';

revoke execute on function public.mover_orden from public, anon;
grant execute on function public.mover_orden to authenticated;
