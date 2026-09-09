-- Fase 3: contenido del landing, editable desde /admin/config.
--
-- Sigue la decisión 11: esquema fijo de campos, no un editor de páginas. El
-- taller llena campos y sube fotos; no puede mover bloques ni romper el diseño.
-- Cada sección se oculta sola cuando su contenido está vacío, así que una
-- instalación recién creada muestra una página coherente en vez de huecos.

-- ---------------------------------------------------------------------------
-- config_sitio: los campos que faltaban
-- ---------------------------------------------------------------------------

alter table config_sitio
  add column email              text not null default '',
  add column facebook           text not null default '',
  add column instagram          text not null default '',
  add column tiktok             text not null default '',

  add column hero_titulo        text not null default '',
  add column hero_subtitulo     text not null default '',
  add column hero_imagen_url    text,

  add column nosotros_titulo    text not null default '',
  add column nosotros_texto     text not null default '',
  add column nosotros_imagen_url text,

  -- Enlace del mapa incrustado. Se guarda entero y se pinta en un iframe; no
  -- se arma la URL en código para que el taller pueda pegar la suya de Google.
  add column mapa_url           text;

comment on column config_sitio.horarios is
  'Arreglo de {etiqueta, horario}, los dos texto libre: [{"etiqueta":"Lunes a viernes","horario":"8:00 a 17:30"}]. Vacío = la sección no se muestra, que es mejor que publicar un horario inventado.';

-- La galería pasa a tabla propia: necesita orden, texto alternativo y poder
-- apagar una foto sin borrarla. Un jsonb no daba nada de eso.
alter table config_sitio drop column galeria;

-- ---------------------------------------------------------------------------
-- Galería
-- ---------------------------------------------------------------------------

create table galeria_imagen (
  id            uuid primary key default gen_random_uuid(),
  url           text not null,
  -- Obligatorio y no vacío: es lo que lee quien no ve la foto.
  alt           text not null check (length(btrim(alt)) > 0),
  orden_visual  smallint not null default 0,
  activo        boolean not null default true,
  creado_en     timestamptz not null default now()
);

create index galeria_imagen_orden_idx on galeria_imagen (orden_visual);

-- ---------------------------------------------------------------------------
-- Destacados: las razones para elegir el taller
-- ---------------------------------------------------------------------------

create table destacado (
  id            uuid primary key default gen_random_uuid(),
  -- Clave de un catálogo cerrado de íconos que vive en el código
  -- (`src/lib/sitio/iconos.ts`). Texto y no enum, por lo de siempre: agregar
  -- un ícono en v2 no debería ser una migración de tipo.
  icono         text not null default 'llave',
  titulo        text not null check (length(btrim(titulo)) > 0),
  texto         text not null default '',
  orden_visual  smallint not null default 0,
  activo        boolean not null default true,
  creado_en     timestamptz not null default now()
);

create index destacado_orden_idx on destacado (orden_visual);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table galeria_imagen enable row level security;
alter table destacado enable row level security;

-- Público: solo lo activo, igual que el catálogo (ARQUITECTURA.md §12).
create policy "cualquiera ve la galeria activa" on galeria_imagen
  for select to anon, authenticated using (activo);

create policy "cualquiera ve los destacados activos" on destacado
  for select to anon, authenticated using (activo);

create policy "staff opera la galeria" on galeria_imagen
  for all to authenticated using (es_staff()) with check (es_staff());

create policy "staff opera los destacados" on destacado
  for all to authenticated using (es_staff()) with check (es_staff());

grant select on galeria_imagen, destacado to anon;
grant select, insert, update, delete on galeria_imagen, destacado to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: las fotos del sitio
-- ---------------------------------------------------------------------------

-- Bucket público de lectura: son las fotos del landing, no hay nada privado.
-- El límite de peso es la segunda defensa; la primera es el redimensionado en
-- el navegador antes de subir (ARQUITECTURA.md §13).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'sitio',
  'sitio',
  true,
  3145728, -- 3 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

create policy "cualquiera ve las fotos del sitio" on storage.objects
  for select to anon, authenticated using (bucket_id = 'sitio');

create policy "staff sube fotos del sitio" on storage.objects
  for insert to authenticated with check (bucket_id = 'sitio' and es_staff());

create policy "staff reemplaza fotos del sitio" on storage.objects
  for update to authenticated using (bucket_id = 'sitio' and es_staff());

create policy "staff borra fotos del sitio" on storage.objects
  for delete to authenticated using (bucket_id = 'sitio' and es_staff());

-- ---------------------------------------------------------------------------
-- Contenido inicial: los datos reales del taller
-- ---------------------------------------------------------------------------
--
-- Solo va acá lo que el taller ya publica por su cuenta (ficha de Google y su
-- propia descripción). Los horarios quedan vacíos a propósito: se sabe que
-- cierran 5:30 p. m., no a qué hora abren ni qué hacen los fines de semana, y
-- publicar un horario inventado es peor que no publicar ninguno.

update config_sitio set
  nombre_taller = 'SAF Service',
  slogan = 'Taller automotriz multimotriz',
  descripcion = 'Mecánica general para unidades livianas y pesadas en Sachaca, Arequipa.',
  telefono = '959 960 390',
  whatsapp = '959960390',
  email = 'safserviceeirl@gmail.com',
  direccion = 'Av. Fernandini 142, Sachaca, Arequipa',

  hero_titulo = 'Mecánica general para unidades livianas y pesadas',
  hero_subtitulo = 'Suspensión, cajas, motores a gasolina y diésel, escáner, planchado y pintura. Atendemos en Sachaca, Arequipa.',

  nosotros_titulo = 'El taller',
  nosotros_texto = 'Somos el taller multimotriz SAF SERVICE E.I.R.L. Trabajamos mecánica en general sobre unidades livianas y pesadas: sistema de suspensión, reparación de cajas, motores a gasolina y diésel, servicio de escáner, aire acondicionado, grúa, car wash y planchado y pintura.',

  horarios = '[]'::jsonb,
  actualizado_en = now()
where id = 1;

insert into destacado (icono, titulo, texto, orden_visual) values
  ('camion',  'Livianas y pesadas',      'La misma nave atiende un sedán y una unidad pesada.', 1),
  ('escaner', 'Diagnóstico con escáner', 'Antes de desarmar, se mide. El presupuesto sale de ahí.', 2),
  ('grua',    'Servicio de grúa',        'Si no arranca, lo recogemos.', 3),
  ('lista',   'Presupuesto por escrito', 'Se aprueba desde el celular antes de que empiece el trabajo.', 4);
