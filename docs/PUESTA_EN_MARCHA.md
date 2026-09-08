# Puesta en marcha

De un repositorio recién clonado a un panel funcionando. Los pasos 2 a 5
necesitan una cuenta de Supabase; el paso 1 no necesita nada.

---

## 1. Correr el proyecto en local

```bash
npm install
```

```bash
npm run dev
```

Abre <http://localhost:3000>. Sin Supabase configurado ya se puede ver:

| Ruta | Qué muestra |
|---|---|
| `/` | Marcador de posición del landing (el real es la Fase 3) |
| `/acceso` | Aviso de que falta conectar Supabase |
| `/admin` | Redirige a `/acceso` |

La aplicación arranca sin configurar a propósito: una variable ausente deja el
panel fuera de servicio, pero no tumba la web pública.

---

## 2. Crear el proyecto en Supabase

1. Entra a <https://supabase.com/dashboard> y crea un proyecto.
2. Región: **South America (São Paulo)** es la más cercana a Perú.
3. Guarda la contraseña de la base de datos que te pide. La vas a necesitar para
   `db push` y no se puede volver a ver.
4. Espera a que termine de aprovisionar (un par de minutos).

---

## 3. Llenar `.env.local`

Si no existe todavía:

```bash
cp .env.example .env.local
```

Los valores salen del dashboard, en **Project Settings → API**:

| Variable | De dónde sale |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | *Project URL* |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública: *anon* en proyectos antiguos, *publishable* (`sb_publishable_…`) en los nuevos |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave secreta: *service_role* o *secret* (`sb_secret_…`) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` en local |

La clave secreta se salta RLS por completo. Solo se usa en el servidor, para
resolver `/o/{token}` (decisión 7). Nunca la pongas en una variable
`NEXT_PUBLIC_`.

**Reinicia `npm run dev` después de editar `.env.local`.** Next lee las
variables al arrancar.

---

## 4. Crear las tablas

El SQL está en `supabase/migrations/`, en tres archivos que corren en orden:

| Archivo | Qué crea |
|---|---|
| `…_perfil.sql` | `perfil`, la función `es_staff()` que sostiene toda la RLS |
| `…_taller.sql` | `cliente`, `vehiculo`, `box`, `servicio_catalogo` |
| `…_orden_servicio.sql` | `orden_servicio`, `evento_orden`, numeración y triggers |

Y `supabase/seed.sql` carga los 5 boxes y el catálogo base.

### Opción A — CLI (recomendada)

```bash
npx supabase login
```

```bash
npx supabase link --project-ref TU_REF
```

El *project ref* es el código que aparece en la URL del dashboard
(`https://supabase.com/dashboard/project/`**`abcdefghijklmnop`**) y también en
Project Settings → General.

```bash
npx supabase db push --include-seed
```

`--include-seed` corre además `seed.sql`. **Solo la primera vez**: si lo repites
sobre una base que ya tiene datos, vas a duplicar boxes y servicios.

### Opción B — sin CLI

En el dashboard, **SQL Editor → New query**, y pega el contenido de cada archivo
por separado, **en el orden de la tabla de arriba**, ejecutando uno a la vez.
Al final, `supabase/seed.sql`.

### Comprobar que quedó

En **Table Editor** deberías ver `box` con 5 filas y `servicio_catalogo` con 14.

---

## 5. Crear la primera cuenta de staff

Son dos pasos porque son dos cosas distintas: la identidad vive en
`auth.users` (la maneja Supabase) y el perfil del taller en `perfil` (lo
maneja este proyecto). No hay registro público: las cuentas se crean a mano
(decisión 18).

**5.1** En el dashboard: **Authentication → Users → Add user → Create new user**.
Pon correo y contraseña, y marca **Auto Confirm User** — si no, la cuenta queda
esperando un correo de confirmación.

**5.2** Copia el UUID del usuario recién creado y, en el **SQL Editor**:

```sql
insert into perfil (id, nombre)
values ('PEGA-AQUI-EL-UUID', 'Tu nombre');
```

Si te saltas este paso, el login va a funcionar pero `/admin` te va a devolver a
`/acceso` una y otra vez: hay sesión, pero no hay staff.

---

## 6. Verificar

```bash
npm run dev
```

1. Abre <http://localhost:3000/acceso> — ahora debe salir el formulario, no el aviso.
2. Entra con el correo y la contraseña del paso 5.
3. Deberías caer en `/admin` con tu nombre arriba a la derecha.

Si vuelve a `/acceso`, casi siempre es el paso 5.2 sin hacer, o `activo = false`
en la fila de `perfil`.

---

## 7. Desplegar en Vercel

El repositorio todavía no tiene remoto. Primero súbelo a GitHub, después:

1. <https://vercel.com/new> → importar el repositorio.
2. Framework: Next.js (lo detecta solo). No hace falta tocar los comandos.
3. **Environment Variables**: las mismas cuatro de `.env.local`, con
   `NEXT_PUBLIC_SITE_URL` apuntando al dominio de Vercel.
4. Deploy.

Cuidado con `NEXT_PUBLIC_SITE_URL`: es la que arma los links que se mandan por
WhatsApp. Si queda en `localhost`, los clientes reciben un link que no abre.

---

## Qué falta después de esto

Con los pasos anteriores queda cerrada la Fase 0. Lo que sigue es la Fase 1
—recepción rápida, tablero y detalle de orden—, que es la que hace útil el
sistema. Ver `ROADMAP.md`.

Todavía no existen tablas para `diagnostico`, `presupuesto`,
`linea_presupuesto`, `foto_orden`, `reserva` ni `config_sitio`: entran en sus
fases correspondientes.
