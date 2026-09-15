import { CalendarCheck, MapPin, WhatsappLogo } from "@phosphor-icons/react/dist/ssr";

import type { Hero as ContenidoHero, Taller } from "@/lib/sitio/contenido";

import { Boton, MarcoFoto } from "./piezas";

/**
 * Bloque marino con la propuesta y las dos acciones que importan.
 *
 * Con las reservas abiertas, esas dos son reservar y escribir. Sin reservas,
 * escribir y llegar: un botón de reserva que no lleva a ningún formulario es
 * peor que no ofrecerlo.
 */
export function Hero({
  hero,
  taller,
  whatsappHref,
  reservarHref,
  mapaHref,
}: {
  hero: ContenidoHero;
  taller: Taller;
  whatsappHref: string | null;
  reservarHref: string | null;
  mapaHref: string | null;
}) {
  const titulo = hero.titulo || taller.nombre;
  const subtitulo = hero.subtitulo || taller.descripcion;

  return (
    <section id="inicio" className="relative overflow-hidden bg-estructura text-white">
      <div
        aria-hidden
        className="trama-neumatico pointer-events-none absolute inset-0 opacity-30"
      />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-5 pt-14 pb-20 md:grid-cols-12 md:gap-14 md:px-8 md:pt-24 md:pb-28">
        <div className="flex flex-col gap-7 md:col-span-7">
          <h1 className="font-display text-4xl leading-[1.05] font-bold tracking-tight text-balance md:text-6xl">
            {titulo}
          </h1>

          {subtitulo ? (
            <p className="max-w-xl text-lg leading-relaxed text-white/75 md:text-xl">
              {subtitulo}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {reservarHref ? (
              <>
                <Boton href={reservarHref}>
                  <CalendarCheck size={20} weight="fill" />
                  Reservar hora
                </Boton>

                {whatsappHref ? (
                  <Boton href={whatsappHref} tono="claro" externo>
                    <WhatsappLogo size={20} weight="fill" />
                    Escribir por WhatsApp
                  </Boton>
                ) : null}
              </>
            ) : (
              <>
                {whatsappHref ? (
                  <Boton href={whatsappHref} externo>
                    <WhatsappLogo size={20} weight="fill" />
                    Escribir por WhatsApp
                  </Boton>
                ) : null}

                {mapaHref ? (
                  <Boton href={mapaHref} tono="claro" externo>
                    <MapPin size={20} weight="fill" />
                    Cómo llegar
                  </Boton>
                ) : null}
              </>
            )}
          </div>
        </div>

        <div className="md:col-span-5">
          <MarcoFoto
            url={hero.imagenUrl}
            alt={`Taller ${taller.nombre}`}
            proporcion="aspect-4/3"
            prioridad
            tamanos="(min-width: 768px) 40vw, 100vw"
          />
        </div>
      </div>
    </section>
  );
}
