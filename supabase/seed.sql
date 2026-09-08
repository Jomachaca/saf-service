-- Datos iniciales. Corre sobre base vacía (`supabase db reset`).
--
-- OJO CON LOS PRECIOS: son marcadores de posición para poder probar el flujo,
-- no la lista real del taller. Se editan desde /admin/catalogo. Están en
-- céntimos (decisión 6): 18000 = S/ 180.00.

-- Boxes: 4 sedán + 1 grande (ARQUITECTURA.md §4). El taller puede agregar más
-- desde el panel; no son constantes de código.
insert into box (nombre, tipo, orden_visual) values
  ('Box 1',       'SEDAN',  1),
  ('Box 2',       'SEDAN',  2),
  ('Box 3',       'SEDAN',  3),
  ('Box 4',       'SEDAN',  4),
  ('Box Grande',  'GRANDE', 5);

-- Catálogo base, con la taxonomía de ARQUITECTURA.md §6.
insert into servicio_catalogo (categoria, nombre, precio_base_centimos, duracion_min, orden_visual) values
  -- 1. Mantenimiento programado
  ('MANTENIMIENTO', 'Cambio de aceite y filtros',            18000,  45,  1),
  ('MANTENIMIENTO', 'Revisión de frenos',                     8000,  30,  2),
  ('MANTENIMIENTO', 'Revisión periódica completa',           15000,  90,  3),
  ('MANTENIMIENTO', 'Rotación y balanceo de neumáticos',      6000,  40,  4),
  ('MANTENIMIENTO', 'Alineación',                             7000,  40,  5),

  -- 2. Reparaciones y diagnóstico
  --
  -- "Diagnóstico con escáner" es el destino de la opción "No sé qué tiene /
  -- suena raro" del formulario de reserva (decisión 15). Si se le cambia el
  -- nombre, revisar ese formulario.
  ('REPARACION',    'Diagnóstico con escáner',                8000,  60,  10),
  ('REPARACION',    'Diagnóstico de motor y transmisión',    12000,  90,  11),
  ('REPARACION',    'Reparación de frenos y suspensión',     25000, 180,  12),
  ('REPARACION',    'Sistema eléctrico',                     15000, 120,  13),
  ('REPARACION',    'Sistema de escape',                     18000, 120,  14),

  -- 3. Carrocería y estética
  ('CARROCERIA',    'Chapa y pintura (por panel)',           35000, 480,  20),
  ('CARROCERIA',    'Lavado y detallado',                     5000,  90,  21),

  -- 4. Especializados
  ('ESPECIALIZADO', 'Revisión Pre-ITV',                      10000,  60,  30),
  ('ESPECIALIZADO', 'Instalación de accesorios',              9000,  90,  31);
