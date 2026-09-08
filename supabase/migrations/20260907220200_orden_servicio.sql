-- La orden de servicio: entidad central (decisión 1) y su bitácora (decisión 14).

-- ---------------------------------------------------------------------------
-- Numeración OS-2026-0182 (decisión 20)
-- ---------------------------------------------------------------------------

create table contador_orden (
  anio    smallint primary key,
  ultimo  integer not null default 0
);

comment on table contador_orden is
  'Un correlativo por año. Existe para que la numeración se asigne con un bloqueo de fila y dos recepciones simultáneas no tomen el mismo número.';

create function public.siguiente_correlativo(p_anio smallint)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_correlativo integer;
begin
  insert into contador_orden (anio, ultimo)
  values (p_anio, 1)
  on conflict (anio) do update set ultimo = contador_orden.ultimo + 1
  returning ultimo into v_correlativo;

  return v_correlativo;
end;
$$;

create function public.generar_token_publico()
returns text
language sql
volatile
as $$
  -- 24 bytes = 192 bits, por encima del mínimo de 128 que pide ARQUITECTURA.md §12.
  -- `translate` deja el base64 url-safe: + y / se reemplazan, = se elimina.
  select translate(encode(extensions.gen_random_bytes(24), 'base64'), '+/=', '-_');
$$;

-- ---------------------------------------------------------------------------
-- Orden de servicio
-- ---------------------------------------------------------------------------

create table orden_servicio (
  id                   uuid primary key default gen_random_uuid(),

  anio                 smallint not null,
  correlativo          integer not null,
  numero               text generated always as
                         ('OS-' || anio::text || '-' || lpad(correlativo::text, 4, '0')) stored,

  vehiculo_id          uuid not null references vehiculo (id) on delete restrict,
  cliente_id           uuid not null references cliente (id) on delete restrict,

  estado               text not null default 'RECIBIDO' check (estado in (
                         'RECIBIDO', 'DIAGNOSTICO', 'ESPERANDO_APROBACION', 'EN_TRABAJO', 'LISTO'
                       )),
  ubicacion            text not null default 'PATIO' check (ubicacion in ('BOX', 'PATIO', 'FUERA')),
  box_id               uuid references box (id) on delete restrict,

  motivo_ingreso       text not null check (length(btrim(motivo_ingreso)) > 0),
  kilometraje          integer check (kilometraje >= 0),

  token_publico        text not null unique default public.generar_token_publico(),
  tiempo_estimado_min  integer check (tiempo_estimado_min > 0),

  recibido_en          timestamptz not null default now(),
  cerrado_en           timestamptz,

  constraint orden_numero_unico unique (anio, correlativo),

  -- Decisión 2: el box solo tiene sentido si el vehículo está en un box.
  constraint orden_box_coherente check ((ubicacion = 'BOX') = (box_id is not null))
);

comment on column orden_servicio.ubicacion is
  'Independiente de `estado` (decisión 2). Un auto esperando repuestos está en PATIO sin ocupar box.';

comment on column orden_servicio.token_publico is
  'Aleatorio, nunca el número de orden (decisión 7). Se genera al crear la orden; el link recién se comparte al enviar el presupuesto.';

-- Ocupación física: dos vehículos no caben en el mismo box. Se mide por
-- `ubicacion`, no por `estado`: una orden LISTO cuyo dueño todavía no pasa a
-- recoger sigue ocupando el espacio, y el tablero debe decirlo.
create unique index orden_box_ocupado_idx
  on orden_servicio (box_id)
  where ubicacion = 'BOX';

create index orden_estado_idx on orden_servicio (estado) where estado <> 'LISTO';
create index orden_vehiculo_idx on orden_servicio (vehiculo_id, recibido_en desc);
create index orden_cliente_idx on orden_servicio (cliente_id);

create function public.asignar_numero_orden()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.anio is null then
    -- Año del calendario de Lima, no del servidor (decisión 21).
    new.anio := extract(year from (now() at time zone 'America/Lima'))::smallint;
  end if;

  if new.correlativo is null then
    new.correlativo := siguiente_correlativo(new.anio);
  end if;

  return new;
end;
$$;

-- BEFORE INSERT corre antes de que Postgres valide NOT NULL, así que `anio` y
-- `correlativo` pueden seguir siendo obligatorios aunque el INSERT no los mande.
create trigger orden_numero
  before insert on orden_servicio
  for each row execute function public.asignar_numero_orden();

create function public.marcar_cierre_orden()
returns trigger
language plpgsql
as $$
begin
  if new.estado = 'LISTO' and old.estado <> 'LISTO' then
    new.cerrado_en := now();
  elsif new.estado <> 'LISTO' then
    new.cerrado_en := null;
  end if;

  return new;
end;
$$;

create trigger orden_cierre
  before update of estado on orden_servicio
  for each row execute function public.marcar_cierre_orden();

-- ---------------------------------------------------------------------------
-- Bitácora (decisión 14): append-only, nunca se edita ni se borra
-- ---------------------------------------------------------------------------

create table evento_orden (
  id                 uuid primary key default gen_random_uuid(),
  orden_id           uuid not null references orden_servicio (id) on delete cascade,
  tipo               text not null check (length(btrim(tipo)) > 0),
  payload            jsonb not null default '{}'::jsonb,
  actor              uuid references perfil (id) on delete set null,
  actor_descripcion  text,
  creado_en          timestamptz not null default now()
);

comment on column evento_orden.actor is
  'El perfil del staff que hizo la acción. NULL cuando no hay staff detrás: el cliente aprobando por el link público, o el sistema.';

comment on column evento_orden.actor_descripcion is
  'Quién fue cuando `actor` es NULL: "cliente vía link", "sistema". No se le miente a la base: wa.me no confirma entrega, así que el evento se llama LINK_GENERADO (decisión 9).';

create index evento_orden_idx on evento_orden (orden_id, creado_en desc);

alter table orden_servicio enable row level security;
alter table evento_orden enable row level security;
alter table contador_orden enable row level security;

create policy "staff opera ordenes" on orden_servicio
  for all to authenticated using (es_staff()) with check (es_staff());

-- Sin política de anon: el cliente nunca lee `orden_servicio` con la clave
-- pública. `/o/{token}` se resuelve en servidor con clave de servicio y
-- devuelve solo los campos que corresponden (decisión 7, ARQUITECTURA.md §12).

create policy "staff lee eventos" on evento_orden
  for select to authenticated using (es_staff());

create policy "staff registra eventos" on evento_orden
  for insert to authenticated with check (es_staff());

-- Append-only de verdad: sin políticas de update y delete, y sin el privilegio.
grant select, insert, update, delete on orden_servicio to authenticated;
grant select, insert on evento_orden to authenticated;
revoke update, delete on evento_orden from authenticated;

-- `contador_orden` no se toca desde la aplicación: solo por la función que
-- corre como SECURITY DEFINER.
revoke all on contador_orden from anon, authenticated;
