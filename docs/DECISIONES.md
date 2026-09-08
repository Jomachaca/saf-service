# Decisiones

Registro de qué se decidió y por qué. Si vas a cambiar algo de acá, lee primero
la razón — casi todas nacieron de un problema concreto.

---

## 1. La Orden de Servicio es la entidad central, no la Reserva

**Decisión:** el agregado raíz es `orden_servicio`. La reserva es un canal de entrada.

**Por qué:** la mayoría de estos sistemas empiezan con "reservas" como entidad
central y a los dos meses descubren que el grueso de los autos llega sin cita.
Un vehículo puede entrar por reserva, walk-in, llamada o WhatsApp, y todos siguen
el mismo flujo interno.

**Consecuencia:** `Reserva ≠ OrdenServicio`. Nunca unificarlas. Una reserva se
convierte en orden al llegar el vehículo; una orden puede nacer sin reserva.

---

## 2. Ubicación separada del estado

**Decisión:** `orden.estado` y `orden.ubicacion` son columnas independientes.

**Por qué:** un auto esperando repuestos no ocupa un box, ocupa el patio. Si el
box queda atado al estado, el personal empezará a mentirle al sistema para
liberar espacio, y el tablero dejará de reflejar la realidad.

---

## 3. Cinco estados en v1, no nueve

**Decisión:** `RECIBIDO`, `DIAGNOSTICO`, `ESPERANDO_APROBACION`, `EN_TRABAJO`, `LISTO`.

**Descartados por ahora:** `RESERVADO` (vive en la tabla de reservas),
`ESPERANDO_RECOJO` (era lo mismo que `LISTO` con otro nombre),
`ESPERANDO_REPUESTOS` y `ENTREGADO` (se agregan cuando el taller los pida en uso real).

**Por qué:** cada estado extra son transiciones, filtros, colores y bugs. Es más
barato agregar un estado en v2 que quitarlo cuando ya hay datos.

---

## 4. Reservas por cupos, no por capacidad calculada

**Decisión:** cupos fijos configurables por franja horaria.

**Descartado:** calcular capacidad real con `tipo de vehículo + servicio + duración
+ boxes libres`.

**Por qué:** eso es un problema de scheduling, y es donde se mueren estos proyectos.
Con 5 boxes, nadie va a notar la diferencia entre un motor de capacidad y un
contador de cupos. Se ahorran semanas.

---

## 5. Los precios se copian al presupuesto

**Decisión:** `linea_presupuesto.precio_unitario_centimos` guarda una copia. La
referencia al catálogo es solo trazabilidad y nunca se usa para leer el precio.

**Por qué:** si en marzo sube el precio del cambio de aceite, los presupuestos de
enero deben seguir mostrando lo que se cobró en enero.

---

## 6. Dinero en enteros

**Decisión:** todos los montos en céntimos, tipo entero.

**Por qué:** `float` acumula error en sumas. Es la clase de bug que aparece en
producción cuando el total no cuadra por un céntimo y nadie sabe por qué.

**Pendiente relacionado:** decidir desde el día uno si el monto mostrado incluye
IGV o no, y dejarlo explícito en la UI.

---

## 7. Token aleatorio en el link público

**Decisión:** `/o/{token}` con token aleatorio, no `/orden/OS000182`.

**Por qué:** un número de orden secuencial es adivinable. Detrás del link hay
placa, nombre del dueño y fotos del vehículo. Enumerar órdenes ajenas no puede
ser trivial.

**Consecuencia:** la resolución del token pasa por servidor con service role.
Nunca por el cliente con anon key.

---

## 8. El mensaje de WhatsApp lleva un link, no el presupuesto

**Decisión:** mensaje corto + link a la vista del cliente con botón de aprobar.

**Descartado:** enviar el diagnóstico y el detalle de precios como texto en WhatsApp.

**Por qué, tres razones:**
- Se ve mal como texto plano.
- Queda congelado: si se corrige un precio, el mensaje ya salió.
- No deja constancia de que el cliente aprobó, ni sobre qué versión.

---

## 9. `wa.me` en v1, no WhatsApp Cloud API

**Decisión:** generar links `wa.me` con texto prellenado; el recepcionista da click.

**Por qué:** la Cloud API exige verificación de negocio y las plantillas cuestan.
Con `wa.me` el flujo real del taller es idéntico, es gratis y funciona hoy.

**Consecuencia importante:** `wa.me` no devuelve confirmación de entrega. Registrar
el evento como `LINK_GENERADO`, nunca como "cliente notificado". No se le miente
a la base de datos.

---

## 10. Se llama presupuesto, no boleta

**Decisión:** la palabra en código, UI y documentación es **presupuesto** (o proforma).

**Por qué:** en Perú "boleta" es un comprobante SUNAT. Si el taller después necesita
comprobantes reales, eso implica facturación electrónica con un OSE y es otro
proyecto. Separarlo desde el nombre evita que alguien asuma que ya está resuelto.

---

## 11. CMS de campos fijos, no editor de páginas

**Decisión:** `config_sitio` es una fila con un esquema fijo. El admin llena campos.

**Descartado:** construir un mini-WordPress con bloques o editor libre.

**Por qué:** con campos fijos el diseño nunca se rompe, porque el admin no puede
tocarlo. Un editor libre convierte cada cambio del dueño en un posible incidente
visual.

---

## 12. Un solo flujo de presupuesto

**Decisión:** una sola tabla de líneas y un solo formulario. El catálogo de
servicios es un atajo de autocompletado.

**Descartado:** pantallas separadas de "modo automático" (rutina) y "modo manual"
(caso especial).

**Por qué:** el 80% rutinario toma diez segundos con el catálogo, y el 20% raro
sigue siendo posible sin código aparte ni ramas divergentes.

---

## 13. Sin backend separado

**Decisión:** route handlers y server actions dentro del mismo proyecto Next.js.

**Por qué:** un backend aparte duplica despliegue, costo y superficie de error sin
aportar nada a esta escala.

---

## 14. Log de eventos append-only

**Decisión:** `evento_orden` registra cada cambio relevante y nunca se edita.

**Por qué:** el historial de cambios sale gratis, y ante un reclamo del cliente
existe un registro de qué se dijo y cuándo. Guardar solo el estado actual pierde
toda esa información.

---

## 15. "No sé qué tiene" es la primera opción del formulario

**Decisión:** la opción más visible del formulario de reserva es *"No sé qué tiene /
suena raro"*, que entra como Diagnóstico.

**Por qué:** el cliente promedio no sabe en qué categoría técnica cae su problema.
Esa va a ser la opción más usada; esconderla dentro de "Reparaciones" agrega
fricción sin ganar nada.

---

# Decisiones resueltas al iniciar la Fase 0

Las seis preguntas que `ROADMAP.md` listaba como abiertas. Se numeran a
continuación de las anteriores para que las referencias no se pisen; entre
paréntesis, el número que tenían en la tabla del roadmap.

---

## 16. El IGV es configurable (roadmap #1)

**Decisión:** un flag en `config_sitio` determina si los precios del catálogo y
del presupuesto se interpretan como *precio final con IGV incluido* o como *base
imponible a la que se le suma IGV*.

**Descartado:** fijarlo como "incluido" a secas. El taller todavía no sabe si va a
mostrar el IGV desglosado, y dejarlo fijo obligaba a migrar datos después.

**Consecuencias:**

- `config_sitio` lleva `igv_incluido boolean` y `igv_tasa_bp integer` (tasa en
  *basis points*: 1800 = 18 %). Guardar la tasa evita reescribir presupuestos
  históricos si el IGV cambia.
- El presupuesto materializa `subtotal_centimos`, `igv_centimos` y
  `total_centimos` al emitirse. Por la misma razón de la decisión 5: el
  presupuesto que el cliente vio y aprobó no puede mutar porque después alguien
  tocó la configuración.
- El cálculo vive en una sola función pura. Ninguna vista recalcula IGV por su
  cuenta.

---

## 17. Botón "Publicar cambios" (roadmap #2)

**Decisión:** `/admin/config` guarda en la base sin publicar. Un botón explícito
revalida el landing y las páginas públicas. Resuelve el pendiente de
`ARQUITECTURA.md` §14.

**Descartado:** revalidar automáticamente en cada guardado.

**Por qué:** editar horarios, galería y plantillas son varios guardados seguidos.
Con revalidación automática el sitio público queda a medias entre uno y otro.

**Consecuencia:** `config_sitio` lleva `actualizado_en` y `publicado_en`. Si
`actualizado_en > publicado_en`, el panel avisa que hay cambios sin publicar.

---

## 18. Supabase Auth con email (roadmap #3)

**Decisión:** cuentas por email con Supabase Auth desde el día uno.

**Descartado:** un usuario único compartido por todo el taller.

**Por qué:** `evento_orden` guarda `actor`. Con cuenta compartida ese campo no
responde "quién movió esta orden", y esa información no se puede recuperar
después. Es la decisión 14 la que vuelve esto no negociable.

**Consecuencia:** tabla `perfil` ligada a `auth.users`. No hay registro público:
las cuentas se crean desde Supabase.

---

## 19. Un solo rol en v1 (roadmap #4)

**Decisión:** solo `admin`. `perfil.rol` ya existe como columna aunque hoy tome un
único valor.

**Descartado por ahora:** `mecanico` y `recepcion`.

**Por qué:** mismo criterio que la decisión 3 sobre los estados — es más barato
agregar un rol en v2 que quitarlo cuando ya hay políticas de RLS escritas contra
él. Dejar la columna desde el principio hace que agregarlos sea una política
nueva, no una migración de datos.

---

## 20. Número de orden por año: `OS-2026-0182` (roadmap #5)

**Decisión:** formato `OS-{año}-{correlativo de 4 dígitos}`, reiniciando cada año.
Reemplaza el `OS-000182` que figuraba como borrador en `ARQUITECTURA.md` §5.

**Consecuencias:**

- `orden_servicio` lleva `anio smallint` y `correlativo integer`, con índice único
  compuesto `(anio, correlativo)`. El número visible es una columna generada.
- El correlativo se asigna dentro de una función en la base con bloqueo, no desde
  la aplicación: dos recepciones simultáneas no pueden tomar el mismo número.
- Cuatro dígitos toleran 9 999 órdenes al año.

**Nota:** esto no toca la decisión 7. El número de orden sigue sin aparecer en el
link público; `/o/{token}` usa el token aleatorio.

---

## 21. es-PE y `America/Lima` (roadmap #6)

**Decisión:** `<html lang="es-PE">`; las marcas de tiempo se guardan en
`timestamptz` (UTC) y se formatean en `America/Lima` al mostrar.

**Por qué:** Perú no tiene horario de verano, así que la tentación es guardar hora
local y olvidarse. Guardar en UTC y formatear en el borde cuesta lo mismo hoy y
no obliga a revisar datos si algún día el servidor cambia de zona.

**Consecuencia:** el formateo vive en un solo módulo. Ninguna vista llama a
`toLocaleString` con sus propias opciones.

---

## 22. Cache Components activado

**Decisión:** `cacheComponents: true` en `next.config.ts`. Los datos son dinámicos
por defecto y se cachea explícitamente con `use cache`.

**Descartado:** el modelo de caché anterior con `revalidatePath` sobre rutas.

**Por qué:** el botón "Publicar cambios" de la decisión 17 necesita invalidar
exactamente la configuración del sitio, no una ruta entera. Con `cacheTag` el
landing declara de qué depende y `revalidateTag` invalida solo eso. Es además el
modelo que Next 16 documenta como vigente; el anterior aparece como "modelo
previo".

**Consecuencias:**

- El landing y `/servicios` van con `use cache` + `cacheTag`.
- El panel es dinámico: lee sesión y datos en cada request. Todo lo dinámico
  dentro de una página con shell estático necesita su `<Suspense>` explícito.
- Requiere runtime de Node. Ninguna ruta puede declarar `runtime = 'edge'`.

---

## 23. Las transiciones de estado son estrictamente lineales

**Decisión:** hacia adelante, la orden avanza de a un paso:
`RECIBIDO → DIAGNOSTICO → ESPERANDO_APROBACION → EN_TRABAJO → LISTO`.
Desde cualquier estado se puede ir a `LISTO`. No hay saltos hacia adelante ni
retrocesos.

**Descartado:** permitir `RECIBIDO → EN_TRABAJO` para trabajos de precio conocido,
y `DIAGNOSTICO → EN_TRABAJO` para aprobaciones de palabra en el mostrador.

**Por qué:** ambos atajos producen órdenes sin presupuesto asociado, que es
justamente la constancia que motiva la decisión 8. Si el taller pide el atajo en
uso real, agregar una transición es barato; quitarla cuando ya hay órdenes sin
presupuesto, no.

**Consecuencia:** la función pura de transición acepta una tabla de adyacencia
cerrada. Cualquier par que no esté en la tabla es un error, no un caso especial.
