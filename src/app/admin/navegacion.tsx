"use client";

import {
  CalendarDots,
  CarProfile,
  Clock,
  Garage,
  GlobeSimple,
  List,
  SquaresFour,
  Wrench,
  X,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { MarcaPanel } from "./componentes";

type Entrada = {
  href: string;
  texto: string;
  icono: typeof SquaresFour;
  /** Las partes de una sección larga, que se despliegan al estar en ella. */
  partes?: { href: string; texto: string }[];
};

/**
 * Siete entradas en dos grupos, y ninguna más sin una buena razón: arriba lo
 * del día a día, abajo lo que se configura de vez en cuando (decisión 31).
 *
 * «Espacios» es la séptima y entró con la decisión 35. No cabía dentro de
 * ninguna: los lugares del taller no son el horario de reservas ni el catálogo
 * ni el sitio público, y esconderlos en una sección ajena los haría
 * imposibles de encontrar el día que el taller cambia de forma.
 */
const DIA_A_DIA: Entrada[] = [
  { href: "/admin", texto: "Tablero", icono: SquaresFour },
  { href: "/admin/ingreso", texto: "Recepción", icono: CarProfile },
  { href: "/admin/agenda", texto: "Agenda", icono: CalendarDots },
];

const CONFIGURACION: Entrada[] = [
  { href: "/admin/espacios", texto: "Espacios", icono: Garage },
  { href: "/admin/reservas", texto: "Reservas", icono: Clock },
  { href: "/admin/catalogo", texto: "Catálogo", icono: Wrench },
  {
    href: "/admin/sitio",
    texto: "Sitio web",
    icono: GlobeSimple,
    partes: [
      { href: "/admin/sitio", texto: "Datos y contacto" },
      { href: "/admin/sitio/portada", texto: "Portada" },
      { href: "/admin/sitio/taller", texto: "El taller" },
    ],
  },
];

/** El detalle de una orden se abre desde el tablero, así que cuenta como tablero. */
function encendida(href: string, ruta: string | null): boolean {
  if (ruta === null) return false;
  if (href === "/admin") return ruta === "/admin" || ruta.startsWith("/admin/orden/");
  return ruta === href || ruta.startsWith(`${href}/`);
}

/**
 * Los enlaces del panel. `ruta` llega en null mientras no se sabe en qué
 * pantalla se está (ver el layout): se pintan igual, sin marcar ninguno.
 */
export function EnlacesPanel({
  ruta,
  avisoSitio,
}: {
  ruta: string | null;
  avisoSitio: React.ReactNode;
}) {
  return (
    <nav aria-label="Secciones del panel" className="flex flex-col gap-6 px-3.5 py-5">
      <div className="flex flex-col gap-2.5">
        <h2 className="px-2.5 font-display text-[11px] font-semibold tracking-[0.24em] text-marino-400 uppercase">
          Día a día
        </h2>
        <Grupo entradas={DIA_A_DIA} ruta={ruta} avisoSitio={avisoSitio} />
      </div>

      <div className="flex flex-col gap-2.5">
        <h2 className="px-2.5 font-display text-[11px] font-semibold tracking-[0.24em] text-marino-400 uppercase">
          Configuración
        </h2>
        <Grupo entradas={CONFIGURACION} ruta={ruta} avisoSitio={avisoSitio} />
      </div>
    </nav>
  );
}

export function EnlacesConRuta({ avisoSitio }: { avisoSitio: React.ReactNode }) {
  const ruta = usePathname();
  return <EnlacesPanel ruta={ruta} avisoSitio={avisoSitio} />;
}

function Grupo({
  entradas,
  ruta,
  avisoSitio,
}: {
  entradas: Entrada[];
  ruta: string | null;
  avisoSitio: React.ReactNode;
}) {
  return (
    <ul className="flex flex-col gap-0.5">
      {entradas.map(({ href, texto, icono: Icono, partes }) => {
        const activa = encendida(href, ruta);

        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={activa ? (partes ? "true" : "page") : undefined}
              className={`flex items-center gap-3 border-l-2 px-3 py-2.5 font-display text-[15px] font-semibold tracking-[0.09em] uppercase transition-colors duration-200 ${
                activa
                  ? "border-marca bg-white/8 text-white"
                  : "border-transparent text-marino-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icono
                size={18}
                className={activa ? "text-vino-300" : "text-marino-400"}
              />
              <span className="min-w-0 flex-1 truncate">{texto}</span>
              {href === "/admin/sitio" ? avisoSitio : null}
            </Link>

            {/*
              Las partes solo se ven dentro de la sección: con todas a la vista,
              la barra dejaría de tener pocas entradas.
            */}
            {activa && partes ? (
              <ul className="mt-1 mb-2 ml-5.5 flex flex-col gap-0.5 border-l border-white/10 pl-3">
                {partes.map((parte) => {
                  const actual = ruta === parte.href;

                  return (
                    <li key={parte.href}>
                      <Link
                        href={parte.href}
                        aria-current={actual ? "page" : undefined}
                        className={`block px-3 py-1.5 text-sm transition-colors duration-200 ${
                          actual
                            ? "bg-white/8 font-medium text-white"
                            : "text-marino-300 hover:text-white"
                        }`}
                      >
                        {parte.texto}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * El menú del celular: la misma navegación, en un cajón que entra por la
 * izquierda. Es un <dialog> modal, así que el foco, Escape y el fondo inerte
 * los resuelve el navegador; la animación está en `globals.css` (`.cajon`).
 */
export function MenuMovil({ children }: { children: React.ReactNode }) {
  const cajon = useRef<HTMLDialogElement>(null);

  // Un tablet que se gira puede pasar a mostrar la barra lateral con el cajón
  // abierto, y el cajón quedaría encima del panel tapándolo.
  useEffect(() => {
    const ancha = window.matchMedia("(min-width: 64rem)");
    const cerrar = () => {
      if (ancha.matches) cajon.current?.close();
    };

    ancha.addEventListener("change", cerrar);
    return () => ancha.removeEventListener("change", cerrar);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => cajon.current?.showModal()}
        aria-label="Abrir menú"
        aria-haspopup="dialog"
        className="-ml-2 p-2 text-white transition-colors duration-200 hover:bg-white/10"
      >
        <List size={24} />
      </button>

      <dialog
        ref={cajon}
        aria-label="Menú del panel"
        onClick={(evento) => {
          // El fondo oscuro pertenece al propio <dialog>: un clic ahí llega con
          // el dialog como destino. Un enlace también cierra, porque navegar no
          // recarga la página y el cajón seguiría abierto encima.
          const destino = evento.target as HTMLElement;
          if (destino === evento.currentTarget || destino.closest("a")) {
            evento.currentTarget.close();
          }
        }}
        className="cajon fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-72 max-w-[85vw] border-0 bg-marino-900 p-0 text-sobre-estructura backdrop:bg-marino-900/70"
      >
        <div className="flex h-full flex-col">
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4">
            <MarcaPanel />
            <button
              type="button"
              onClick={() => cajon.current?.close()}
              aria-label="Cerrar menú"
              className="-mr-2 p-2 text-white transition-colors duration-200 hover:bg-white/10"
            >
              <X size={22} />
            </button>
          </div>

          {children}
        </div>
      </dialog>
    </>
  );
}
