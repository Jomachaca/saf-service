-- Corrige el orden de resolución en `recepcionar_vehiculo`.
--
-- La versión anterior creaba el cliente antes de mirar el vehículo, así que
-- recepcionar un vehículo ya conocido sin repetir su `cliente_id` fallaba
-- intentando insertar un cliente sin nombre.
--
-- Ahora, si el vehículo existe, el cliente sale del propio vehículo y no de lo
-- que mande la pantalla: es la fuente de verdad, y un `cliente_id` equivocado en
-- el formulario ya no puede asociar una orden al cliente que no es.

create or replace function public.recepcionar_vehiculo(
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
