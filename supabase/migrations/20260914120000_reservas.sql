-- Fase 4: reservas por cupos.
--
-- La reserva es un canal de entrada, no la entidad central (decisión 1). Vive en
-- su propia tabla, no lleva número de orden y se convierte en orden recién
-- cuando el vehículo llega. Una reserva que nunca se convierte no deja nada en
-- `orden_servicio`.
--
-- La capacidad son cupos fijos por día de la semana y hora (decisión 4). No se
-- calcula nada a partir de boxes, duraciones ni tipos de vehículo.

-- ---------------------------------------------------------------------------
-- Configuración: el interruptor y el horizonte
-- ---------------------------------------------------------------------------

alter table config_sitio
  -- Apagado por defecto: el formulario público no existe hasta que el taller
  -- arma su horario y lo enciende a propósito.
  add column reservas_activas boolean not null default false,
  add column reservas_dias    smallint not null default 14
    check (reservas_dias between 1 and 60);

comment on column config_sitio.reservas_activas is
  'Lo leen en vivo /reservar y crear_reserva(): apagarlo corta las reservas al instante. El botón de la portada, en cambio, sale del contenido publicado (decisión 29).';

comment on column config_sitio.reservas_dias is
  'Hasta cuántos días desde hoy se puede reservar.';

update config_sitio
set plantillas_mensaje = plantillas_mensaje || jsonb_build_object(
  'reserva',
  'Hola {cliente}, te escribimos de {taller}. Confirmamos tu reserva para el {fecha} a las {hora}. Te esperamos en {direccion}.'
)
where id = 1 and not (plantillas_mensaje ? 'reserva');

-- ---------------------------------------------------------------------------
-- Franjas: cuántos vehículos se reciben a cada hora de cada día de la semana
-- ---------------------------------------------------------------------------

create table franja (
  -- ISO 8601, igual que extract(isodow): 1 es lunes y 7 es domingo.
  dia_semana  smallint not null check (dia_semana between 1 and 7),
  hora        time not null,
  cupos       smallint not null check (cupos between 1 and 50),
  primary key (dia_semana, hora)
);

comment on table franja is
  'Plantilla semanal de cupos (decisión 4). Sin fila, a esa hora no se reserva. Las reservas copian fecha y hora en vez de apuntar acá: cambiar el horario no mueve las reservas ya hechas (decisión 27).';

-- ---------------------------------------------------------------------------
-- Días cerrados: feriados y cierres puntuales
-- ---------------------------------------------------------------------------

create table dia_cerrado (
  fecha      date primary key,
  motivo     text not null default '' check (length(motivo) <= 80),
  creado_en  timestamptz not null default now()
);

comment on table dia_cerrado is
  'Un día que no aparece en el formulario de reservas aunque su día de la semana tenga franjas. Las reservas que ya existían ese día no se tocan: hay que avisarles.';

-- ---------------------------------------------------------------------------
-- Reserva
-- ---------------------------------------------------------------------------

create table reserva (
  id              uuid primary key default gen_random_uuid(),

  nombre          text not null check (length(btrim(nombre)) between 2 and 80),
  -- Celular peruano normalizado: nueve dígitos que empiezan con 9. Es el
  -- número al que el taller escribe por WhatsApp para confirmar.
  telefono        text not null check (telefono ~ '^9[0-9]{8}$'),
  placa           text check (placa is null or placa ~ '^[A-Z0-9-]{3,10}$'),
  -- Lo que escribió el cliente, tal cual: "Toyota Hilux 2018". En la recepción
  -- el staff lo pasa a marca y modelo; partirlo acá sería adivinar.
  vehiculo        text not null default '' check (length(vehiculo) <= 80),
  tipo_vehiculo   text not null check (tipo_vehiculo in ('SEDAN', 'GRANDE')),

  -- NULL es "No sé qué tiene" (decisión 30), no un servicio que se olvidó.
  servicio_id     uuid references servicio_catalogo (id) on delete set null,
  -- Copiado al reservar, por lo mismo que los precios (decisión 5): si el
  -- servicio se renombra o se borra, la reserva sigue diciendo qué se pidió.
  motivo          text not null check (length(btrim(motivo)) > 0),
  detalle         text not null default '' check (length(detalle) <= 500),

  fecha           date not null,
  hora            time not null,

  estado          text not null default 'PENDIENTE' check (estado in (
                    'PENDIENTE', 'CONFIRMADA', 'CONVERTIDA', 'NO_ASISTIO', 'CANCELADA'
                  )),
  orden_id        uuid unique references orden_servicio (id) on delete restrict,

  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now(),

  -- Convertida quiere decir que hay una orden detrás, y al revés.
  constraint reserva_convertida_coherente check ((estado = 'CONVERTIDA') = (orden_id is not null))
);

comment on column reserva.estado is
  'PENDIENTE, CONFIRMADA y CONVERTIDA ocupan cupo; NO_ASISTIO y CANCELADA lo liberan. CONVERTIDA solo la escribe recepcionar_vehiculo() (decisión 28).';

-- El conteo de cupos, que se hace en cada reserva nueva y al pintar la
-- disponibilidad. Solo entran las que ocupan cupo.
create index reserva_franja_idx on reserva (fecha, hora)
  where estado in ('PENDIENTE', 'CONFIRMADA', 'CONVERTIDA');

create index reserva_telefono_idx on reserva (telefono)
  where estado in ('PENDIENTE', 'CONFIRMADA');

create index reserva_fecha_idx on reserva (fecha);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table franja enable row level security;
alter table dia_cerrado enable row level security;
alter table reserva enable row level security;

create policy "staff opera franjas" on franja
  for all to authenticated using (es_staff()) with check (es_staff());

create policy "staff opera dias cerrados" on dia_cerrado
  for all to authenticated using (es_staff()) with check (es_staff());

create policy "staff lee reservas" on reserva
  for select to authenticated using (es_staff());

create policy "staff actualiza reservas" on reserva
  for update to authenticated using (es_staff()) with check (es_staff());

-- Sin políticas para anon en ninguna de las tres, y sin privilegios. Detrás de
-- una reserva hay un nombre y un celular: el visitante reserva con
-- crear_reserva() y ve cupos con disponibilidad_reservas(), que no devuelven
-- nada más que números.
revoke all on franja, dia_cerrado, reserva from anon;

grant select, insert, update, delete on franja, dia_cerrado to authenticated;
grant select, update on reserva to authenticated;

-- Nadie inserta directo, porque las reservas nacen en crear_reserva() con sus
-- reglas adentro. Y nadie borra: una reserva cancelada sigue siendo historia.
revoke insert, delete on reserva from authenticated;

-- ---------------------------------------------------------------------------
-- Disponibilidad pública
-- ---------------------------------------------------------------------------
--
-- Las dos funciones que siguen son SECURITY DEFINER y las puede llamar
-- cualquiera con la clave pública (decisión 26). Por eso llevan las reglas
-- adentro: validar solo en la acción de Next dejaría la puerta con candado y la
-- pared de al lado abierta.
--
-- La anticipación mínima de dos horas vive en las dos y en ningún otro lado. La
-- pantalla pinta lo que devuelve la base; no recalcula.

create function public.disponibilidad_reservas()
returns table (fecha date, hora time, libres integer)
language sql
stable
security definer
set search_path = public
as $$
  with ahora as (
    -- Calendario y reloj de Lima, no del servidor (decisión 21).
    select (now() at time zone 'America/Lima') as local
  )
  select
    d.fecha,
    f.hora,
    greatest(f.cupos - coalesce(o.ocupados, 0), 0)::integer as libres
  from config_sitio c
  cross join ahora
  cross join lateral (
    select ahora.local::date + n as fecha
    from generate_series(0, c.reservas_dias) as n
  ) d
  join franja f on f.dia_semana = extract(isodow from d.fecha)
  left join lateral (
    select count(*) as ocupados
    from reserva r
    where r.fecha = d.fecha
      and r.hora = f.hora
      and r.estado in ('PENDIENTE', 'CONFIRMADA', 'CONVERTIDA')
  ) o on true
  where c.id = 1
    and c.reservas_activas
    and not exists (select 1 from dia_cerrado dc where dc.fecha = d.fecha)
    and d.fecha + f.hora >= ahora.local + interval '2 hours'
  order by d.fecha, f.hora;
$$;

comment on function public.disponibilidad_reservas is
  'Cupos libres por día y hora para /reservar. Solo números: nunca nombres ni celulares. Vacío si las reservas están apagadas.';

-- ---------------------------------------------------------------------------
-- Reservar
-- ---------------------------------------------------------------------------

create function public.crear_reserva(
  p_nombre         text,
  p_telefono       text,
  p_tipo_vehiculo  text,
  p_fecha          date,
  p_hora           time,
  p_servicio_id    uuid default null,
  p_detalle        text default null,
  p_vehiculo       text default null,
  p_placa          text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_local     timestamp := now() at time zone 'America/Lima';
  v_telefono  text := regexp_replace(coalesce(p_telefono, ''), '\D', '', 'g');
  v_nombre    text := btrim(coalesce(p_nombre, ''));
  v_detalle   text := btrim(coalesce(p_detalle, ''));
  v_vehiculo  text := btrim(coalesce(p_vehiculo, ''));
  v_placa     text := nullif(upper(regexp_replace(coalesce(p_placa, ''), '\s', '', 'g')), '');
  v_config    config_sitio%rowtype;
  v_motivo    text;
  v_cupos     smallint;
  v_ocupados  integer;
begin
  -- Los mensajes de error son para quien llena el formulario: la acción de Next
  -- muestra tal cual los que salen con P0001.

  -- Quién
  if length(v_telefono) = 11 and left(v_telefono, 2) = '51' then
    v_telefono := substr(v_telefono, 3);
  end if;

  if v_telefono !~ '^9[0-9]{8}$' then
    raise exception 'Escribe un celular de 9 dígitos que empiece con 9.' using errcode = 'P0001';
  end if;

  if length(v_nombre) < 2 or length(v_nombre) > 80 then
    raise exception 'Escribe tu nombre.' using errcode = 'P0001';
  end if;

  if p_tipo_vehiculo is null or p_tipo_vehiculo not in ('SEDAN', 'GRANDE') then
    raise exception 'Elige si es un auto o una camioneta.' using errcode = 'P0001';
  end if;

  if length(v_vehiculo) > 80 then
    raise exception 'La marca y el modelo no pueden pasar de 80 letras.' using errcode = 'P0001';
  end if;

  if v_placa is not null and v_placa !~ '^[A-Z0-9-]{3,10}$' then
    raise exception 'Revisa la placa: solo letras, números y guion.' using errcode = 'P0001';
  end if;

  if length(v_detalle) > 500 then
    raise exception 'El detalle no puede pasar de 500 letras.' using errcode = 'P0001';
  end if;

  select * into v_config from config_sitio where id = 1;

  if not coalesce(v_config.reservas_activas, false) then
    raise exception 'Las reservas en línea están pausadas. Escríbenos por WhatsApp.'
      using errcode = 'P0001';
  end if;

  -- Cuándo
  if p_fecha is null or p_hora is null then
    raise exception 'Elige el día y la hora.' using errcode = 'P0001';
  end if;

  if p_fecha + p_hora < v_local + interval '2 hours' then
    raise exception 'Ese horario ya pasó o está muy cerca. Elige otro.' using errcode = 'P0001';
  end if;

  if p_fecha > v_local::date + v_config.reservas_dias then
    raise exception 'Todavía no se puede reservar para esa fecha.' using errcode = 'P0001';
  end if;

  if exists (select 1 from dia_cerrado where fecha = p_fecha) then
    raise exception 'Ese día el taller no recibe reservas. Elige otro.' using errcode = 'P0001';
  end if;

  -- Qué
  if p_servicio_id is null then
    -- Decisión 30. Mismo texto que MOTIVO_DIAGNOSTICO en src/lib/reserva/modelo.ts.
    v_motivo := 'No sé qué tiene / suena raro';
  else
    select nombre into v_motivo from servicio_catalogo where id = p_servicio_id and activo;

    if v_motivo is null then
      raise exception 'Ese servicio ya no está disponible. Elige otro.' using errcode = 'P0001';
    end if;
  end if;

  -- El cupo. El bloqueo es por día y hora: dos personas que piden el último
  -- cupo a la vez quedan en fila, y la segunda ya ve la reserva de la primera.
  -- Se suelta solo al terminar la transacción.
  perform pg_advisory_xact_lock(hashtext('reserva ' || p_fecha::text || ' ' || p_hora::text));

  select cupos into v_cupos
  from franja
  where dia_semana = extract(isodow from p_fecha) and hora = p_hora;

  if v_cupos is null then
    raise exception 'Ese horario no está disponible. Elige otro.' using errcode = 'P0001';
  end if;

  select count(*) into v_ocupados
  from reserva
  where fecha = p_fecha
    and hora = p_hora
    and estado in ('PENDIENTE', 'CONFIRMADA', 'CONVERTIDA');

  if v_ocupados >= v_cupos then
    raise exception 'Ese horario se acaba de llenar. Elige otro.' using errcode = 'P0001';
  end if;

  -- El doble clic y el abuso. El tope de tres deja reservar a quien trae más
  -- de un vehículo, que en un taller de unidades pesadas pasa.
  if exists (
    select 1 from reserva
    where telefono = v_telefono
      and fecha = p_fecha
      and hora = p_hora
      and estado in ('PENDIENTE', 'CONFIRMADA')
  ) then
    raise exception 'Ya hay una reserva con ese celular para ese día y hora.' using errcode = 'P0001';
  end if;

  if (
    select count(*) from reserva
    where telefono = v_telefono
      and fecha >= v_local::date
      and estado in ('PENDIENTE', 'CONFIRMADA')
  ) >= 3 then
    raise exception 'Ese celular ya tiene tres reservas pendientes. Para más, escríbenos por WhatsApp.'
      using errcode = 'P0001';
  end if;

  insert into reserva (
    nombre, telefono, placa, vehiculo, tipo_vehiculo,
    servicio_id, motivo, detalle, fecha, hora
  )
  values (
    v_nombre, v_telefono, v_placa, v_vehiculo, p_tipo_vehiculo,
    p_servicio_id, v_motivo, v_detalle, p_fecha, p_hora
  );
end;
$$;

comment on function public.crear_reserva is
  'Única entrada de reservas. La llama /reservar con la clave pública; las reglas de cupo, anticipación, días cerrados y tope por celular viven acá (decisión 26). No devuelve nada: ni siquiera el id sale hacia quien no tiene sesión.';

revoke execute on function public.disponibilidad_reservas, public.crear_reserva from public;
grant execute on function public.disponibilidad_reservas, public.crear_reserva to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Horario: se guarda la semana entera
-- ---------------------------------------------------------------------------

create function public.guardar_franjas(p_franjas jsonb)
returns void
language plpgsql
as $$
begin
  if jsonb_typeof(p_franjas) <> 'array' then
    raise exception 'Horario inválido.' using errcode = 'P0001';
  end if;

  -- Se reemplaza entero, como las líneas de un presupuesto en borrador: la
  -- pantalla manda la semana completa y no hay que reconciliar celda por celda.
  -- El `where` está para los entornos que rechazan un delete sin filtro.
  delete from franja where dia_semana between 1 and 7;

  insert into franja (dia_semana, hora, cupos)
  select
    (celda->>'dia_semana')::smallint,
    (celda->>'hora')::time,
    (celda->>'cupos')::smallint
  from jsonb_array_elements(p_franjas) as celda
  where (celda->>'cupos')::integer > 0;
end;
$$;

comment on function public.guardar_franjas is
  'SECURITY INVOKER: corre con la sesión del staff y la RLS de franja decide.';

revoke execute on function public.guardar_franjas from public, anon;
grant execute on function public.guardar_franjas to authenticated;

-- ---------------------------------------------------------------------------
-- Recepción: ahora puede cerrar una reserva
-- ---------------------------------------------------------------------------
--
-- Se borra y se vuelve a crear en vez de `create or replace`: agregar un
-- parámetro crea otra función con el mismo nombre, y PostgREST no sabría a cuál
-- llamar.

drop function public.recepcionar_vehiculo(
  text, text, uuid, text, text, uuid, text, text, text, smallint, text, integer, uuid
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
  p_box_id            uuid     default null,
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
    vehiculo_id, cliente_id, motivo_ingreso, kilometraje, ubicacion, box_id
  )
  values (
    v_vehiculo_id, v_cliente_id, btrim(p_motivo), p_kilometraje, p_ubicacion, p_box_id
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
      'box_id', p_box_id,
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

-- ---------------------------------------------------------------------------
-- Búsqueda de la recepción: placa y teléfono sin importar cómo se escribieron
-- ---------------------------------------------------------------------------
--
-- Desde la agenda, la recepción llega con la placa y el celular que tecleó el
-- cliente: "abc-123" y "987654321". En la base pueden estar como "ABC123" y
-- "987 654 321", y un `ilike` directo no los encontraba, así que se creaba un
-- cliente repetido. Ahora se comparan solo letras y números de la placa, y solo
-- dígitos del teléfono.

create or replace function public.buscar_vehiculo(p_termino text)
returns table (
  id                    uuid,
  placa                 text,
  marca                 text,
  modelo                text,
  anio                  smallint,
  tipo                  text,
  cliente_id            uuid,
  cliente_nombre        text,
  cliente_telefono      text,
  orden_abierta_id      uuid,
  orden_abierta_numero  text
)
language sql
stable
as $$
  with termino as (
    select
      nullif(btrim(coalesce(p_termino, '')), '') as texto,
      nullif(regexp_replace(upper(coalesce(p_termino, '')), '[^A-Z0-9]', '', 'g'), '') as placa,
      -- Los dígitos solo cuentan si no hay letras: buscando "ABC123" no se
      -- quieren todos los teléfonos que contengan 123.
      case
        when coalesce(p_termino, '') ~ '[A-Za-z]' then null
        else nullif(regexp_replace(coalesce(p_termino, ''), '\D', '', 'g'), '')
      end as digitos
  )
  select
    v.id, v.placa, v.marca, v.modelo, v.anio, v.tipo,
    c.id, c.nombre, c.telefono,
    o.id, o.numero
  from termino t
  cross join vehiculo v
  join cliente c on c.id = v.cliente_id
  -- Como máximo una abierta por vehículo, pero el lateral lo deja explícito y
  -- no depende de esa invariante.
  left join lateral (
    select os.id, os.numero
    from orden_servicio os
    where os.vehiculo_id = v.id and os.estado <> 'LISTO'
    order by os.recibido_en desc
    limit 1
  ) o on true
  where
    regexp_replace(v.placa, '[^A-Z0-9]', '', 'g') like '%' || t.placa || '%'
    or regexp_replace(c.telefono, '\D', '', 'g') like '%' || t.digitos || '%'
    or c.nombre ilike '%' || t.texto || '%'
  order by v.creado_en desc
  limit 8;
$$;
