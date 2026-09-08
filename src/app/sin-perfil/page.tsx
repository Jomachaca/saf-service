import { redirect } from "next/navigation";
import { Suspense } from "react";

import { cerrarSesion } from "@/app/acceso/acciones";
import { obtenerSesion } from "@/lib/sesion";

export const metadata = {
  title: "Sin perfil · SAF Service",
};

/**
 * El callejón sin salida que antes era un bucle.
 *
 * Se llega acá con sesión válida de Supabase pero sin fila en `perfil`, o con
 * ella desactivada. Es lo que pasa cuando se crea una cuenta en el panel de
 * Supabase y se olvida el segundo paso, que es justo el error más fácil de
 * cometer al montar el sistema.
 *
 * La página muestra el UID porque es exactamente el dato que hace falta para
 * arreglarlo, y así nadie tiene que ir a buscarlo al panel de Supabase.
 */
export default function PaginaSinPerfil() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div>
        <h1 className="text-xl font-semibold">Tu cuenta no es de staff</h1>
        <p className="mt-1 text-sm opacity-70">
          El correo y la contraseña son correctos, pero esta cuenta no tiene un
          perfil en el taller, o está desactivado.
        </p>
      </div>

      <Suspense fallback={<p className="text-sm opacity-40">Cargando…</p>}>
        <Detalle />
      </Suspense>
    </main>
  );
}

async function Detalle() {
  const sesion = await obtenerSesion();

  // Sin sesión no hay nada que explicar; con perfil, esta página sobra.
  if (sesion.tipo === "sin-sesion") redirect("/acceso");
  if (sesion.tipo === "staff") redirect("/admin");

  return (
    <>
      <div className="flex flex-col gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
        <p>
          Para darle acceso, un administrador tiene que ejecutar esto en el SQL
          Editor de Supabase:
        </p>

        <pre className="overflow-x-auto rounded bg-black/10 p-3 text-xs dark:bg-white/10">
          <code>{`insert into perfil (id, nombre)
values ('${sesion.usuarioId}', 'Nombre y apellido');`}</code>
        </pre>

        {sesion.email ? <p className="opacity-70">Cuenta: {sesion.email}</p> : null}
      </div>

      <form action={cerrarSesion}>
        <button type="submit" className="text-sm underline underline-offset-4">
          Cerrar sesión
        </button>
      </form>
    </>
  );
}
