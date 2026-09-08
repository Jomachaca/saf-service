-- Staff del taller. Decisiones 18 y 19.
--
-- Los conjuntos cerrados (rol, estado, tipo de vehículo) se modelan como `text`
-- con `check`, no como enum de Postgres: en v2 hay que agregar valores
-- (ESPERANDO_REPUESTOS, roles nuevos) y reemplazar un check es una migración
-- trivial, mientras que un enum arrastra restricciones.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table perfil (
  id         uuid primary key references auth.users (id) on delete cascade,
  nombre     text not null check (length(btrim(nombre)) > 0),
  rol        text not null default 'admin' check (rol in ('admin')),
  activo     boolean not null default true,
  creado_en  timestamptz not null default now()
);

comment on table perfil is
  'Staff. Ligado a auth.users. En v1 el único rol es admin (decisión 19); la columna existe para que agregar mecánico y recepción en v2 sea una política nueva, no una migración de datos.';

-- Se usa en todas las políticas de RLS. SECURITY DEFINER para que consultar
-- `perfil` desde una política no dispare la RLS de `perfil` otra vez.
create function public.es_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from perfil
    where id = auth.uid() and activo
  );
$$;

comment on function public.es_staff() is
  'true si quien hace la consulta es staff activo. Base de casi toda la RLS.';

alter table perfil enable row level security;

-- El staff se ve a sí mismo y a sus compañeros; nadie inserta ni borra desde la
-- aplicación. Las cuentas se crean desde Supabase (decisión 18).
create policy "staff lee perfiles"
  on perfil for select
  to authenticated
  using (es_staff());

create policy "cada uno edita su nombre"
  on perfil for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and rol = 'admin' and activo);

grant select, update on perfil to authenticated;
