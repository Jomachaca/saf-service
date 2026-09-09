import { SignOut } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Suspense } from "react";

import { cerrarSesion } from "@/app/acceso/acciones";
import { requerirStaff } from "@/lib/sesion";

const ENLACES = [
  { href: "/admin/ingreso", texto: "Ingreso" },
  { href: "/admin/catalogo", texto: "Catálogo" },
  { href: "/admin/config", texto: "Sitio" },
];

/**
 * El armazón del panel es estático y se prerenderiza; lo que depende de la
 * sesión entra por streaming detrás de un `<Suspense>` (decisión 22).
 *
 * Quien llegue sin sesión ya fue redirigido por `src/proxy.ts` antes de esto;
 * `requerirStaff()` es la verificación que no depende de que el proxy acierte.
 *
 * La cabecera es el mismo bloque marino del sitio público: quien pasa del
 * landing al panel tiene que sentir que sigue en el mismo lugar.
 */
export default function LayoutAdmin({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-estructura text-white">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-6 px-5 md:px-6">
          <Link href="/admin" className="shrink-0">
            <span className="font-display text-xl font-bold uppercase italic tracking-tight">
              <span className="text-vino-300">SAF</span>
              <span> Service</span>
            </span>
          </Link>

          {/*
            Solo lo que existe. Agenda entra con la Fase 4; enlazarla antes de
            tiempo solo produce 404 y hace dudar de si algo se rompió.
          */}
          <nav className="flex gap-1 text-sm">
            {ENLACES.map((enlace) => (
              <Link
                key={enlace.href}
                href={enlace.href}
                className="rounded-lg px-3 py-1.5 text-white/75 transition-colors duration-200 hover:bg-white/10 hover:text-white"
              >
                {enlace.texto}
              </Link>
            ))}
          </nav>

          <Suspense fallback={<span className="ml-auto text-sm text-white/40">…</span>}>
            <BarraSesion />
          </Suspense>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-6 md:px-6 md:py-8">
        {children}
      </main>
    </div>
  );
}

async function BarraSesion() {
  const perfil = await requerirStaff();

  return (
    <form action={cerrarSesion} className="ml-auto flex items-center gap-3">
      <span className="hidden text-sm text-white/70 sm:inline">{perfil.nombre}</span>
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-white/75 transition-colors duration-200 hover:bg-white/10 hover:text-white"
      >
        <SignOut size={16} />
        Salir
      </button>
    </form>
  );
}
