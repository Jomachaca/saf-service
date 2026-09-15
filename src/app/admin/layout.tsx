import { SignOut } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Suspense } from "react";

import { cerrarSesion } from "@/app/acceso/acciones";
import { requerirStaff } from "@/lib/sesion";

/**
 * Tablero y agenda son dos entradas y no una pantalla con pestañas: el tablero
 * es el presente y la agenda el futuro (ARQUITECTURA.md §11). El tablero no
 * lleva enlace propio porque es a donde lleva el nombre del taller.
 */
const ENLACES = [
  { href: "/admin/ingreso", texto: "Ingreso" },
  { href: "/admin/agenda", texto: "Agenda" },
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
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-5 md:gap-6 md:px-6">
          <Link href="/admin" className="shrink-0">
            <span className="font-display text-xl font-bold uppercase italic tracking-tight">
              <span className="text-vino-300">SAF</span>
              <span> Service</span>
            </span>
          </Link>

          {/*
            Con cuatro enlaces no entra todo en un celular: la fila se desliza
            de lado en vez de partirse en dos líneas o esconderse en un menú.
          */}
          <nav className="-mx-1 flex min-w-0 flex-1 gap-1 overflow-x-auto px-1 text-sm [scrollbar-width:none]">
            {ENLACES.map((enlace) => (
              <Link
                key={enlace.href}
                href={enlace.href}
                className="shrink-0 rounded-lg px-3 py-1.5 text-white/75 transition-colors duration-200 hover:bg-white/10 hover:text-white"
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
    <form action={cerrarSesion} className="ml-auto flex shrink-0 items-center gap-3">
      <span className="hidden text-sm text-white/70 lg:inline">{perfil.nombre}</span>
      <button
        type="submit"
        aria-label="Salir"
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-white/75 transition-colors duration-200 hover:bg-white/10 hover:text-white"
      >
        <SignOut size={16} />
        <span className="hidden sm:inline">Salir</span>
      </button>
    </form>
  );
}
