"use client";

import { CalendarCheck, List, WhatsappLogo, X } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useState } from "react";

import { Boton, Marca } from "./piezas";

const ENLACES = [
  { ancla: "#servicios", texto: "Servicios" },
  { ancla: "#taller", texto: "El taller" },
  { ancla: "#contacto", texto: "Contacto" },
];

/**
 * Barra fija sobre papel.
 *
 * Es la misma en la portada y en `/reservar`. Fuera de la portada `enlacesEn`
 * vale "/", y los enlaces vuelven a las secciones de la portada en vez de
 * buscar anclas que en esa página no existen.
 *
 * A la derecha van las dos acciones del negocio: reservar, con filete, y
 * WhatsApp, que es el objeto sólido. Las dos se sacuden cada ocho segundos,
 * desfasadas entre sí (`.llama` en `globals.css`).
 *
 * En móvil el menú se abre y se cierra sin librerías: son tres enlaces, no
 * hace falta traer una librería de animación al navegador de alguien que entró
 * desde WhatsApp con datos móviles.
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

  // Con las dos acciones a la vista, WhatsApp es el objeto sólido y reservar
  // lleva filete. Si una falta, la que queda pasa a sólida.
  const reservarSolo = reservar && !whatsapp;

  return (
    <header className="sticky top-0 z-50 border-b border-borde bg-fondo/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-7 px-5 py-3 md:px-7">
        <a href={enlacesEn || "#inicio"} className="shrink-0 leading-none" aria-label="Inicio">
          <Marca url={logo} nombre={nombre} alto="h-11 md:h-13" prioridad />
        </a>

        <nav className="ml-auto hidden items-center gap-7 lg:flex">
          {ENLACES.map((enlace) => (
            <a
              key={enlace.ancla}
              href={`${enlacesEn}${enlace.ancla}`}
              className="subrayado font-display text-[15px] font-semibold tracking-[0.09em] text-tinta uppercase"
            >
              {enlace.texto}
            </a>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 lg:ml-0 lg:flex">
          {reservar ? (
            <Boton
              href={reservar}
              tono={reservarSolo ? "marca" : "linea"}
              tamano="chico"
              llamativo="b"
            >
              <CalendarCheck size={17} />
              Reservar
            </Boton>
          ) : null}

          {whatsapp ? (
            <Boton href={whatsapp} tamano="chico" externo llamativo>
              <WhatsappLogo size={17} />
              WhatsApp
            </Boton>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setAbierto((previo) => !previo)}
          aria-expanded={abierto}
          aria-controls="menu-movil"
          aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
          className="ml-auto p-2 text-tinta transition-colors duration-200 hover:bg-tinta/6 lg:hidden"
        >
          {abierto ? <X size={24} /> : <List size={24} />}
        </button>
      </div>

      <div id="menu-movil" hidden={!abierto} className="border-t border-borde bg-fondo lg:hidden">
        <nav className="mx-auto flex w-full max-w-7xl flex-col px-5 py-3">
          {ENLACES.map((enlace) => (
            <a
              key={enlace.ancla}
              href={`${enlacesEn}${enlace.ancla}`}
              onClick={() => setAbierto(false)}
              className="border-b border-borde py-3.5 font-display text-base font-semibold tracking-[0.09em] text-tinta uppercase"
            >
              {enlace.texto}
            </a>
          ))}

          {reservar || whatsapp ? (
            <div className="mt-4 mb-2 flex flex-col gap-2.5">
              {reservar ? (
                <Link
                  href={reservar}
                  onClick={() => setAbierto(false)}
                  className={`inline-flex items-center justify-center gap-2.5 border px-4 py-3 font-display font-semibold tracking-[0.09em] uppercase ${
                    reservarSolo
                      ? "border-marca bg-marca text-white"
                      : "border-borde-fuerte text-tinta"
                  }`}
                >
                  <CalendarCheck size={18} />
                  Reservar hora
                </Link>
              ) : null}

              {whatsapp ? (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setAbierto(false)}
                  className="inline-flex items-center justify-center gap-2.5 border border-marca bg-marca px-4 py-3 font-display font-semibold tracking-[0.09em] text-white uppercase"
                >
                  <WhatsappLogo size={18} />
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
