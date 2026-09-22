import { CalendarCheck, MapPin, WhatsappLogo } from "@phosphor-icons/react/dist/ssr";

import type { Hero as ContenidoHero, Taller } from "@/lib/sitio/contenido";

import { Boton, MarcoFoto } from "./piezas";

/**
 * Bloque marino con la propuesta y las dos acciones que importan.
 *
 * WhatsApp es el objeto sólido y reservar lleva filete: de los dos canales, el
 * que un taller de barrio cierra más rápido es el mensaje. Sin WhatsApp
 * cargado, reservar pasa a sólido; sin ninguno de los dos queda «Cómo llegar»,
 * porque un botón que no lleva a ningún lado es peor que no ofrecerlo.
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

  // La última palabra del titular va en rosa. Es tratamiento tipográfico, no
  // contenido: el taller escribe una frase y no tiene que saber dónde cortarla.
  const palabras = titulo.trim().split(/\s+/);
  const ultima = palabras.length > 1 ? palabras.pop() : null;

  return (
    <section id="inicio" className="relative overflow-hidden bg-estructura text-white">
      <div aria-hidden className="huella pointer-events-none absolute inset-0 opacity-55" />

      <div className="relative mx-auto w-full max-w-7xl px-5 pt-16 pb-16 md:px-7 md:pt-20 md:pb-20">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14">
          <div className="al-entrar flex flex-col gap-6">
            {taller.slogan ? (
              <p className="flex items-center gap-3.5 font-display text-[13px] font-semibold tracking-[0.24em] text-marino-300 uppercase">
                <span aria-hidden className="h-px w-8 bg-marino-300" />
                {taller.slogan}
              </p>
            ) : null}

            <h1 className="font-display text-[clamp(2.875rem,5.6vw,5rem)] leading-[0.94] font-bold text-balance uppercase">
              {ultima ? (
                <>
                  {palabras.join(" ")} <span className="text-vino-300">{ultima}</span>
                </>
              ) : (
                titulo
              )}
            </h1>

            {subtitulo ? (
              <p className="max-w-xl text-lg leading-relaxed text-white/80 md:text-xl">
                {subtitulo}
              </p>
            ) : null}

            <div className="mt-1 flex flex-wrap gap-3">
              {whatsappHref ? (
                <Boton href={whatsappHref} externo llamativo>
                  <WhatsappLogo size={20} />
                  Escribir por WhatsApp
                </Boton>
              ) : null}

              {reservarHref ? (
                <Boton
                  href={reservarHref}
                  tono={whatsappHref ? "clara" : "marca"}
                  llamativo="b"
                >
                  <CalendarCheck size={20} />
                  Reservar hora
                </Boton>
              ) : null}

              {!whatsappHref && !reservarHref && mapaHref ? (
                <Boton href={mapaHref} tono="clara" externo>
                  <MapPin size={20} />
                  Cómo llegar
                </Boton>
              ) : null}
            </div>
          </div>

          <MarcoFoto
            url={hero.imagenUrl}
            alt={`Taller ${taller.nombre}`}
            proporcion="aspect-4/3"
            prioridad
            tono="claro"
            tamanos="(min-width: 1024px) 45vw, 100vw"
            paso={1}
          />
        </div>
      </div>
    </section>
  );
}
