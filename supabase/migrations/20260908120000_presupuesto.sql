-- Fase 2: diagnóstico, presupuesto y configuración del sitio.
--
-- `config_sitio` es de la Fase 3, pero se adelanta porque acá viven dos cosas
-- que el presupuesto necesita hoy: la configuración del IGV (decisión 16) y las
-- plantillas de mensaje de WhatsApp (ARQUITECTURA.md §8). La pantalla que las
-- edita sigue siendo de la Fase 3; por ahora se llenan con valores por defecto.

-- ---------------------------------------------------------------------------
-- Configuración del sitio: fila única, esquema fijo (decisión 11)
-- ---------------------------------------------------------------------------

create table config_sitio (
  -- El check deja la tabla en una sola fila para siempre.
  id                  smallint primary key default 1 check (id = 1),

  nombre_taller       text not null default 'SAF Service',
  slogan              text not null default '',
  descripcion         text not null default '',
  logo_url            text,
  telefono            text not null default '',
  whatsapp            text not null default '',
  direccion           text not null default '',
  horarios            jsonb not null default '[]'::jsonb,
  galeria             jsonb not null default '[]'::jsonb,
  plantillas_mensaje  jsonb not null default '{}'::jsonb,

  -- Decisión 16. La tasa se guarda para no reescribir presupuestos históricos
  -- si el IGV cambia algún día.
  igv_incluido        boolean not null default true,
  igv_tasa_bp         integer not null default 1800 check (igv_tasa_bp between 0 and 10000),

  -- Decisión 17: si actualizado_en > publicado_en, hay cambios sin publicar.
  actualizado_en      timestamptz not null default now(),
  publicado_en        timestamptz
);

comment on column config_sitio.igv_tasa_bp is
  'Tasa en basis points: 1800 = 18 %. Entero, como todo el dinero (decisión 6).';

insert into config_sitio (id, plantillas_mensaje) values (
  1,
  jsonb_build_object(
    'presupuesto',
    'Hola {cliente}, ya revisamos tu {marca} {modelo} {placa}. El diagnóstico y presupuesto están acá: {url}'
  )
);

alter table config_sitio enable row level security;

-- El landing la lee con la clave pública (ARQUITECTURA.md §12).
create policy "cualquiera lee la configuracion" on config_sitio
  for select to anon, authenticated using (true);

create policy "staff edita la configuracion" on config_sitio
  for update to authenticated using (es_staff()) with check (es_staff());

grant select on config_sitio to anon;
grant select, update on config_sitio to authenticated;

-- ---------------------------------------------------------------------------
-- Diagnóstico
-- ---------------------------------------------------------------------------

create table diagnostico (
  id             uuid primary key default gen_random_uuid(),
  -- Uno por orden: "el diagnóstico" es singular en el flujo del taller. Se
  -- reescribe si el mecánico encuentra algo más.
  orden_id       uuid not null unique references orden_servicio (id) on delete cascade,
  hallazgos      text not null default '',
  recomendacion  text not null default '',
  mecanico       text not null default '',
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Presupuesto
-- ---------------------------------------------------------------------------

create table presupuesto (
  id                   uuid primary key default gen_random_uuid(),
  orden_id             uuid not null references orden_servicio (id) on delete cascade,
  version              integer not null,

  estado               text not null default 'BORRADOR' check (estado in (
                         'BORRADOR', 'ENVIADO', 'APROBADO', 'RECHAZADO'
                       )),

  -- Los tres montos se materializan al emitir. El presupuesto que el cliente
  -- vio y aprobó no puede cambiar porque después alguien tocó la configuración
  -- o subió un precio del catálogo (decisiones 5 y 16).
  subtotal_centimos    integer not null default 0 check (subtotal_centimos >= 0),
  igv_centimos         integer not null default 0 check (igv_centimos >= 0),
  total_centimos       integer not null default 0 check (total_centimos >= 0),

  -- Cómo estaba configurado el IGV cuando se emitió, para poder explicar el
  -- desglose meses después.
  igv_incluido         boolean not null default true,
  igv_tasa_bp          integer not null default 1800,

  tiempo_estimado_min  integer check (tiempo_estimado_min >= 0),

  enviado_en           timestamptz,
  respondido_en        timestamptz,
  -- Nombre que escribió quien aprobó desde el link público. No hay cuenta
  -- detrás: es lo único que se puede afirmar sin mentir (regla 7).
  respondido_por       text,

  creado_en            timestamptz not null default now(),

  constraint presupuesto_version_unica unique (orden_id, version)
);

comment on column presupuesto.respondido_por is
  'Nombre que tecleó el cliente al aprobar o rechazar desde /o/{token}. No es una identidad verificada y no debe presentarse como tal.';

create index presupuesto_orden_idx on presupuesto (orden_id, version desc);

-- Como mucho un presupuesto en borrador por orden: si hay que corregirlo antes
-- de mandarlo, se edita el mismo, no se acumulan borradores sueltos.
create unique index presupuesto_borrador_unico
  on presupuesto (orden_id)
  where estado = 'BORRADOR';

create table linea_presupuesto (
  id                        uuid primary key default gen_random_uuid(),
  presupuesto_id            uuid not null references presupuesto (id) on delete cascade,

  concepto                  text not null check (length(btrim(concepto)) > 0),
  cantidad                  numeric(10, 2) not null default 1 check (cantidad > 0),
  precio_unitario_centimos  integer not null check (precio_unitario_centimos >= 0),

  -- Decisión 5: esto es trazabilidad, NUNCA la fuente del precio. El precio
  -- vive en la columna de arriba, copiado en el momento de agregar la línea.
  servicio_catalogo_id      uuid references servicio_catalogo (id) on delete set null,

  orden_visual              smallint not null default 0
);

comment on column linea_presupuesto.servicio_catalogo_id is
  'Solo para saber de qué servicio salió la línea. Leer el precio de aquí rompería la decisión 5: un presupuesto de enero debe seguir mostrando los precios de enero.';

create index linea_presupuesto_idx on linea_presupuesto (presupuesto_id, orden_visual);

alter table diagnostico enable row level security;
alter table presupuesto enable row level security;
alter table linea_presupuesto enable row level security;

create policy "staff opera diagnosticos" on diagnostico
  for all to authenticated using (es_staff()) with check (es_staff());

create policy "staff opera presupuestos" on presupuesto
  for all to authenticated using (es_staff()) with check (es_staff());

create policy "staff opera lineas" on linea_presupuesto
  for all to authenticated using (es_staff()) with check (es_staff());

-- Sin políticas para anon: el cliente ve su presupuesto por /o/{token}, que se
-- resuelve en el servidor con clave de servicio (decisión 7).

grant select, insert, update, delete on diagnostico, presupuesto, linea_presupuesto
  to authenticated;
