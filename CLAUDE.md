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

**Fase 2 casi terminada.** El modelo conceptual está cerrado y las decisiones
abiertas se resolvieron (`docs/DECISIONES.md` 16–23).

Funcionan el tablero, la recepción rápida, el detalle de orden con cambio de
estado, movimiento de box y bitácora, el diagnóstico, el presupuesto con líneas
del catálogo, y la vista pública `/o/{token}` donde el cliente aprueba o
rechaza. Falta la pantalla de catálogo editable. Las escrituras pasan por funciones de
Postgres (`recepcionar_vehiculo`, `cambiar_estado_orden`, `mover_orden`) para que
el cambio y su evento entren en la misma transacción; las reglas de transición
siguen viviendo en `src/lib/orden/estados.ts`.

Ya existen: el proyecto Next.js, los tres clientes de Supabase, las migraciones
de `perfil`, `cliente`, `vehiculo`, `box`, `servicio_catalogo`, `orden_servicio`
y `evento_orden` con su RLS, el seed, los módulos puros de estados, ubicación,
dinero y fechas, y la autenticación del staff con `/admin` protegido.

El proyecto de Supabase está creado y enlazado, con las migraciones aplicadas y
el seed cargado. De la Fase 0 solo queda el despliegue en Vercel
(`docs/PUESTA_EN_MARCHA.md` §7).

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

**Las tres claves de Supabase no son intercambiables.**

- `client.ts` — navegador, clave pública, sujeto a RLS.
- `server.ts` — Server Components, acciones y route handlers, sesión del staff.
- `admin.ts` — clave de servicio, se salta RLS. **Solo** para resolver
  `/o/{token}` (decisión 7). Cualquier otro uso probablemente sea un error.

**Conjuntos cerrados en la base.** `text` con `check`, no enums de Postgres: en
v2 hay que agregar estados y roles, y reemplazar un check es una migración
trivial.

**Un archivo `"use server"` solo exporta funciones async.** Nada de constantes ni
objetos: rompen el módulo entero al evaluarse y se caen todas las acciones a la
vez, no solo la que toca el valor. Peor aún, **`next build` no lo detecta** — el
error aparece solo al ejecutar. Lo compartido entre acciones y formularios va en
un módulo aparte, como `src/app/admin/estado-formulario.ts`. Los `export type` sí
son seguros, porque desaparecen al compilar.
