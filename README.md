# SAF Service

Sistema de gestión de órdenes de servicio para un taller automotriz en Arequipa, Perú.

**No es una web de reservas.** Es el sistema con el que el taller lleva su día: qué
vehículos tiene adentro, dónde está cada uno, qué le pasa y cuánto va a costar.
La reserva en línea es solo uno de los canales por los que entra un auto — la
mayoría llega sin cita, y el sistema está diseñado alrededor de ese hecho.

Dos superficies en una sola aplicación Next.js:

- **Sitio público** — informativo, editable desde el panel, con formulario de
  reserva y una página donde el cliente consulta y aprueba su presupuesto.
- **Panel de administración** — la operación diaria y la configuración de todo
  lo anterior.

---

## Qué hace

### Sitio público

| | |
|---|---|
| **Portada** | Contenido editable desde el panel: titular, foto, servicios, galería, horarios, mapa. Nada está escrito en el código. |
| **Reservas** | Cupos por día de la semana y hora, con días cerrados y anticipación mínima. Las reglas viven en la base, no en el formulario. |
| **`/o/{token}`** | El cliente abre su orden desde un enlace de WhatsApp, ve el diagnóstico y el presupuesto, y aprueba o rechaza. El enlace usa un token aleatorio de 192 bits, nunca el número de orden. |

### Panel

| | |
|---|---|
| **Tablero** | Qué hay ahora mismo en el taller: proporción por estado, ocupación de los espacios y la lista de órdenes activas con buscador y orden por columna. |
| **Recepción** | Alta completa de un vehículo en menos de un minuto. Cliente, vehículo, orden y su primer evento entran en una sola transacción. |
| **Orden** | Estado, ubicación, diagnóstico, presupuesto por líneas y bitácora completa de lo que pasó. |
| **Agenda** | Calendario semanal: las horas del horario son las filas, los días las columnas, y cada reserva su casilla. |
| **Espacios** | Los lugares del taller —un patio, dos elevadores, lo que sea— con su cupo. Son datos, no constantes en el código. |
| **Catálogo** | Servicios con precio de referencia y duración, más los ajustes de IGV. |
| **Sitio web** | El CMS del contenido público, con publicación explícita. |

---

## Stack

| Capa | Elección |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Cache Components) |
| Lenguaje | TypeScript en modo estricto |
| UI | React 19 · [Tailwind CSS 4](https://tailwindcss.com) · [Phosphor Icons](https://phosphoricons.com) |
| Base de datos | PostgreSQL en [Supabase](https://supabase.com) |
| Autenticación | Supabase Auth con cookies del servidor (`@supabase/ssr`) |
| Almacenamiento | Supabase Storage para las fotos del sitio |
| Backend | Server Actions y funciones de Postgres — **sin backend separado** |
| Despliegue | [Vercel](https://vercel.com) |

No hay librería de estado, ni de formularios, ni de animación, ni de componentes.
Para un taller cuyos clientes entran desde WhatsApp con datos móviles, eso es una
decisión, no una carencia.

---

## Decisiones que explican el código

El porqué completo de cada una está en [`docs/DECISIONES.md`](docs/DECISIONES.md).
Estas cuatro son las que más forma le dan al proyecto:

**La reserva no es la orden.** Una reserva es una intención futura; una orden es
trabajo real. Una reserva puede convertirse en orden, y una orden puede existir
sin reserva — que es el caso normal. Nunca se unifican.

**La ubicación no es el estado.** Un auto esperando repuestos sigue en el taller
sin ocupar el elevador. Si se ata el lugar al estado, el taller le miente al
sistema para liberar espacio y el tablero deja de reflejar la realidad.

**Las reglas viven en la base, no en el formulario.** La clave pública de Supabase
está en el navegador de cualquier visitante, así que cualquiera puede llamar a la
base sin pasar por Next.js. Validar solo en la acción de servidor sería poner
candado a la puerta y dejar abierta la pared. Las funciones que puede llamar el
público son `security definer`, fijan su `search_path`, y las reglas de cupo están
adentro.

**Los precios se copian, no se referencian.** Al agregar un servicio del catálogo
a un presupuesto, el precio se copia a la línea. Un presupuesto de enero sigue
mostrando los precios de enero aunque el catálogo haya cambiado.

---

## Arquitectura

```
Visitante ──► Sitio público ──► clave pública + RLS + funciones security definer
Cliente   ──► /o/{token}    ──► servidor resuelve el token con la clave de servicio
Staff     ──► /admin        ──► sesión en cookie + RLS + funciones de Postgres
```

**Row Level Security restrictivo en las 17 tablas.** La clave pública solo alcanza
las cuatro tablas que alimentan el sitio; todo lo demás está cerrado por permiso de
tabla *y* por política. La clave de servicio se usa en un único archivo, para
resolver el enlace público del cliente, y devuelve un objeto armado campo por
campo en vez de la fila de la base.

**Las escrituras que tienen que ser atómicas pasan por funciones de Postgres.**
Recibir un vehículo crea cliente, vehículo, orden y evento en una transacción:
media recepción guardada es peor que ninguna. Lo mismo con los cambios de estado y
sus eventos de bitácora. Las carreras están resueltas con bloqueos reales —
`pg_advisory_xact_lock` para los cupos de reserva, `select … for update` para el
cupo de un espacio.

**Cache Components.** Lo que depende de la sesión o de la base va detrás de su
`<Suspense>` y el resto de la página se prerenderiza. El contenido del sitio
público se cachea con etiquetas y se invalida al pulsar «Publicar cambios», no en
cada visita.

---

## Puesta en marcha

Requiere Node 20 o superior y un proyecto de Supabase.

```bash
npm install
cp .env.example .env.local   # y completar los valores
npx supabase link --project-ref <ref-del-proyecto>
npx supabase db push
npm run dev
```

Variables de entorno:

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | La URL del proyecto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave publicable; va al navegador y está sujeta a RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio; **solo servidor**, se salta RLS |
| `NEXT_PUBLIC_SITE_URL` | El dominio público, del que salen los enlaces que recibe el cliente |

La aplicación arranca sin Supabase configurado: el sitio público se ve y el panel
redirige a una pantalla que explica qué falta. Una variable ausente no debe tumbar
la web pública.

El paso a paso completo, incluido el alta del primer usuario del staff, está en
[`docs/PUESTA_EN_MARCHA.md`](docs/PUESTA_EN_MARCHA.md).

### Datos de prueba

```bash
node scripts/datos-prueba.js poner    # órdenes y reservas de ejemplo
node scripts/datos-prueba.js quitar   # borra exactamente lo que creó
```

Las órdenes se abren con las mismas funciones que usa el panel, así que cada una
queda con su bitácora de verdad. `quitar` busca solo por las placas y los
teléfonos que el propio script escribió: no puede llevarse por delante una orden
real.

---

## Estructura

```
src/
  app/
    _landing/        piezas del sitio público
    admin/           el panel, una carpeta por pantalla
    o/[token]/       la vista del cliente
    reservar/        el formulario público
    globals.css      el sistema visual completo
  lib/
    orden/           estados, ubicación, espacios, presupuesto, consultas
    reserva/         estados y consultas de reservas
    supabase/        los cuatro clientes, y no son intercambiables
    dinero.ts        céntimos e IGV; ninguna vista divide entre 100
    fecha.ts         zona horaria de Lima; ninguna vista llama a toLocaleString
  proxy.ts           refresco de sesión (en Next.js 16 ya no se llama middleware)
supabase/migrations/ el esquema, en orden
docs/                arquitectura, decisiones, roadmap y puesta en marcha
```

---

## Documentación

| Documento | Qué contiene |
|---|---|
| [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) | Modelo de dominio, máquina de estados, modelo de datos, rutas |
| [`docs/DECISIONES.md`](docs/DECISIONES.md) | Cada decisión tomada y por qué, incluidas las descartadas |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Qué está hecho, qué se verificó y cómo, y qué sigue |
| [`docs/PUESTA_EN_MARCHA.md`](docs/PUESTA_EN_MARCHA.md) | De repositorio clonado a panel funcionando |

---

## Estado

Fase 4 terminada y en producción. Funcionan el tablero, la recepción, el detalle
de orden, el presupuesto, la aprobación del cliente, el CMS del sitio, las reservas
y la configuración de espacios.

Lo siguiente es la Fase 5: fotos del vehículo al ingresar e historial por
vehículo.
