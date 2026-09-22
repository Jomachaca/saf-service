# Roadmap

## Estado actual

**Fase 4 terminada.** El taller recibe reservas por la web, con cupos por hora.
Funcionan la recepción, el tablero, el detalle de orden, el diagnóstico, el
presupuesto, el catálogo editable, la vista del cliente por enlace, el landing
con los datos reales del taller, «Sitio web» con el botón de publicar, el
formulario `/reservar`, la agenda y su horario de cupos. Una reserva se recibe
desde la agenda y entra por la misma recepción de siempre.

Las reservas salieron **apagadas y sin horario**, a propósito, y el taller ya
armó sus cupos y las encendió (`PUESTA_EN_MARCHA.md` §8). El panel se recorre
con una barra lateral de seis entradas (decisión 31).

El sistema visual sale del logo: granate para lo que se pulsa, azul marino para
la estructura, Barlow Condensed en los titulares. Está escrito una sola vez, en
`src/app/globals.css`, y lo usan por igual el sitio y el panel.

Lo que está cerrado:

- Modelo de dominio y máquina de estados.
- Modelo de datos en borrador.
- Stack y estrategia de despliegue.
- Flujo de WhatsApp y de presupuesto.
- Alcance de v1 y lo que queda fuera.

---

## Fase 0 — Andamiaje

- [x] Proyecto Next.js con App Router + TypeScript + Tailwind
- [x] Documentos de diseño dentro del repo (`docs/`)
- [x] Clientes de Supabase separados (navegador, servidor, servicio) y `.env.example`
- [x] Migraciones iniciales: `perfil`, `cliente`, `vehiculo`, `box`, `servicio_catalogo`,
      `orden_servicio`, `evento_orden`
- [x] RLS restrictivo por defecto en todas las tablas
- [x] Seed: 4 boxes sedán + 1 grande, catálogo básico de servicios
- [x] Auth de staff y layout protegido de `/admin`
- [x] Proyecto en Supabase creado, migraciones aplicadas y seed cargado
- [x] Despliegue en Vercel funcionando desde el día uno

### Lo que queda del despliegue

El sitio está en línea en la URL de Vercel. Falta apuntar el dominio propio y
poner `NEXT_PUBLIC_SITE_URL` con esa dirección, que es la que se mete en los
enlaces de WhatsApp que recibe el cliente.

Lo verificado contra el proyecto remoto: las tres migraciones aplicadas, 5 boxes
y 14 servicios en el seed, la cuenta de staff con su fila en `perfil`, la clave
pública leyendo el catálogo y RLS devolviendo vacío en `orden_servicio` y
`cliente`. `npm run build` pasa con `/admin` en prerenderizado parcial.

## Fase 1 — Núcleo operativo

Es la fase que hace útil el sistema. Si solo se construye esto, ya sirve.

- [x] Recepción rápida `/admin/ingreso` — una sola pantalla, búsqueda por placa,
      teléfono o nombre
- [x] Tablero `/admin` — resumen, grilla de boxes, lista de órdenes activas
      filtrable
- [x] Detalle de orden `/admin/orden/{id}` — estado, ubicación y bitácora
- [x] Máquina de estados como función pura con transiciones validadas
- [x] Registro de eventos en cada transición
- [x] Asignación y liberación de box (independiente del estado)

### Lo que no está verificado

- **El objetivo de los 60 segundos.** Hace falta cronometrar una recepción real,
  con un auto delante y alguien del taller escribiendo. Es el riesgo número dos
  de la tabla de abajo y no se cierra desde el escritorio.
- ~~**`evento_orden.actor`**~~ — **verificado** con la primera orden real
  (`OS-2026-0001`): los ocho eventos del recorrido completo, incluidos los de
  box, quedaron atribuidos al perfil del staff. La trazabilidad de la decisión 14
  funciona de punta a punta.
- **No hay pruebas automatizadas.** Las funciones de la base se verificaron con
  un script descartable. Si la Fase 2 crece, conviene decidir si eso se
  formaliza.

## Fase 2 — Diagnóstico, presupuesto y cliente

- [x] Catálogo de servicios editable `/admin/catalogo`
- [x] Diagnóstico: hallazgos y recomendación
- [x] Presupuesto con líneas (catálogo + libres), total en céntimos, tiempo estimado
- [x] Generación de token público
- [x] Vista pública `/o/{token}` resuelta en servidor
- [x] Botón de aprobar/rechazar con registro de quién y cuándo
- [x] Botón de WhatsApp con `wa.me` y plantilla editable

`config_sitio` se adelantó desde la Fase 3 porque ahí viven la configuración del
IGV y las plantillas de mensaje. La tabla existe con valores por defecto; la
pantalla que la edita sigue siendo de la Fase 3.

### Lo verificado en el navegador

Con una cuenta de staff temporal —creada y borrada en el momento— se recorrió
`/admin/catalogo` de punta a punta: editar un precio y verlo en la base, dar de
alta un servicio, retirarlo y comprobar que la clave pública deja de verlo.

Ahí apareció un fallo que afectaba a **todos** los formularios del panel, no
solo al nuevo: React resetea el formulario antes de ejecutar la acción, así que
un error devolvía la pantalla en blanco de lo que se había escrito. En la
recepción eso significaba perder los siete campos de un vehículo nuevo por una
placa repetida, y —peor— enviar una ubicación distinta de la que se veía
marcada. Está arreglado, y el porqué quedó anotado en las convenciones del proyecto.

Sigue sin recorrerse con una sesión real el flujo de diagnóstico y presupuesto.

## Fase 3 — Landing configurable

- [x] `config_sitio` con esquema fijo
- [x] `/admin/config` (hoy `/admin/sitio`) — campos, logo, galería, horarios, plantillas de mensaje
- [x] Subida de imágenes a Storage con redimensionado y límite de peso
- [x] Landing consumiendo config + botón "Publicar cambios" (decisión 2)
- [x] Sistema visual de la marca, aplicado también al panel
- [ ] Página pública de servicios desde el catálogo

### Sobre la página de servicios

Los servicios del catálogo ya salen en el landing, agrupados por categoría en la
sección «Servicios». Una ruta `/servicios` aparte, como aparece en
`ARQUITECTURA.md` §10, no se construyó: con el catálogo actual repetiría lo que
ya se ve en la portada. Si el catálogo crece hasta no caber ahí, se hace.

### Lo verificado en el navegador

Con una cuenta de staff temporal se recorrió `/admin/config` entero y se
comprobó lo que sostiene la decisión 17: al guardar un cambio en el titular, la
base queda con el texto nuevo y **el sitio público sigue mostrando el viejo**;
al pulsar «Publicar cambios», el sitio pasa al nuevo. La cuenta se borró después.

Falta cargar contenido real: fotos y horarios. Sin ellos las secciones no se
muestran, que es el comportamiento buscado. El mapa ya no espera nada: si nadie
pega un enlace de Google, sale de la dirección (decisión 32).

## Fase 4 — Reservas

- [x] Tabla `reserva` y cupos configurables por día y hora (hoy en `/admin/reservas`)
- [x] Formulario público `/reservar` con "No sé qué tiene" como primera opción
- [x] Agenda `/admin/agenda`
- [x] Conversión reserva → orden desde la agenda
- [x] Marcar no-asistencia
- [x] Días cerrados para feriados

### Sobre «en un click»

El botón «Recibir» de la agenda abre la recepción con la reserva puesta: la
búsqueda arranca sola y el motivo, el nombre y el celular ya vienen escritos.
No crea la orden sin pasar por ahí, porque una orden necesita marca, modelo y
ubicación, y pedirlos en el formulario público espanta a quien reserva
(decisión 28).

### Lo verificado

Contra la base real, con la clave pública, como un visitante:

- Rechaza, cada uno con su mensaje: un domingo sin franjas, horas fuera del
  horario, fechas a más de 14 días, horas pasadas, celulares que no son de 9
  dígitos, placas con símbolos, tipos inventados y servicios que no existen.
- Con 2 cupos, un mismo celular no toma dos veces la misma hora, y de **tres
  reservas lanzadas a la vez por el último cupo entró exactamente una**.
- La cuarta reserva pendiente de un mismo celular se rechaza.
- Sin sesión no se lee ninguna de las tablas nuevas, y con el interruptor
  apagado `crear_reserva()` corta antes de insertar.

En el navegador, con una cuenta de staff temporal creada y borrada en el
momento:

- Horario base guardado, reservas encendidas y reserva hecha desde `/reservar`
  en pantalla de celular, con su confirmación.
- En la agenda: confirmar, cancelar con segundo clic, y «No asistió» oculto
  mientras la hora no llega.
- «Recibir» abrió la recepción prellenada; la orden salió con «vino con
  reserva» en la bitácora y la agenda la mostró recibida, con su número.
- Recibir otra vez la misma reserva: la pantalla avisa, y forzado contra la
  base se rechaza sin crear orden, cliente ni vehículo y sin gastar número de
  orden.
- Cerrar un día con reservas avisa cuántas hay y lo saca del formulario.
- Publicado en local, la portada muestra «Reservar hora» en la cabecera y en la
  portada.

Todo lo creado se borró después: reservas, la orden de prueba con su vehículo y
su cliente, el horario y el día cerrado. El contador de órdenes y la
configuración volvieron a sus valores.

### Lo que no está verificado

- **La confirmación por WhatsApp desde la agenda** abre `wa.me` con el
  mensaje armado, pero no se mandó a nadie: el número de prueba no existe.
- **Un día entero con tráfico real.** Las reglas aguantan la concurrencia en
  la prueba; cuántos cupos por hora le sirven al taller se sabe usándolo.

## Panel con barra lateral

Entre la Fase 4 y la 5, el panel pasó de una cabecera con enlaces a una barra
lateral de seis entradas, y las pantallas largas se partieron (decisión 31):
«Sitio web» son tres pantallas en vez de ocho formularios seguidos, todo lo de
las reservas se configura en una sola, y el IGV quedó al pie del catálogo.

### Lo verificado

En el navegador, con una cuenta de staff temporal y **sin guardar nada**: la
base ya tenía el horario real del taller y las reservas encendidas, y una huella
de esas tablas tomada antes y después de probar salió igual.

- Las seis entradas, la encendida en cada pantalla (el detalle de una orden
  enciende «Tablero») y las tres partes de «Sitio web», que solo aparecen dentro
  de su sección.
- El aviso «Sin publicar» junto a «Sitio web», con cambios guardados después de
  la última publicación.
- `/admin/config` redirige a `/admin/sitio`.
- A 1024 px el detalle de orden va en una columna y a 1280 en dos; el tablero
  reparte los boxes según el ancho que deja la barra.
- En el celular, el cajón se abre, un enlace navega y lo cierra, un toque en el
  fondo también lo cierra, y la barra de publicar se pega debajo de la franja
  del menú.
- Modo claro y oscuro.
- `next build` pasa, con todas las rutas del panel en prerenderizado parcial.

### Lo que no está verificado

- **Guardar desde las pantallas nuevas.** Los formularios y sus acciones son
  los de antes, cambiados de lugar, y TypeScript confirma que cada uno llega a
  la suya. Pero no se envió ninguno, para no tocar el horario real, así que
  tampoco se vio el aviso «Sin publicar» aparecer o irse después de guardar.

## Landing con movimiento

Después de la barra lateral, le tocó al sitio público (decisión 32): pie en
cuatro columnas sin el enlace al panel, cinta de servicios en bucle, subrayados
que crecen desde el centro, apariciones al hacer scroll más largas y
escalonadas, anillo en el botón de reservar, burbuja de WhatsApp en el celular y
mapa armado con la dirección.

### Lo verificado

- El pie en cuatro columnas a 1280 px, en dos a 800 y apilado a 375, con los
  datos reales del taller y sin «Acceso del personal» en ninguna parte.
- El mapa de «Dónde estamos» carga Google con el pin en Av. Fernandini 142,
  sin que nadie haya pegado un enlace de incrustado.
- En `/reservar` el pie apunta a la portada (`/#servicios`) y no a anclas que
  ahí no existen.
- La burbuja de WhatsApp queda fija abajo a la derecha en el celular y no
  aparece en pantalla grande.
- Las dos copias de la cinta miden exactamente lo mismo, que es lo que hace que
  la vuelta al inicio no se vea, y el riel avanza al correr su reloj.
- El escalonado reparte los rangos de scroll como debe (4%, 11%, 18%, 25%).
- `next build` pasa y la portada sigue siendo estática entera.

### Lo que no está verificado

- **Las animaciones, corriendo.** El navegador del panel pide movimiento
  reducido y congela el reloj de la página, así que se vio la versión quieta
  (que es correcta y está completa) y se comprobó que cada animación quedó
  atada donde debe, pero no se las vio moverse. Eso hay que mirarlo en un
  navegador normal.

## Rediseño del sitio

El taller hizo un rediseño aparte y lo entregó como proyecto de diseño. El
landing se rehízo con él (decisión 33): papel blanco, cantos vivos, marcos de
plano con marcas de registro, titulares condensados en mayúsculas, fotos en
duotono, y el logo de verdad en la barra y en el pie.

### Lo verificado

En el navegador, sobre el servidor de desarrollo, a 1280 px y a 355 px, en modo
claro y oscuro: portada, servicios, «Cómo trabajamos», «El taller», contacto con
el mapa cargando, pie, y también `/reservar` y `/acceso`, que heredan los
tokens sin romperse. TypeScript y ESLint pasan.

### La segunda pasada

Comparando la maqueta bloque por bloque contra lo implementado aparecieron
cuatro diferencias, y las cuatro se cerraron:

- La **banda de datos** de la portada y las **marcas de vehículo** de «El
  taller», que faltaban enteras. Entraron con sus campos en el panel
  (decisión 33), así que arrancan vacías y se llenan desde «Sitio web».
- El **anillo de los botones llamativos** salía granate en todos. Ahora los de
  filete declaran su propio `--eco`: acero sobre papel y blanco sobre el bloque
  marino, que es lo que hace la maqueta.
- La **burbuja de WhatsApp** del celular late además por su cuenta (`.burbuja`,
  seis segundos), aparte del anillo corto del botón.

### La tercera pasada

El taller revisó el sitio en su propia máquina y encontró dos cosas más. Las
dos venían de ajustes de su Windows, no del navegador ni del código:

- **Se veía todo azul marino.** Tiene Windows en modo oscuro, y el sistema
  visual todavía invertía los tokens. Se quitó el modo oscuro (decisión 33).
- **Nada se movía**, ni la cinta ni las apariciones al bajar. Tiene apagado
  «Mostrar animaciones en Windows», que Chrome traduce a
  `prefers-reduced-motion: reduce`. Pidió que ningún ajuste de su sistema
  afectara a la página, así que se quitaron las cinco condiciones de
  `prefers-reduced-motion` del CSS: ahora el sitio se mueve siempre y en todas
  las máquinas (decisión 32, revertida en ese punto).
- Y una que sí era del código: las filas de «Cómo trabajamos» solo cambiaban el
  color del número al pasar el mouse. Ahora se levantan y se aclaran, como las
  fichas de servicio y como la maqueta.

`next build` lo corrió el taller con el servidor de desarrollo apagado y pasó
limpio: diecisiete páginas, la portada y `/reservar` prerenderizadas, el resto
del panel en prerenderizado parcial. TypeScript y ESLint pasan.

### La cuarta pasada: el tablero, contra la maqueta

El taller comparó el panel con el rediseño y el tablero no coincidía. Se rehizo
bloque por bloque contra el `.dc.html`:

- «En el taller» dejó de ser una retícula de cifras sueltas. Ahora es una
  **barra de proporción**, donde cada tramo mide lo que pesa su estado, y
  debajo una leyenda con el punto de color, la cifra grande y la etiqueta.
- Los colores macizos de los cinco estados salieron de la insignia a dos
  constantes compartidas (`COLOR_ESTADO` y `SOBRE_COLOR_ESTADO`, en
  `admin/componentes.tsx`), porque ahora los usan la barra, el punto de la
  leyenda y el filete de cada fila de órdenes.
- Los **espacios** libres van con filete punteado y leyenda «Sin vehículo»; los
  ocupados, con filete lleno y la placa en monoespaciada grande.
- Cada **fila de órdenes** abre con un filete de 4 px del color de su estado, y
  el conteo de la sección («2 de 6») se movió dentro de la lista, porque cambia
  con el filtro y el filtro es del cliente.
- El encabezado del tablero recuperó su versalita («Panel · ahora mismo») y el
  botón primario, sus marcas de registro. La agenda recuperó la suya
  («Panel · lo que viene») y sus dos botones cuadrados.

### La quinta pasada: el panel entero

Con el tablero ya rehecho, se recorrieron las demás pantallas contra la maqueta:

- **Detalle de orden.** La placa pasa a monoespaciada de 38 px; el diagnóstico
  y el presupuesto viven en fichas de plano con sus marcas de registro, igual
  que la columna lateral (cliente, ubicación, ingreso); y la bitácora se dibuja
  como una línea de tiempo, con filete vertical y un punto granate por hecho.
- **Recepción.** Se parte en dos pasos numerados —«01 Vehículo» y «02 Motivo e
  ingreso»—, el aviso de reserva es una ficha de plano en granate y el botón de
  crear orden lleva marcas de registro.
- **Las siete pantallas** tienen ahora su versalita: «Panel · ahora mismo»,
  «· lo que viene», «· en menos de un minuto», «· precios de referencia»,
  «· configuración» y «· lo que ve el cliente».
- Se quitaron **52 clases `rounded-*` muertas** y el mapa `COLOR_ESTADO` viejo
  de `lib/orden/estados.ts`, que todavía decía verde, naranja y morado.

### El interletrado, que estaba al revés

Buscando otra cosa apareció un fallo que afectaba a todo el sitio, no solo al
panel. La regla `.font-display { letter-spacing: -0.02em }` estaba **fuera de
toda capa**, así que le ganaba a las utilidades de Tailwind: cada
`font-display tracking-[0.24em]` —las versalitas de sección, las entradas de la
barra lateral, las insignias, los botones, la cinta del landing— terminaba con
interletrado **negativo** en vez de ancho. Se veía apretado exactamente donde
el diseño pedía aire.

Ahora la regla vive en `@layer base` y apunta a los encabezados, como en la
maqueta. Medido después del cambio: `tracking-[0.24em]` a 11 px da 2.64 px, y
el `h1` conserva su −0.02em.

### Datos de prueba

`scripts/datos-prueba.js` llena la base para poder mirar el panel con
contenido: seis vehículos repartidos por los cuatro estados, uno con
diagnóstico y presupuesto enviado, y cuatro reservas. Las órdenes se abren con
`recepcionar_vehiculo` y se mueven con `cambiar_estado_orden`, las mismas
funciones que usa el panel, así que cada una queda con su bitácora de verdad.
`node scripts/datos-prueba.js quitar` borra exactamente eso y nada más: busca
por las placas y los teléfonos que él mismo escribió.

### Lo que no está verificado

- **El movimiento, visto moverse.** El navegador que usa el asistente fuerza
  `prefers-reduced-motion` y congela `document.timeline`, así que se puede
  comprobar que las animaciones están enganchadas y en `running`, pero no
  verlas avanzar. Eso hay que mirarlo en un navegador de verdad.
- ~~La migración `20260922120000_datos_portada_y_marcas.sql`.~~ **Aplicada.**
  El taller ya cargó además las marcas que atiende, y salen en «El taller».
  La banda de datos de la portada sigue vacía: es lo único de los dos bloques
  nuevos que falta llenar.
- **El detalle de orden y la recepción, a fondo.** Se revisaron en el
  navegador y se ven del mismo lenguaje, pero no se rehicieron bloque por
  bloque como el tablero: el rediseño propone para ellos una columna de
  bitácora y una ficha de presupuesto que todavía no se armaron.

## Fase 5 — Fotos e historial

- [ ] Fotos de ingreso (frontal, posterior, laterales, interior, daños)
- [ ] Fotos durante diagnóstico
- [ ] Historial de órdenes por vehículo
- [ ] Búsqueda por placa desde el panel

---

## Backlog v2 (no tocar en v1)

- Estados `ESPERANDO_REPUESTOS` y `ENTREGADO`
- Aprobación parcial por ítem del presupuesto
- Inventario de repuestos
- Notificaciones automáticas por evento
- WhatsApp Cloud API con plantillas aprobadas
- Asignación de mecánico responsable y especialidades
- Cálculo de capacidad real para reservas
- Reportes: ingresos por período, servicios más frecuentes, tiempo promedio
- Facturación electrónica (proyecto aparte)
- Roles `mecanico` y `recepcion` (decisión 4)

---

## Riesgos identificados

| Riesgo | Mitigación |
|---|---|
| Scope creep hacia scheduling real | Cupos fijos, revisar `DECISIONES.md` |
| El taller no usa el sistema porque es lento | La recepción en 60 s es requisito, no aspiración |
| Fotos pesadas matan el rendimiento | Redimensionar en cliente + límite de peso |
| Fuga de datos por RLS mal configurado | Restrictivo por defecto; el token va por servidor |
| El admin rompe el landing | CMS de campos fijos |
| Confusión presupuesto/boleta con el cliente | Nomenclatura explícita en toda la UI |
