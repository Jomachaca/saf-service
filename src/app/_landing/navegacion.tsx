"use client";

import { CalendarCheck, List, WhatsappLogo, X } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useState } from "react";

import { Marca } from "./piezas";

const ENLACES = [
  { ancla: "#servicios", texto: "Servicios" },
  { ancla: "#taller", texto: "El taller" },
  { ancla: "#contacto", texto: "Contacto" },
];

const BOTON =
  "pulso items-center gap-2 rounded-lg bg-marca px-4 py-2.5 font-display text-sm font-semibold " +
  "uppercase tracking-wide text-sobre-marca transition duration-200 ease-salida " +
  "hover:bg-marca-viva active:translate-y-px";

const BOTON_MOVIL =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-display " +
  "font-semibold uppercase tracking-wide";

/**
 * Barra fija sobre el bloque marino.
 *
 * Es la misma en la portada y en `/reservar`. Fuera de la portada `enlacesEn`
 * vale "/", y los enlaces vuelven a las secciones de la portada en vez de
 * buscar anclas que en esa página no existen.
 *
 * A la derecha va un solo botón: «Reservar hora» si las reservas están
 * abiertas, WhatsApp si no. En el menú del celular caben los dos.
 *
 * En móvil el menú se abre y se cierra sin librerías: son tres enlaces, no hace
 * falta traer una librería de animación al navegador de alguien que entró desde
 * WhatsApp con datos móviles.
 *
 * Los enlaces se subrayan desde el centro al pasar el mouse y el botón suelta
 * un anillo cada siete segundos (`.subrayado` y `.pulso`, en `globals.css`).
 */
export function Navegacion({
  whatsapp,
  reservar,
  logo,
  nombre,
  enlacesEn = "",
}: {
  whatsapp: string | null;
  reservar: string | null;
  logo: string | null;
  nombre: string;
  enlacesEn?: string;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-estructura/95 backdrop-blur">
      <div className="mx-auto flex h-20 w-full max-w-6xl items-center gap-6 px-5 md:px-8">
        <a href={enlacesEn || "#inicio"} className="shrink-0" aria-label="Inicio">
          <Marca tono="claro" url={logo} nombre={nombre} alto="h-14" />
        </a>

        <nav className="ml-auto hidden items-center gap-7 md:flex">
          {ENLACES.map((enlace) => (
            <a
              key={enlace.ancla}
              href={`${enlacesEn}${enlace.ancla}`}
              className="subrayado text-sm font-medium text-white/75 transition-colors duration-200 hover:text-white"
            >
              {enlace.texto}
            </a>
          ))}
        </nav>

        {reservar ? (
          <Link href={reservar} className={`ml-auto hidden md:ml-0 md:inline-flex ${BOTON}`}>
            <CalendarCheck size={18} weight="fill" />
            Reservar hora
          </Link>
        ) : whatsapp ? (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className={`ml-auto hidden md:ml-0 md:inline-flex ${BOTON}`}
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
              key={enlace.ancla}
              href={`${enlacesEn}${enlace.ancla}`}
              onClick={() => setAbierto(false)}
              className="rounded-lg px-2 py-3 text-white/85 transition-colors duration-200 hover:bg-white/10 hover:text-white"
            >
              {enlace.texto}
            </a>
          ))}

          {reservar || whatsapp ? (
            <div className="mt-2 mb-3 flex flex-col gap-2">
              {reservar ? (
                <Link
                  href={reservar}
                  onClick={() => setAbierto(false)}
                  className={`${BOTON_MOVIL} bg-marca text-sobre-marca`}
                >
                  <CalendarCheck size={18} weight="fill" />
                  Reservar hora
                </Link>
              ) : null}

              {whatsapp ? (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setAbierto(false)}
                  className={`${BOTON_MOVIL} ${
                    reservar ? "border border-white/30 text-white" : "bg-marca text-sobre-marca"
                  }`}
                >
                  <WhatsappLogo size={18} weight="fill" />
                  Escribir por WhatsApp
                </a>
              ) : null}
            </div>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
