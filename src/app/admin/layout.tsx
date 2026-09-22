import { SignOut } from "@phosphor-icons/react/dist/ssr";
import { Suspense } from "react";

import { cerrarSesion } from "@/app/acceso/acciones";
import { cargarPublicacion, haySinPublicar } from "@/lib/sitio/panel";
import { requerirStaff } from "@/lib/sesion";

import { MarcaPanel } from "./componentes";
import { EnlacesConRuta, EnlacesPanel, MenuMovil } from "./navegacion";

/**
 * El armazón del panel: la barra lateral con las secciones y, al lado, la
 * pantalla. Tablero y agenda siguen siendo entradas separadas: el tablero es el
 * presente y la agenda el futuro (ARQUITECTURA.md §11). Qué entró en cada
 * sección, y por qué no son más, está en la decisión 31.
 *
 * El armazón es estático y se prerenderiza; lo que depende de la sesión entra
 * por streaming detrás de su `<Suspense>` (decisión 22). La entrada encendida
 * sale de `usePathname()`, que en `/admin/orden/{id}` no se conoce al
 * prerenderizar: hasta que se conoce, los enlaces se pintan sin marcar.
 *
 * Quien llegue sin sesión ya fue redirigido por `src/proxy.ts`;
 * `requerirStaff()` es la verificación que no depende de que el proxy acierte.
 *
 * En el celular no hay lugar para la barra: queda una franja marina arriba y la
 * misma navegación se abre como cajón.
 *
 * Las pantallas miden el ancho que les queda con `@container`, no con los cortes
 * de pantalla: con la barra lateral, una pantalla de 1024 px deja poco más de
 * 720 para el contenido, y un `lg:` creería que tiene los 1024.
 */
export default function LayoutAdmin({ children }: LayoutProps<"/admin">) {
  const avisoSitio = (
    <Suspense fallback={null}>
      <AvisoSinPublicar />
    </Suspense>
  );

  const navegacion = (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Suspense fallback={<EnlacesPanel ruta={null} avisoSitio={avisoSitio} />}>
          <EnlacesConRuta avisoSitio={avisoSitio} />
        </Suspense>
      </div>

      <Suspense fallback={<div className="h-14 shrink-0 border-t border-white/12" />}>
        <Sesion />
      </Suspense>
    </>
  );

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 bg-marino-900 px-4 lg:hidden">
        <MenuMovil>{navegacion}</MenuMovil>
        <MarcaPanel />
      </header>

      <aside className="sticky top-0 hidden h-dvh w-62 shrink-0 flex-col bg-marino-900 text-sobre-estructura lg:flex">
        <div className="flex h-21 shrink-0 items-center border-b border-white/12 px-5.5">
          <MarcaPanel />
        </div>
        {navegacion}
      </aside>

      <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-9 lg:pt-10 lg:pb-16">
        <div className="@container mx-auto w-full max-w-[1160px]">{children}</div>
      </main>
    </div>
  );
}

async function Sesion() {
  const perfil = await requerirStaff();

  return (
    <form
      action={cerrarSesion}
      className="flex shrink-0 items-center gap-2.5 border-t border-white/12 py-3.5 pr-3.5 pl-5.5"
    >
      <span className="min-w-0 flex-1 truncate text-[15px] text-marino-200">{perfil.nombre}</span>
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 border border-white/25 px-2.5 py-1.5 font-display text-xs font-semibold tracking-[0.12em] text-marino-200 uppercase transition-colors duration-200 hover:bg-white/10 hover:text-white"
      >
        <SignOut size={14} />
        Salir
      </button>
    </form>
  );
}

/**
 * Lo guardado que el sitio público todavía no muestra (decisión 17), a la vista
 * desde cualquier pantalla. Hace falta porque el interruptor de reservas, que
 * vive fuera de «Sitio web», también deja la portada pendiente de publicar.
 */
async function AvisoSinPublicar() {
  await requerirStaff();

  const publicacion = await cargarPublicacion();
  if (!publicacion || !haySinPublicar(publicacion)) return null;

  return (
    <span className="shrink-0 border border-vino-300/45 px-2 py-0.5 font-display text-[10px] font-semibold tracking-[0.14em] text-vino-300 uppercase">
      Sin publicar
    </span>
  );
}
