-- Cerrar las funciones y las tablas a la clave pública. Decisión 36.
--
-- El proyecto ya venía revocando `execute` a `anon` en las funciones que son
-- solo de staff. **No servía de nada**, y la razón es de PostgreSQL, no de
-- Supabase: al crear una función, Postgres le concede `execute` a `PUBLIC`, el
-- pseudo-rol al que pertenece todo el mundo. `revoke ... from anon` quita la
-- concesión nominal de anon y deja intacta la de PUBLIC, que anon hereda igual.
--
-- Comprobado contra la base con la clave pública: `buscar_vehiculo`,
-- `cambiar_estado_orden`, `guardar_diagnostico`, `enviar_presupuesto`,
-- `responder_presupuesto`, `registrar_evento`, `es_staff` y
-- `siguiente_correlativo` se ejecutaban sin sesión. Las tres que sí estaban
-- cerradas —`recepcionar_vehiculo`, `mover_orden`, `guardar_franjas`— son
-- justamente las que decían `from public, anon`.
--
-- Casi ninguna llegaba a hacer daño porque RLS filtraba todo lo que tocaban.
-- La excepción es `siguiente_correlativo`, que es `security definer` y por eso
-- se salta RLS: cualquiera podía inflar el correlativo y hacer que los números
-- de orden del taller den saltos. Se verificó creando la fila del año 1999 en
-- `contador_orden`, que se borró después.
--
-- De acá en adelante la regla es: **revocar de `public`, no de `anon`**, y
-- volver a conceder solo a quien la necesita.

-- ---------------------------------------------------------------------------
-- 1. Todo cerrado
-- ---------------------------------------------------------------------------

revoke execute on function
  public.es_staff,
  public.siguiente_correlativo,
  public.generar_token_publico,
  public.asignar_numero_orden,
  public.marcar_cierre_orden,
  public.espacio_con_cupo,
  public.recepcionar_vehiculo,
  public.cambiar_estado_orden,
  public.mover_orden,
  public.buscar_vehiculo,
  public.registrar_evento,
  public.guardar_diagnostico,
  public.guardar_presupuesto,
  public.enviar_presupuesto,
  public.responder_presupuesto,
  public.disponibilidad_reservas,
  public.crear_reserva,
  public.guardar_franjas
from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Y se vuelve a abrir lo justo
-- ---------------------------------------------------------------------------

-- Las dos que el sitio público llama con la clave pública (decisión 26). Llevan
-- las reglas adentro y son `security definer` a propósito.
grant execute on function
  public.disponibilidad_reservas,
  public.crear_reserva
to anon, authenticated;

-- Las del panel. `es_staff` va acá porque la evalúan las políticas de RLS en
-- cada consulta del staff, y `generar_token_publico` porque es el valor por
-- defecto de `orden_servicio.token_publico` y se evalúa como el rol que inserta.
grant execute on function
  public.es_staff,
  public.generar_token_publico,
  public.recepcionar_vehiculo,
  public.cambiar_estado_orden,
  public.mover_orden,
  public.buscar_vehiculo,
  public.registrar_evento,
  public.guardar_diagnostico,
  public.guardar_presupuesto,
  public.enviar_presupuesto,
  public.guardar_franjas
to authenticated;

-- La respuesta del cliente al presupuesto no la llama ninguna sesión: la llama
-- el servidor con la clave de servicio al resolver `/o/{token}` (decisión 7).
-- Se le concede explícitamente porque `service_role` también heredaba de
-- PUBLIC y acaba de perder esa herencia.
grant execute on function public.responder_presupuesto to service_role;

-- `scripts/datos-prueba.js` abre y mueve órdenes con la clave de servicio, y
-- también acaba de perder la herencia de PUBLIC. Se le conceden esas dos y
-- ninguna más. No es una ampliación real de poder: la clave de servicio se
-- salta RLS y ya puede escribir cualquier tabla a mano; negarle dos funciones
-- no la limita, solo rompe la herramienta.
grant execute on function
  public.recepcionar_vehiculo,
  public.cambiar_estado_orden
to service_role;

-- `siguiente_correlativo`, `asignar_numero_orden`, `marcar_cierre_orden` y
-- `espacio_con_cupo` no reciben nada: las dos primeras las invoca el disparador
-- `asignar_numero_orden`, que es `security definer` y corre como su dueño, y
-- las otras dos son funciones de disparador que no se pueden llamar a mano.

-- ---------------------------------------------------------------------------
-- 3. Las tablas que la clave pública no tiene por qué ni rozar
-- ---------------------------------------------------------------------------
--
-- Hoy RLS ya devuelve cero filas en todas ellas —está verificado—, pero eso
-- deja una sola capa entre un visitante y los datos de los clientes: una
-- política nueva mal escrita los publicaría al instante. Quitar además el
-- permiso de tabla pone una segunda, y no cuesta nada porque el sitio público
-- no lee ninguna de estas.
--
-- Se quedan como están las cuatro que sí alimentan el landing: `config_sitio`,
-- `servicio_catalogo`, `galeria_imagen` y `destacado`.

revoke all on
  cliente,
  vehiculo,
  espacio,
  orden_servicio,
  evento_orden,
  diagnostico,
  presupuesto,
  linea_presupuesto,
  perfil
from anon;
