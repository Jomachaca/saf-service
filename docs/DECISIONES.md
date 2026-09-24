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

---

## 24. El sistema visual sale del logo, no de una paleta inventada

**Decisión:** los dos colores de la marca son el granate de la «S» y el azul
marino de «AF SERVICE» del logo del taller. El granate marca lo que se pulsa; el
marino, la estructura. Titulares en Barlow Condensed, que es lo más cercano en
Google Fonts al lettering italic condensado del logo, y Barlow para el texto.

**Descartado:** elegir una paleta «bonita» por nuestra cuenta, y también usar el
logo tal cual como única presencia de marca.

**Por qué:** el taller ya tiene identidad, la usa en Facebook y en su fachada.
Una web con otros colores se ve como de otra empresa. Y una identidad que solo
existe dentro de un archivo PNG no sirve para pintar botones ni cabeceras.

**Consecuencia:** el panel usa el mismo sistema que el sitio público. Pasar del
landing al panel no se siente como cambiar de aplicación.

---

## 25. El landing se cachea entero y se invalida al publicar

**Decisión:** `cargarSitio()` es un `use cache` con `cacheLife("max")` y
`cacheTag("sitio")`. Guardar en `/admin/config` escribe en la base y no toca el
caché; el botón «Publicar cambios» llama a `updateTag("sitio")`.

**Descartado:** leer la configuración en cada visita.

**Por qué:** es lo que hace real la decisión 17. Sin caché, «publicar» no
significaría nada porque cada visita ya vería lo último guardado, incluido el
horario a medio escribir.

**Consecuencia:** hizo falta un cuarto cliente de Supabase (`publico.ts`, clave
pública y sin cookies), porque dentro de un `use cache` no se puede leer
`cookies()` y `server.ts` las lee siempre.

---

## 26. Las reservas públicas entran por funciones de la base, no por la clave de servicio

**Decisión:** `/reservar` lee los cupos con `disponibilidad_reservas()` y reserva
con `crear_reserva()`, dos funciones `SECURITY DEFINER` que puede ejecutar la
clave pública. Las tres tablas nuevas (`reserva`, `franja`, `dia_cerrado`) no
tienen políticas ni privilegios para anon.

**Descartado:** escribir la reserva desde la acción de Next con `admin.ts`.

**Por qué:** la clave de servicio se salta RLS entera y tiene un solo uso
justificado, resolver `/o/{token}` (decisión 7). Colgarle un formulario abierto
al público la convertía en el punto más expuesto del sistema. Y validar solo en
la acción no alcanza: la clave pública está en el navegador, así que cualquiera
puede llamar a la base sin pasar por Next. Las reglas tienen que vivir donde no
se pueden saltar.

**Consecuencias:**

- Cupos, anticipación, días cerrados y el tope de tres reservas pendientes por
  celular están dentro de `crear_reserva()`. La acción solo contesta rápido lo
  evidente.
- Las funciones devuelven números o nada. Ni el id de la reserva sale hacia
  quien no tiene sesión.
- Riesgo aceptado: alguien con un script y celulares inventados podría llenar
  cupos. Se ve en la agenda, se cancela y, si hace falta, se apagan las
  reservas desde el panel en un clic (decisión 29). Un captcha entra cuando
  pase, no antes.

---

## 27. Cupos por día de la semana y hora; la reserva copia su fecha y su hora

**Decisión:** `franja (dia_semana, hora, cupos)` es una plantilla semanal. La
reserva guarda `fecha` y `hora` como valores, sin apuntar a la franja. Ocupan
cupo las reservas `PENDIENTE`, `CONFIRMADA` y `CONVERTIDA`; `NO_ASISTIO` y
`CANCELADA` lo liberan. Se reserva con al menos dos horas de anticipación y
hasta `reservas_dias` días adelante, y `dia_cerrado` saca feriados del
formulario.

**Descartado:** una sola lista de horas para toda la semana, porque un sábado
de medio día no cabía, y cupos distintos por fecha concreta.

**Por qué:** es la decisión 4 llevada a tablas: un contador, no un motor de
capacidad. Copiar fecha y hora sigue la lógica de la decisión 5 con los
precios: si el taller cambia su horario en noviembre, las reservas de octubre
no se mueven ni desaparecen de la agenda.

**Consecuencias:**

- El conteo y la inserción van bajo un bloqueo por día y hora
  (`pg_advisory_xact_lock`). Dos personas que piden el último cupo a la vez
  quedan en fila, y la segunda ya ve la reserva de la primera.
- Cerrar un día no cancela lo que ya estaba reservado. La pantalla dice cuántas
  hay; qué hacer con ellas lo decide una persona.
- El horario arranca vacío. El botón de horario base llena la tabla pero no
  guarda: publicar un horario inventado es el mismo error que la decisión de no
  inventar el del landing.

---

## 28. «Recibir» abre la recepción, y la conversión va en la misma transacción

**Decisión:** el botón «Recibir» de la agenda lleva a
`/admin/ingreso?reserva={id}`, con la búsqueda arrancada por la placa o el
celular y el motivo y los datos del cliente ya puestos. `recepcionar_vehiculo()`
recibe `p_reserva_id` y marca la reserva como `CONVERTIDA` en la misma
transacción que crea la orden.

**Descartado:** convertir con un solo clic sin pasar por la recepción, y un
botón de «marcar recibida».

**Por qué:** una orden necesita un vehículo con marca y modelo, y una reserva no
los tiene: pedirlos en el formulario público espanta a quien reserva. La
recepción ya es el camino de 60 segundos, y con la reserva quedan menos campos.
Hacerlo en dos pasos separados permitiría una reserva convertida sin orden
detrás, o una orden cuya reserva sigue apartando cupo.

**Consecuencias:**

- Si alguien cancela la reserva mientras se recibe el vehículo, no se crea
  nada: ni la orden, ni el cliente, ni el vehículo.
- `buscar_vehiculo()` compara la placa sin guiones ni espacios y el teléfono
  solo por dígitos. Los datos de una reserva los escribe el cliente, y "abc-123"
  tiene que encontrar a "ABC123" antes de que alguien registre el mismo auto dos
  veces.

---

## 29. El interruptor de reservas se lee en vivo; el botón de la portada, al publicar

**Decisión:** `config_sitio.reservas_activas` lo leen en cada visita `/reservar`
y `crear_reserva()`. El botón «Reservar hora» del landing sale del contenido
publicado, como el resto de la portada (decisión 25).

**Descartado:** que el interruptor también esperara a publicar, y que moverlo
publicara la portada entera.

**Por qué:** apagar las reservas es una acción de emergencia (el taller se llenó,
alguien abusa del formulario) y tiene que cortar en el momento. Publicar la
portada al mover el interruptor, en cambio, sacaría a la luz cualquier otro
cambio a medio hacer, que es justo lo que la decisión 17 evita.

**Consecuencias:**

- Entre apagar y publicar, la portada puede mostrar el botón y `/reservar`
  responder que las reservas están pausadas, con WhatsApp al lado. Es un
  desfase aceptable.
- Solo mover el interruptor marca «cambios sin publicar»; los días hacia adelante
  y el mensaje de confirmación no tocan la portada.
- No se puede encender sin horario, ni dejar el horario vacío con las reservas
  encendidas.

---

## 30. «No sé qué tiene» es una reserva sin servicio

**Decisión:** la primera opción del formulario (decisión 15) guarda
`servicio_id` en NULL y el motivo «No sé qué tiene / suena raro». Cuando el
cliente sí elige un servicio, su nombre se copia en `reserva.motivo`.

**Descartado:** apuntar esa opción a «Diagnóstico con escáner» del catálogo,
como proponía el comentario del seed.

**Por qué:** el catálogo lo edita el taller. Atar la opción más usada del
formulario al nombre de un servicio la rompía el día que alguien lo renombrara
o lo apagara.

---

## 31. El panel se recorre con una barra lateral de pocas entradas

**Decisión:** el panel deja la cabecera con enlaces y pasa a una barra lateral
con seis entradas en dos grupos. Arriba, lo del día a día: Tablero, Recepción y
Agenda. Abajo, bajo «Configuración»: Reservas, Catálogo y Sitio web. Una
pantalla que apila formularios se parte en partes con su propia ruta, y las
partes aparecen en la barra solo dentro de su sección.

**Descartado:** conservar la cabecera y resolver lo largo con un índice que
salta dentro de la misma página, y una entrada de la barra por cada formulario.

**Por qué:** «Sitio» era una sola página con ocho formularios uno debajo de
otro, y había que bajar hasta dar con el que se buscaba. El interruptor de las
reservas estaba ahí, pero sus cupos colgaban de la agenda, con un enlace de ida
y otro de vuelta. Un índice deja la página igual de larga, y una entrada por
formulario cambia el scroll por una barra que tampoco se abarca de un vistazo.

**Consecuencias:**

- `/admin/reservas` junta el interruptor, los cupos por hora y los días
  cerrados, que antes estaban en `/admin/agenda/horario` y en un bloque de
  `/admin/config`.
- `/admin/config` pasa a `/admin/sitio`, en tres partes: datos y contacto,
  portada (titular y «Cómo trabajamos») y el taller (presentación y galería).
  Las dos rutas viejas redirigen, sin marcarse como permanentes.
- El IGV y el mensaje del presupuesto salieron del sitio y van al pie del
  catálogo, que es donde se decide cómo se leen los precios. No salen en la web
  pública, así que guardarlos ya no marca «cambios sin publicar».
- El interruptor de reservas quedó fuera de «Sitio web» y sigue dejando la
  portada pendiente de publicar (decisión 29). Por eso «Sitio web» muestra «Sin
  publicar» en la barra desde cualquier pantalla.
- Las pantallas miden su columna con `@container`, no la pantalla: con la barra
  lateral, un `lg:` cree tener 1024 px donde quedan poco más de 720.
- En el celular la barra es un cajón, un `<dialog>` modal que abre el botón de
  la franja marina de arriba.

---

## 32. El landing se mueve, y el movimiento es de CSS

**Decisión:** el sitio público lleva una capa de movimiento propia, toda en
`globals.css` y sin librería. Las secciones aparecen al entrar en pantalla y
escalonadas, los enlaces de la barra y del pie se subrayan desde el centro, una
cinta de servicios corre en bucle debajo de la portada, y el botón principal
suelta un anillo y sacude su ícono cada siete segundos. En el celular hay además
una burbuja fija de WhatsApp. El pie pasa a cuatro columnas y pierde el enlace
«Acceso del personal».

**Descartado:** traer Motion o GSAP, y hacer la cinta con las fotos de la
galería.

**Por qué:** la página ya tenía apariciones al hacer scroll, pero tan cortas que
no se notaban, y fuera de eso nada se movía. Una librería de animación pesa más
que todo el CSS del sitio junto, y el visitante típico entra desde un estado de
WhatsApp con datos móviles. La cinta va con servicios y no con fotos porque el
taller tiene catorce servicios cargados y ninguna foto en la galería: un
carrusel vacío no es un carrusel.

**Consecuencias:**

- ~~Todo lo que se mueve solo está detrás de `prefers-reduced-motion`.~~
  **Revertido.** Estuvo así hasta que el taller revisó el sitio en su máquina,
  que tiene apagadas las animaciones de Windows, y no se movía nada. Se le
  explicó que era el comportamiento correcto y que ese ajuste también lo usan
  las personas a las que el movimiento les provoca mareo; pidió igualmente que
  la configuración de su sistema no afectara a la página. Es su sitio, así que
  el sitio se mueve siempre. Lo que queda de esa idea es que la página nunca
  se rompe si el movimiento no ocurre: las apariciones siguen detrás de un
  `@supports`, y donde el navegador no entiende la línea de tiempo de scroll
  el contenido se ve normal en vez de quedarse invisible.
- Las utilidades nuevas viven en `@layer components`. Sin capa, una regla
  propia le gana a cualquier utilidad de Tailwind: `.pulso` fija
  `position: relative` y se comía el `fixed` de la burbuja.
- El escalonado corre el rango de scroll con `--paso` en vez de usar
  `animation-delay`, porque en una línea de tiempo de scroll el tiempo lo pone
  el dedo de quien mira y no el reloj.
- La cinta repite nombres que ya están en «Servicios», así que va entera con
  `aria-hidden`: lo que aporta es visual.
- El mapa se arma con la dirección cuando nadie pegó un enlace de Google
  (`mapaIncrustado`). El campo «Mapa» del panel queda para marcar el punto
  exacto, no para que el mapa exista.
- Al panel se entra por `/admin` o `/acceso`, escribiéndolo. El enlace del pie
  lo usaban dos personas y lo veían todas.
- El indicador de desarrollo de Next queda apagado: abajo a la izquierda tapaba
  el pie de la barra lateral del panel y abajo a la derecha tapa la burbuja.

---

## 33. El sitio pasa al lenguaje de plano técnico

**Decisión:** el landing se rehace con el rediseño que trajo el taller, hecho
aparte en Claude Design. El fondo pasa a papel blanco, los radios se van a
cero, los titulares crecen en Barlow Condensed 700 en mayúsculas, y todo lo que
es un objeto —tarjetas, figuras y el botón primario— se dibuja como una pieza
de plano: filete de un pixel y cuatro marcas de registro «+» fuera de la caja.
Las fotos entran en duotono de acero.

**Descartado:** la paleta del sistema «Industry» del que salió el rediseño, que
es azul acero monocromo; y cambiar los íconos a Lucide, que es lo que ese
sistema pide.

**Por qué:** el granate y el marino salen del logo y son del taller, no de un
tema; la hoja de entrega del rediseño ya venía con esa corrección hecha y es la
que se usó. Los íconos se quedan en Phosphor porque el catálogo de destacados
(decisión 11) está escrito contra esa librería y mezclar dos familias de íconos
en la misma aplicación se nota más que la diferencia de trazo entre una y otra.

**Consecuencias:**

- `--radius-*` vale cero en `@theme`, así que los `rounded-lg` y
  `rounded-2xl` que ya estaban escritos quedan cuadrados solos, en el sitio y
  en el panel. `rounded-full` sigue vivo: las píldoras de estado siguen
  siendo píldoras.
- Clases nuevas en `globals.css`: `.plano` con sus `.esquina`, `.reglilla`,
  `.duotono`. Y dos que cambiaron de nombre: `.trama-neumatico` es `.huella` y
  `.pulso` es `.llama` (con `.llama-b` para desfasar el segundo botón).
- El logo del taller viaja en el repositorio, en `public/marca/`, en versión de
  tinta y en blanca. Un logo cargado desde «Sitio web» le sigue ganando.
- **Se quitó el modo oscuro automático.** El sistema anterior invertía los
  tokens con `prefers-color-scheme: dark`, y con el lenguaje nuevo eso deja de
  funcionar: el contraste del diseño no está en el color del texto sino en la
  alternancia entre las secciones de papel y los bloques marinos. Invertida la
  paleta, el papel se vuelve marino oscuro, el bloque marino también, y la
  página entera queda de un solo tono —que es exactamente lo que reportó el
  taller, que tiene Windows en oscuro—. `:root` declara `color-scheme: light`
  para que las barras de desplazamiento y los calendarios de los campos de
  fecha salgan claros igual.
- Los dos bloques del rediseño que piden datos del negocio —la banda de cuatro
  cifras bajo la portada («+12 años», «5 boxes»…) y las marcas de vehículos en
  «El taller»— están construidos, pero **no traen contenido de fábrica**. Las
  cifras de la maqueta eran de relleno y el landing no inventa datos del
  negocio, así que entraron como dos campos más del CMS
  (`config_sitio.datos_portada` y `config_sitio.marcas`): vacíos, cada bloque
  no se pinta hasta que alguien los llene desde «Sitio web». Es el mismo
  criterio que ya rige el horario y la galería.
- El panel entró después, por sus piezas compartidas: la barra lateral con
  filete de marca en la entrada encendida, las cabeceras con su versalita y su
  filete, los bloques de configuración como marcos de plano, los campos con
  etiqueta en versalitas, y el tablero con las cifras en condensada sobre una
  retícula de filetes. Las cinco insignias de estado dejaron los colores
  sueltos por una sola escala de acero a granate.
- `/reservar`, `/acceso` y la vista pública de la orden heredan los tokens
  —papel, cantos vivos, titulares condensados— y no se rehicieron pantalla por
  pantalla: con el sistema cambiado ya se leen del mismo lenguaje.
- La carpeta `diseno/` con el proyecto importado se queda fuera del
  repositorio (está en `.gitignore` y fuera de ESLint): es material de
  referencia, no código del sitio.

---

## 34. La agenda es un calendario semanal, y las acciones viven en la lámina

**Decidido.** La agenda se mira por semanas completas, de lunes a domingo, en
una cuadrícula: las horas del horario del taller son las filas y cada día una
columna. La semana viaja en la dirección (`?desde=`). Una reserva se lee en
tres pasos —la cita, la ficha que se asoma al pasar el mouse, la lámina— y
todo lo que cambia el estado de una reserva vive en la lámina.

**Por qué.**

Era una lista de días, uno debajo del otro, con los botones de confirmar,
cancelar y «no asistió» en cada fila. Funcionaba, pero contestaba mal la
pregunta con la que se abre la agenda: *cómo viene la semana*. En una lista
eso hay que reconstruirlo leyendo y sumando; en una cuadrícula se ve de un
vistazo qué día está cargado, qué mañana está libre y dónde hay un hueco a las
once. Es la forma que ya tiene aprendida cualquiera que haya usado un
calendario, y el taller no tiene por qué aprender otra.

Partir la lectura en tres pasos no es decoración: es lo que permite que la
casilla sea chica. Una casilla de 90 px no puede decir nombre, vehículo, placa,
motivo y estado; la ficha que se asoma sí, y sin sacar a nadie de la semana.

**Que la cuadrícula no actúe es la mitad de la decisión.** Los botones estaban
en la fila porque la fila era ancha. En una casilla de 90 px, un «cancelar» a
un clic de distancia es un accidente esperando. Cancelar y «no asistió» no
tienen vuelta atrás (decisión 28 y `estados.ts`), así que ahora hay que abrir
la lámina y, dentro, confirmar: dos gestos deliberados en vez de uno
distraído. Confirmar sigue siendo de un clic, porque se puede confirmar y
después cancelar.

**Fuera del horario no es lo mismo que libre.** Las horas en que el taller no
atiende ese día y los días cerrados van rayados, no vacíos: en una hora vacía
hay cupo que ofrecer, y en una rayada no. El horario sale de la tabla `franja`
y el rayado de la clase `.tramado`.

**Las filas incluyen las horas de las reservas ya tomadas**, aunque ya no estén
en el horario. Si el taller mueve su horario, una reserva vieja podría caer en
una hora que ya no se ofrece, y tiene que seguir viéndose: una reserva que
existe no desaparece de la pantalla porque cambió una configuración.

**Lo que quedó sin cerrar se muestra arriba, pero solo si no está a la vista.**
Es el recordatorio de lo que ya se debió decidir; si esa reserva cae dentro de
la semana que se está mirando, ya está en su casilla y repetirla sería la misma
reserva dos veces en la misma pantalla.

**Descartado:** guardar la semana en el estado del componente. Con la fecha en
la dirección, la flecha de «atrás» funciona, una semana se puede dejar abierta
en otra pestaña y el enlace se puede pasar. Es el mismo criterio de la
decisión 22: lo que define qué se ve, se ve en la URL.

**Descartado:** hacer la cuadrícula desplazable a lo ancho en pantallas
angostas. El contenedor con desplazamiento recortaría la ficha que se asoma, y
la ficha es lo que hace legible una casilla chica. En su lugar, debajo de
`@2xl` la cuadrícula se va y quedan los días apilados en listas, donde hay
ancho para decirlo todo y la cita se abre tocándola.

## 35. Los lugares del taller son datos; la ubicación se reduce a dos

**Decidido.** `ubicacion` pasa de `BOX / PATIO / FUERA` a `TALLER / FUERA`, y
los lugares de adentro son filas de una tabla `espacio` que el taller
configura en `/admin/espacios`: nombre, cuántos vehículos entran, qué admite,
orden y activo. Un vehículo en el taller puede tener espacio asignado o no
tenerlo, y no tenerlo es válido.

**Por qué.**

El modelo decía «box» y el taller de referencia no tiene boxes: es un patio con
autos y dos elevadores. Eso no se arreglaba renombrando filas, porque `BOX` no
era un nombre sino un comportamiento —el único valor de `ubicacion` que llevaba
lugar asignado, y con cupo de uno por el índice único—. Con solo renombrar, la
recepción habría preguntado «¿en box o en patio?» y ofrecido «Patio» y
«Elevador 1» dentro de la lista de boxes. Alguien iba a leer ese sinsentido
todos los días.

La pregunta que el sistema necesita contestar sobre la ubicación es binaria:
¿está acá o no está? Todo lo demás —cómo se llama el sitio, cuántos hay,
cuántos autos entran— es configuración del taller, y la configuración del
taller son datos.

**«En el taller sin espacio» reemplaza a `PATIO`**, y no es una pérdida: es
exactamente la misma fila, sin `espacio_id`. Por eso la migración no pierde
información —lo que decía `BOX` conserva su espacio y lo que decía `PATIO` se
queda sin él, que es la misma distinción— y por eso **no hay un mínimo de
espacios**. El taller puede borrarlos todos: los autos figuran «en el taller» y
el sistema sigue funcionando. Un mínimo obligatorio habría sido una regla
inventada para un problema que no existe.

**El cupo lo hace cumplir la base, y con bloqueo.** Antes era un índice único
sobre `box_id`; con capacidad variable eso no se puede expresar como índice, así
que pasa a un disparador. El disparador hace `select … for update` sobre la fila
del espacio antes de contar: sin eso, dos recepciones simultáneas al mismo
espacio cuentan las dos el mismo hueco y entran las dos. Cuenta también las
órdenes `LISTO` que nadie pasó a recoger, por la misma razón de la decisión 2:
ese auto sigue ocupando el sitio.

**Bajar la capacidad por debajo de lo que ya hay adentro se rechaza en la
acción**, no en el disparador: el disparador solo mira cuando entra un vehículo,
y si no, el espacio quedaría con más autos de los que dice que le caben.

**Borrar solo se puede mientras esté vacío.** La orden apunta al espacio con
`on delete restrict` para no romper la trazabilidad (decisión 14), así que el
que tiene un auto adentro no se borra: se desactiva, que de cara al día a día es
lo mismo —deja de ofrecerse al recibir y no aparece en el tablero— sin tocar el
historial.

**`tipo` quedó informativo.** Dice qué admite el espacio y se ve al elegir, pero
no lo impide. Ya era así antes de esta decisión y se mantuvo a propósito: el
taller sabe mejor que el sistema si esa camioneta entra, y un sistema que se
niega cuando la realidad dice que sí es un sistema al que se le miente.

**Entra la séptima entrada en la barra lateral**, contra la costumbre de la
decisión 31. La razón: los lugares del taller no son el horario de reservas, ni
el catálogo, ni el sitio público, y meterlos dentro de una sección ajena los
haría imposibles de encontrar justo el día que el taller cambia de forma. El
tablero además enlaza a la pantalla desde el encabezado de «Espacios».

**Descartado:** dejar `BOX / PATIO / FUERA` y solo renombrar las filas. Es la
mitad del trabajo y el resultado miente sobre lo que es el taller.

**Descartado:** un mínimo de un espacio obligatorio. Ver arriba.

## 36. Los permisos se revocan de `public`, no de `anon`

**Decidido.** Toda función del esquema `public` empieza cerrada con
`revoke execute … from public, anon, authenticated` y después se le concede
explícitamente a quien la necesita. Las tablas que el sitio público no lee
pierden además el permiso de tabla para `anon`, no solo las filas por RLS.

**Por qué.**

El proyecto ya cerraba las funciones de staff con `revoke execute … from anon`.
No servía de nada, y la razón es de PostgreSQL: al crear una función, Postgres
le concede `execute` a `PUBLIC`, el pseudo-rol al que pertenece todo el mundo.
Quitarle la concesión nominal a `anon` deja intacta la de `PUBLIC`, que `anon`
hereda igual.

Comprobado contra la base de producción con la clave publicable: se ejecutaban
sin sesión `buscar_vehiculo`, `cambiar_estado_orden`, `guardar_diagnostico`,
`enviar_presupuesto`, `responder_presupuesto`, `registrar_evento`, `es_staff` y
`siguiente_correlativo`. Las tres que sí estaban cerradas —`recepcionar_vehiculo`,
`mover_orden` y `guardar_franjas`— son exactamente las que decían
`from public, anon`. El patrón correcto estaba escrito en tres sitios de trece,
por casualidad.

**Casi ninguna llegaba a hacer daño**, porque ninguna es `security definer` y RLS
filtraba a cero todo lo que tocaban: `buscar_vehiculo` con una placa real
devolvía `[]`. Pero eso significa que la única capa que protegía los datos de los
clientes era RLS, mientras el proyecto creía tener dos.

**La excepción sí hacía daño.** `siguiente_correlativo()` es `security definer`
—tiene que serlo, porque `contador_orden` está cerrada a todo el mundo— y por eso
se salta RLS. Cualquiera con la clave publicable, que está en el HTML del sitio,
podía llamarla en bucle e inflar el correlativo: los números de orden del taller
empezarían a dar saltos. Se confirmó creando la fila del año 1999 en
`contador_orden`, que se borró enseguida.

**Cerrar también las tablas** es lo que convierte una capa en dos. RLS ya devuelve
cero filas, pero una política nueva mal escrita publicaría los datos al instante;
sin el permiso de tabla, esa política ni llega a evaluarse. Se quedan abiertas a
`anon` solo las cuatro que alimentan el sitio: `config_sitio`,
`servicio_catalogo`, `galeria_imagen` y `destacado`.

**Lo que no se cerró y por qué.** `config_sitio` se lee entera, así que los textos
guardados y todavía sin publicar se pueden leer consultando la base aunque el
landing muestre la versión anterior. No hay nada secreto ahí —es el contenido
público del taller— y restringir por columnas obligaría a tocar la lista cada vez
que el CMS gane un campo. Queda anotado, no arreglado.

**Descartado:** `revoke execute on all functions in schema public`. Barre también
las funciones que crean las extensiones y las que instala Supabase, y el día que
una de ellas haga falta el fallo aparece lejos de acá. Se nombran una por una,
aunque sean dieciocho líneas.

## 37. Sin banner de cookies, con política de privacidad de verdad

**Decidido.** El sitio no lleva banner de cookies. Sí lleva `/privacidad` y
`/terminos`, un aviso de datos personales pegado al botón de reservar, y los
datos del responsable salen del CMS en vez de estar escritos en el código.

**Por qué no hay banner.**

Un banner de cookies existe para pedir consentimiento por cookies que **no son
necesarias**: analítica, publicidad, seguimiento entre sitios. Este proyecto no
tiene ninguna. No hay Google Analytics, ni píxeles, ni etiquetas de terceros; un
visitante del sitio público no recibe una sola cookie. La única del sistema es
la de sesión del panel, que es estrictamente necesaria para que el staff pueda
entrar y que un visitante nunca ve.

Poner un banner igual no sería «ir a lo seguro»: sería declarar en la cara de
cada visitante que se le está siguiendo, cuando no es verdad, y añadir un clic
a la primera impresión del taller a cambio de nada. Si algún día se agrega
analítica, el banner entra el mismo día que la analítica, no antes.

**Por qué sí hace falta la política de privacidad.** El formulario de reserva
recoge nombre, celular y placa: datos personales a los que les aplica la Ley
N.° 29733. Lo que la ley pide no es un banner, es que la persona sepa quién
guarda sus datos, para qué y cómo pedir que se corrijan o se borren. Eso es lo
que dice la página, y el aviso va pegado al botón de reservar y no escondido en
el pie, porque «informado» significa saberlo en el momento de entregarlos.

**El texto dice lo que el sistema hace, no una plantilla.** Los datos que lista
son exactamente los que piden `crear_reserva()` y la recepción. Declara que la
base está en São Paulo, o sea que hay flujo transfronterizo. Explica que quien
tenga el enlace de `/o/{token}` ve esa información. Si mañana se recoge un dato
más, este texto cambia el mismo día: una política que describe otro sistema es
peor que no tenerla.

**El responsable sale del CMS.** Nombre, dirección, correo y teléfono se leen de
`config_sitio` como en el resto del sitio. Escribirlos a mano significaría que
el día que el taller se mude, su política de privacidad siga apuntando al local
anterior.

**Descartado:** una casilla de «acepto» obligatoria. Añade fricción al
formulario que más importa que se termine, y el aviso visible junto al botón ya
cumple el requisito de información previa. Si un abogado lo pide, la casilla va
con `input type="hidden"` y un botón, como el resto de los formularios con
acción del proyecto.

**Descartado:** publicar los horarios como dato estructurado. En el CMS son
texto libre —«Lunes a viernes», «8:00 a 18:00»— y traducirlos a
`openingHoursSpecification` sería adivinar. Un horario equivocado en los datos
estructurados manda gente al taller cuando está cerrado, así que el JSON-LD
publica nombre, dirección, teléfono y redes, y nada de horarios.
