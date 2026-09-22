# CLAUDE.md

Contexto permanente del proyecto. Léelo completo antes de escribir código.

## Qué es esto

Plataforma web para un taller automotriz en Perú. **No es una web de reservas.**
Es un sistema de gestión de órdenes de servicio, donde la reserva online es
solo uno de los canales por los que un vehículo entra al taller.

Dos superficies en una sola aplicación:

- **Landing público** — informativo + formulario de reserva + consulta de orden por link.
- **Panel de administración** — operación diaria del taller y configuración del landing.

Taller de referencia: 4 espacios sedán + 1 espacio grande (camioneta).

## Regla mental principal

> La pregunta que responde el panel no es "¿cuántas reservas tenemos?"
> sino "¿qué está pasando ahora mismo dentro del taller?".

Si una decisión de diseño hace que el sistema sea inútil para un auto que llegó
sin cita, la decisión está mal.

## Stack

| Capa | Elección |
|---|---|
| Framework | Next.js (App Router) |
| Backend | Route handlers / server actions del mismo Next — **sin backend separado** |
| DB + Auth + Storage | Supabase (Postgres) |
| Despliegue | Vercel (free/hobby) + Supabase free |
| WhatsApp | links `wa.me` con texto prellenado — **no** Cloud API en v1 |

## Reglas no negociables

1. **`Reserva` ≠ `OrdenServicio`.** La reserva es una intención futura. La orden es
   el trabajo real. Una reserva puede convertirse en orden; una orden puede existir
   sin reserva. Nunca las unifiques.
2. **Ubicación y estado son cosas distintas.** Un auto "esperando repuestos" no
   ocupa un box. `orden.estado` y `orden.ubicacion` son columnas separadas.
3. **Los precios se copian, no se referencian.** Al agregar un servicio del catálogo
   a un presupuesto, se copia el precio a la línea. Un presupuesto de enero debe
   seguir mostrando los precios de enero.
4. **Dinero en enteros (céntimos).** Nunca `float`. Nunca.
5. **El link público del cliente usa un token aleatorio**, no el número de orden.
   `/o/{token}` y no `/orden/OS000182`. Ahí hay placa, nombre y fotos de alguien.
6. **La consulta pública pasa por servidor.** Nunca expongas la tabla de órdenes al
   cliente con la anon key. RLS restrictivo + route handler que resuelve el token.
7. **No se le miente a la base de datos.** `wa.me` no confirma entrega. Registra
   "link generado", no "cliente notificado".
8. **Nunca digas "boleta".** En Perú eso es un comprobante SUNAT. Lo que genera el
   sistema es un **presupuesto** (proforma). Facturación electrónica está fuera de alcance.
9. **El CMS del landing es un esquema fijo de campos, no un editor de páginas.**
   El admin llena campos; no puede romper el diseño.
10. **Un solo flujo de presupuesto**, no "modo automático" y "modo manual". El
    catálogo de servicios es un atajo de llenado sobre la misma tabla de líneas.

## Alcance de v1 (respetarlo)

**Dentro:** recepción rápida de vehículos, tablero de estados, catálogo de servicios,
presupuesto, aprobación del cliente vía link, CMS del landing, reservas con cupos
por franja.

**Fuera (no lo construyas aunque parezca fácil):** inventario de repuestos,
aprobación parcial por ítem, notificaciones automáticas, WhatsApp Cloud API,
app móvil, facturación electrónica, multi-taller, roles granulares.

## Documentos de apoyo

- `docs/ARQUITECTURA.md` — modelo de dominio, estados, modelo de datos, rutas.
- `docs/DECISIONES.md` — decisiones tomadas y por qué (incluye las descartadas).
- `docs/ROADMAP.md` — estado actual, fases y qué sigue.
- `docs/PUESTA_EN_MARCHA.md` — de repositorio clonado a panel funcionando.

## Estado actual

**Fase 4 terminada.** El modelo conceptual está cerrado y las decisiones
abiertas se resolvieron (`docs/DECISIONES.md` 16–33).

Funcionan el tablero, la recepción rápida, el detalle de orden con cambio de
estado, movimiento de box y bitácora, el diagnóstico, el presupuesto con líneas
del catálogo, el catálogo editable en `/admin/catalogo`, y la vista pública
`/o/{token}` donde el cliente aprueba o rechaza. También el landing público con
los datos reales del taller y «Sitio web» (`/admin/sitio`), donde se edita todo
lo que se ve en él. Y las reservas: el formulario `/reservar`, la agenda en
`/admin/agenda`, su configuración en `/admin/reservas` y «Recibir», que abre la
recepción con la reserva puesta. El panel se recorre con una barra lateral de
seis entradas (decisión 31), y el landing tiene su capa de movimiento en CSS
(decisión 32).

Las escrituras de órdenes pasan por funciones de Postgres
(`recepcionar_vehiculo`, `cambiar_estado_orden`, `mover_orden`) para que el
cambio y su evento entren en la misma transacción; las reglas de transición
viven en `src/lib/orden/estados.ts` y, las de la reserva, en
`src/lib/reserva/estados.ts`. Las reglas de cupo son la excepción y viven en
`crear_reserva()`, porque esa función la llama la clave pública (decisión 26).

El proyecto de Supabase está enlazado, con todas las migraciones aplicadas, y
el sitio está desplegado en Vercel. El taller ya cargó sus cupos y encendió las
reservas (`docs/PUESTA_EN_MARCHA.md` §8).

La aplicación arranca sin Supabase configurado: el landing se ve y `/admin`
manda a `/acceso`, que explica qué falta. Eso es deliberado —una variable
ausente no debe tumbar la web pública— y es lo que hace `supabaseConfigurado()`
en `src/lib/supabase/env.ts`.

### Next.js 16 — dos cosas que no coinciden con lo que sabes

Este proyecto usa Next.js 16, que trae cambios de nombre y de modelo:

- **`middleware.ts` ya no existe: ahora es `proxy.ts`** en la raíz de `src/`. La
  receta estándar de Supabase SSR está escrita para `middleware.ts` y hay que
  adaptarla.
- La documentación de la versión exacta está en `node_modules/next/dist/docs/`.
  Léela antes de escribir código de framework; `AGENTS.md` insiste en lo mismo.

## Reglas del framework

@AGENTS.md

## Cómo trabajar conmigo

- Explica antes de generar cuando la decisión sea de arquitectura.
- Prefiero código directo y legible sobre abstracciones tempranas.
- Si algo de este documento contradice lo que te pido en el chat, dímelo en vez
  de elegir en silencio.

## Convenciones de código

Nacieron al escribir el andamiaje. Si algo no encaja, discutámoslo antes de
inventar una excepción.

**Idioma.** El dominio va en español, igual que las tablas: `orden_servicio`,
`estados.ts`, `transicionar`, `requerirStaff`. Los archivos que son convención
del framework o de una librería conservan su nombre en inglés: `layout.tsx`,
`page.tsx`, `proxy.ts`, `src/lib/supabase/server.ts`.

**Un solo lugar por cosa transversal.**

| Tema | Módulo | Regla |
|---|---|---|
| Dinero e IGV | `src/lib/dinero.ts` | Ninguna vista calcula IGV ni divide entre 100 |
| Fechas | `src/lib/fecha.ts` | Ninguna vista llama a `toLocaleString` |
| Estados | `src/lib/orden/estados.ts` | Función pura; la UI no arma transiciones |
| Ubicación | `src/lib/orden/ubicacion.ts` | Separada del estado (decisión 2) |
| Sesión | `src/lib/sesion.ts` | `requerirStaff()` en todo lo que cuelga de `/admin` |

**Cache Components (decisión 22).** Todo lo que lee `cookies()`, `searchParams`
o la base va detrás de un `<Suspense>`; el resto de la página prerenderiza. Si
`next build` se queja de "uncached or runtime data during prerendering", la
solución casi siempre es mover esa lectura a un componente hijo con su boundary,
no apagar el prerenderizado con `instant = false`.

**Las cuatro claves de Supabase no son intercambiables.**

- `client.ts` — navegador, clave pública, sujeto a RLS.
- `server.ts` — Server Components, acciones y route handlers, sesión del staff.
- `publico.ts` — clave pública sin cookies, para el sitio público: lo que se
  cachea del landing y lo que hace `/reservar`. Dentro de un `use cache` no se
  puede leer `cookies()`, y el visitante no tiene sesión que leer.
- `admin.ts` — clave de servicio, se salta RLS. **Solo** para resolver
  `/o/{token}` (decisión 7). Cualquier otro uso probablemente sea un error.

**El sistema visual vive en `src/app/globals.css`.** Sale del logo y se resume
en dos reglas: el **granate** es acción (botones primarios, enlaces, lo que se
pulsa) y el **azul marino** es estructura (cabeceras, bloques oscuros). Los
tokens semánticos —`--fondo`, `--tinta`, `--borde`, `--marca`— nombran el papel
y la tinta; las rampas `vino-*` y `marino-*` son valores fijos. Nada de
`border-black/10` ni de opacidades sueltas para atenuar texto: eso ya se migró
una vez.

**Una regla sin capa le gana a Tailwind, y eso ya mordió dos veces.** Las
utilidades de Tailwind viven en `@layer utilities`, y en CSS cualquier regla
fuera de toda capa le gana a cualquier regla dentro de una. Pasó con `.pulso`,
que fijaba `position: relative` y se comía el `fixed` de la burbuja de
WhatsApp; y pasó con `.font-display { letter-spacing: -0.02em }`, que anulaba
en silencio todos los `tracking-[0.24em]` del sitio y dejaba apretadas las
versalitas que tenían que respirar. Lo propio va dentro de `@layer base` o
`@layer components`, nunca suelto.

**No hay modo oscuro, y es a propósito.** Hubo uno automático por
`prefers-color-scheme` y se quitó (decisión 33): el lenguaje está dibujado
sobre papel, y el contraste lo pone la alternancia entre secciones blancas y
bloques marinos. Al invertir la paleta esa alternancia se pierde y la página
entera queda de un solo tono. `:root` declara `color-scheme: light` para que
los controles que dibuja el navegador —barras de desplazamiento, calendarios
de los campos de fecha— salgan claros aunque el sistema esté en oscuro. No
escribas variantes `dark:`.

Desde la decisión 33 el lenguaje es de plano técnico: papel blanco, cantos
vivos —`--radius-*` vale cero, así que los `rounded-*` escritos quedan
cuadrados solos y solo `rounded-full` sigue redondeando píldoras—, filetes de
un pixel y titulares en condensada, mayúsculas y apretados. Lo que es un
objeto lleva marco de plano: la clase `.plano` con sus cuatro `.esquina`. Las
fotos del sitio público van en `.duotono`.

**Las animaciones son de CSS.** Las apariciones al hacer scroll usan
`animation-timeline: view()` detrás de un `@supports`, así que donde el navegador
no la entiende el contenido se ve normal en vez de quedarse invisible. No hay
librería de animación instalada, y para un taller cuyos clientes entran desde
WhatsApp con datos móviles eso es una decisión, no una carencia. Las
utilidades del landing —`.al-entrar`, `.subrayado`, `.llama` y `.cinta`— viven
en `@layer components`, para que una utilidad de Tailwind pueda pisarlas
(decisión 32).

**La página no consulta los ajustes del sistema.** Ni el tema claro/oscuro ni
`prefers-reduced-motion`: el sitio se ve igual en todas las máquinas, y esa
uniformidad es lo que el taller pidió expresamente después de ver su propia
página oscura y quieta por tener Windows así configurado. Lo que sí se consulta
es lo que el navegador *sabe hacer*, con `@supports`, que es otra cosa. No
agregues `@media (prefers-reduced-motion: …)` ni variantes `dark:` sin
hablarlo antes.

**El panel mide su columna, no la pantalla.** La barra lateral ocupa 15rem
desde `lg`, así que un `lg:grid-cols-…` cree tener 1024 px donde quedan poco
más de 720. Lo que se reacomoda según el ancho dentro de una pantalla del panel
usa container queries (`@xl:`, `@4xl:`), medidas contra la columna que arma
`src/app/admin/layout.tsx`.

**Pocas entradas en la barra lateral.** Son seis, en dos grupos (decisión 31).
Una pantalla nueva entra primero en una sección que ya existe, y una pantalla
que empieza a apilar formularios se parte en partes con su propia ruta antes de
crecer hacia abajo.

**Conjuntos cerrados en la base.** `text` con `check`, no enums de Postgres: en
v2 hay que agregar estados y roles, y reemplazar un check es una migración
trivial.

**Lo que puede llamar la clave pública lleva las reglas adentro.**
`crear_reserva()` y `disponibilidad_reservas()` son `SECURITY DEFINER` y las
ejecuta anon. Validar solo en la acción de Next no protege nada, porque la clave
pública está en el navegador y cualquiera llama a la base sin pasar por Next
(decisión 26). Una función así fija `search_path`, devuelve números o nada, y
se le quita `EXECUTE` a `public` antes de dárselo a `anon`. Ojo al revés:
Supabase le concede `EXECUTE` a anon en toda función nueva, así que las que son
solo de staff llevan su `revoke ... from anon` explícito.

**Las fechas que se leen se arman en el servidor.** Un componente de cliente que
formatea con `Intl` al renderizar puede escribir «set.» en el servidor y
«sept.» en el navegador, y la hidratación falla. `/reservar`, la agenda y la
recepción reciben el texto ya formateado desde `src/lib/fecha.ts`; el cliente
solo elige entre opciones.

**Los formularios con acción se resetean solos.** Antes de ejecutar la acción,
React llama a `requestFormReset` sobre el formulario (`startHostTransition`, en
`react-dom`). Siempre, falle la acción o no. De ahí salen tres reglas:

- Los campos de texto **van controlados** (`value` + `onChange`). Si no, un
  error de la acción borra lo que la persona acababa de escribir —una recepción
  entera, un diagnóstico— y hay que teclearlo todo de nuevo.
- **Las casillas y los radios no sirven** dentro de un formulario con acción.
  React mantiene sincronizado el atributo `value` de los inputs controlados, así
  que el reset los deja bien, pero con `checked` no lo hace: la casilla vuelve a
  lo que trajo el HTML y queda desfasada del estado. Se ve marcada una opción y
  se envía otra. En su lugar va un `input type="hidden"` con el valor y un
  `button type="button"` como control visible.
- La excepción son los campos que **deben** vaciarse al enviar, como la nota que
  acompaña un cambio de estado: esos se dejan sin controlar a propósito.

**Un archivo `"use server"` solo exporta funciones async.** Nada de constantes ni
objetos: rompen el módulo entero al evaluarse y se caen todas las acciones a la
vez, no solo la que toca el valor. Peor aún, **`next build` no lo detecta** — el
error aparece solo al ejecutar. Lo compartido entre acciones y formularios va en
un módulo aparte, como `src/app/admin/estado-formulario.ts`. Los `export type` sí
son seguros, porque desaparecen al compilar.
