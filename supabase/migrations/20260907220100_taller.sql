-- Clientes, vehículos, boxes y catálogo de servicios.

create table cliente (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null check (length(btrim(nombre)) > 0),
  telefono   text not null check (length(btrim(telefono)) > 0),
  email      text,
  creado_en  timestamptz not null default now()
);

-- La recepción rápida busca por teléfono (ARQUITECTURA.md §10, paso 1).
create index cliente_telefono_idx on cliente (telefono);
create index cliente_nombre_idx on cliente using gin (to_tsvector('spanish', nombre));

create table vehiculo (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null references cliente (id) on delete restrict,
  placa       text not null unique check (placa = upper(placa) and placa !~ '\s'),
  marca       text not null,
  modelo      text not null,
  anio        smallint check (anio between 1900 and 2100),
  tipo        text not null check (tipo in ('SEDAN', 'GRANDE')),
  creado_en   timestamptz not null default now()
);

comment on column vehiculo.placa is
  'Normalizada en mayúsculas y sin espacios. Es la llave con la que el taller habla: la búsqueda del panel entra por acá.';

-- `on delete restrict` en ambas: borrar un cliente con historial de órdenes
-- destruiría la trazabilidad que motiva la decisión 14.

create table box (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null unique,
  tipo          text not null check (tipo in ('SEDAN', 'GRANDE')),
  activo        boolean not null default true,
  orden_visual  smallint not null default 0
);

comment on table box is
  'Espacios físicos. Son datos, no constantes en código: el taller agrega boxes sin tocar el repositorio (ARQUITECTURA.md §4).';

create table servicio_catalogo (
  id                    uuid primary key default gen_random_uuid(),
  categoria             text not null check (categoria in (
                          'MANTENIMIENTO', 'REPARACION', 'CARROCERIA', 'ESPECIALIZADO'
                        )),
  nombre                text not null,
  precio_base_centimos  integer not null check (precio_base_centimos >= 0),
  duracion_min          integer not null check (duracion_min > 0),
  activo                boolean not null default true,
  orden_visual          smallint not null default 0,
  creado_en             timestamptz not null default now()
);

comment on column servicio_catalogo.precio_base_centimos is
  'Céntimos, entero (decisión 6). Es un precio de referencia: al armar un presupuesto se COPIA a la línea y desde ahí ya no cambia (decisión 5).';

alter table cliente enable row level security;
alter table vehiculo enable row level security;
alter table box enable row level security;
alter table servicio_catalogo enable row level security;

-- Datos de operación: solo staff.
create policy "staff opera clientes" on cliente
  for all to authenticated using (es_staff()) with check (es_staff());

create policy "staff opera vehiculos" on vehiculo
  for all to authenticated using (es_staff()) with check (es_staff());

create policy "staff opera boxes" on box
  for all to authenticated using (es_staff()) with check (es_staff());

create policy "staff opera catalogo" on servicio_catalogo
  for all to authenticated using (es_staff()) with check (es_staff());

-- Única excepción pública: el landing muestra los servicios activos
-- (ARQUITECTURA.md §12). Los precios del catálogo son públicos por diseño.
create policy "cualquiera ve el catalogo activo" on servicio_catalogo
  for select to anon, authenticated using (activo);

grant select, insert, update, delete on cliente, vehiculo, box, servicio_catalogo to authenticated;
grant select on servicio_catalogo to anon;
