"use client";

import { List, WhatsappLogo, X } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";

import { Marca } from "./piezas";

const ENLACES = [
  { href: "#servicios", texto: "Servicios" },
  { href: "#taller", texto: "El taller" },
  { href: "#contacto", texto: "Contacto" },
];

/**
 * Barra fija sobre el bloque marino del hero.
 *
 * En móvil el menú se abre y se cierra con una transición de CSS: son tres
 * enlaces, no hace falta traer una librería de animación al navegador de
 * alguien que entró desde WhatsApp con datos móviles.
 */
export function Navegacion({
  whatsapp,
  logo,
  nombre,
}: {
  whatsapp: string | null;
  logo: string | null;
  nombre: string;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-estructura/95 backdrop-blur">
      <div className="mx-auto flex h-20 w-full max-w-6xl items-center gap-6 px-5 md:px-8">
        <a href="#inicio" className="shrink-0" aria-label="Inicio">
          <Marca tono="claro" url={logo} nombre={nombre} alto="h-14" />
        </a>

        <nav className="ml-auto hidden items-center gap-7 md:flex">
          {ENLACES.map((enlace) => (
            <a
              key={enlace.href}
              href={enlace.href}
              className="text-sm font-medium text-white/75 transition-colors duration-200 hover:text-white"
            >
              {enlace.texto}
            </a>
          ))}
        </nav>

        {whatsapp ? (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto hidden items-center gap-2 rounded-lg bg-marca px-4 py-2.5 font-display text-sm font-semibold uppercase tracking-wide text-sobre-marca transition duration-200 ease-salida hover:bg-marca-viva active:translate-y-px md:ml-0 md:inline-flex"
          >
            <WhatsappLogo size={18} weight="fill" />
            WhatsApp
          </a>
        ) : null}

        <button
          type="button"
          onClick={() => setAbierto((previo) => !previo)}
          aria-expanded={abierto}
          aria-controls="menu-movil"
          aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
          className="ml-auto rounded-lg p-2 text-white transition-colors duration-200 hover:bg-white/10 md:hidden"
        >
          {abierto ? <X size={24} /> : <List size={24} />}
        </button>
      </div>

      <div
        id="menu-movil"
        hidden={!abierto}
        className="border-t border-white/10 bg-estructura md:hidden"
      >
        <nav className="mx-auto flex w-full max-w-6xl flex-col px-5 py-2">
          {ENLACES.map((enlace) => (
            <a
              key={enlace.href}
              href={enlace.href}
              onClick={() => setAbierto(false)}
              className="rounded-lg px-2 py-3 text-white/85 transition-colors duration-200 hover:bg-white/10 hover:text-white"
            >
              {enlace.texto}
            </a>
          ))}

          {whatsapp ? (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setAbierto(false)}
              className="mt-2 mb-3 inline-flex items-center justify-center gap-2 rounded-lg bg-marca px-4 py-3 font-display font-semibold uppercase tracking-wide text-sobre-marca"
            >
              <WhatsappLogo size={18} weight="fill" />
              Escribir por WhatsApp
            </a>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
