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
marcada. Está arreglado y explicado en `CLAUDE.md`.

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

Falta cargar contenido real: fotos, horarios y el enlace del mapa. Sin ellos las
secciones no se muestran, que es el comportamiento buscado.

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
