import Link from "next/link";
import { Suspense } from "react";

import { cerrarSesion } from "@/app/acceso/acciones";
import { requerirStaff } from "@/lib/sesion";

/**
 * El armazón del panel es estático y se prerenderiza; lo que depende de la
 * sesión entra por streaming detrás de un `<Suspense>` (decisión 22).
 *
 * Quien llegue sin sesión ya fue redirigido por `src/proxy.ts` antes de esto;
 * `requerirStaff()` es la verificación que no depende de que el proxy acierte.
 */
export default function LayoutAdmin({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center gap-4 border-b border-black/10 px-6 py-3 dark:border-white/15">
        <Link href="/admin" className="font-semibold">
          SAF Service
        </Link>

        {/*
          Solo lo que existe. Configuración entra con la Fase 3 y Agenda con
          la 4; enlazarlas antes de tiempo solo produce 404 y hace dudar de si
          algo se rompió.
        */}
        <nav className="flex gap-4 text-sm opacity-80">
          <Link href="/admin/ingreso">Ingreso</Link>
          <Link href="/admin/catalogo">Catálogo</Link>
        </nav>

        <Suspense fallback={<span className="ml-auto text-sm opacity-40">…</span>}>
          <BarraSesion />
        </Suspense>
      </header>

      <main className="flex-1 px-6 py-6">{children}</main>
    </div>
  );
}

async function BarraSesion() {
  const perfil = await requerirStaff();

  return (
    <form action={cerrarSesion} className="ml-auto flex items-center gap-3">
      <span className="text-sm opacity-70">{perfil.nombre}</span>
      <button type="submit" className="text-sm underline underline-offset-4">
        Salir
      </button>
    </form>
  );
}
