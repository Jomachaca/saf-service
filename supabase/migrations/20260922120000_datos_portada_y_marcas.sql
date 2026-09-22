-- Dos listas más para el landing, del rediseño (decisión 33).
--
-- La portada lleva una banda de cuatro datos duros bajo el titular, y «El
-- taller» una fila de marcas de vehículo que se atienden. Las dos son parte
-- del diseño, pero ninguna se puede inventar desde acá: cuántos años lleva el
-- taller o qué marcas toca lo sabe el taller. Así que entran como campos del
-- CMS, vacíos, y cada bloque no se pinta hasta que alguien los llene.
--
-- Van en `config_sitio` y no en tablas propias, como los horarios: son listas
-- cortas, de orden fijo y sin nada que encender o apagar por fila.

alter table config_sitio
  add column datos_portada jsonb not null default '[]'::jsonb,
  add column marcas jsonb not null default '[]'::jsonb;

comment on column config_sitio.datos_portada is
  'Banda de datos de la portada. [{ "valor": "+12 años", "etiqueta": "atendiendo en Arequipa" }]. Máximo cuatro; el número de orden lo pone el sitio.';

comment on column config_sitio.marcas is
  'Marcas de vehículo que atiende el taller, en orden. ["Toyota", "Hyundai"].';
