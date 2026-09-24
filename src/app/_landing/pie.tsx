import { FacebookLogo, InstagramLogo, TiktokLogo } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { CATEGORIAS, ETIQUETA_CATEGORIA } from "@/lib/orden/presupuesto";
import type { ServicioPublico, Taller } from "@/lib/sitio/contenido";

import { Marca, paso } from "./piezas";

const REDES = [
  { clave: "facebook", etiqueta: "Facebook", Icono: FacebookLogo },
  { clave: "instagram", etiqueta: "Instagram", Icono: InstagramLogo },
  { clave: "tiktok", etiqueta: "TikTok", Icono: TiktokLogo },
] as const;

/**
 * El pie, en cuatro columnas: quiénes somos, a dónde ir, qué hacemos y cómo
 * ubicarnos.
 *
 * Cada columna se arma con lo que el taller tenga cargado y desaparece si no
 * tiene nada: sin redes no hay fila de íconos, y sin servicios activos no hay
 * columna de servicios. Es el mismo criterio del resto del landing.
 *
 * Fuera de la portada, `enlacesEn` vale "/" y las anclas vuelven a la portada
 * en vez de buscar secciones que en esa página no existen.
 */
export function Pie({
  taller,
  servicios = [],
  whatsappHref,
  reservarHref,
  mapaHref,
  enlacesEn = "",
}: {
  taller: Taller;
  servicios?: ServicioPublico[];
  whatsappHref?: string | null;
  reservarHref?: string | null;
  mapaHref?: string | null;
  enlacesEn?: string;
}) {
  // Sin año: leer la fecha actual acá obligaría a renderizar el pie en cada
  // visita, y un landing que se publica a mano no tiene por qué ser dinámico
  // para pintar un número que nadie mira.
  const redes = REDES.filter((red) => taller[red.clave].trim());
  const categorias = CATEGORIAS.filter((categoria) =>
    servicios.some((servicio) => servicio.categoria === categoria),
  );

  return (
    <footer className="mt-auto bg-marino-900 text-white/70">
      <div className="mx-auto w-full max-w-7xl px-5 pt-16 pb-7 md:px-7">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(3,minmax(0,1fr))]">
          <div style={paso(0)} className="al-entrar flex flex-col gap-4 sm:col-span-2 lg:col-span-1">
            <Marca tono="claro" url={taller.logoUrl} nombre={taller.nombre} alto="h-15" />

            {taller.descripcion ? (
              <p className="max-w-76 text-[15px] leading-relaxed">{taller.descripcion}</p>
            ) : null}

            {redes.length > 0 ? (
              <div className="mt-1 flex gap-2">
                {redes.map((red) => (
                  <a
                    key={red.clave}
                    href={taller[red.clave]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={red.etiqueta}
                    className="border border-white/25 p-2.5 transition duration-200 ease-salida hover:bg-white/12 hover:text-white active:translate-y-px"
                  >
                    <red.Icono size={19} />
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <Columna titulo="Navegación" indice={1}>
            <Enlace href={enlacesEn || "#inicio"}>Inicio</Enlace>
            <Enlace href={`${enlacesEn}#servicios`}>Servicios</Enlace>
            <Enlace href={`${enlacesEn}#taller`}>El taller</Enlace>
            <Enlace href={`${enlacesEn}#contacto`}>Contacto</Enlace>
            {reservarHref ? (
              <Link href={reservarHref} className="w-fit text-[15px] text-white/78">
                <span className="subrayado">Reservar hora</span>
              </Link>
            ) : null}
          </Columna>

          {categorias.length > 0 ? (
            <Columna titulo="Servicios" indice={2}>
              {categorias.map((categoria) => (
                <Enlace key={categoria} href={`${enlacesEn}#servicios`}>
                  {ETIQUETA_CATEGORIA[categoria]}
                </Enlace>
              ))}
            </Columna>
          ) : null}

          <Columna titulo="Contacto" indice={3}>
            {taller.telefono ? (
              <Enlace href={`tel:${taller.telefono.replace(/\s/g, "")}`}>
                <span className="tabular-nums">{taller.telefono}</span>
              </Enlace>
            ) : null}

            {whatsappHref ? (
              <Enlace href={whatsappHref} externo>
                WhatsApp
              </Enlace>
            ) : null}

            {taller.email ? (
              <Enlace href={`mailto:${taller.email}`}>
                <span className="break-all">{taller.email}</span>
              </Enlace>
            ) : null}

            {taller.direccion ? (
              mapaHref ? (
                <Enlace href={mapaHref} externo>
                  {taller.direccion}
                </Enlace>
              ) : (
                <p className="text-[15px] leading-relaxed">{taller.direccion}</p>
              )
            ) : null}
          </Columna>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-white/15 pt-5 font-display text-[13px] font-semibold tracking-[0.14em] uppercase">
          <p>{taller.nombre}</p>

          {/* Los dos legales van acá y no en una columna: se buscan cuando se
              buscan, y ocupar una columna entera con ellos sería darles un peso
              que no tienen. */}
          <nav aria-label="Información legal" className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/privacidad" className="transition-colors duration-200 hover:text-white">
              Privacidad
            </Link>
            <Link href="/terminos" className="transition-colors duration-200 hover:text-white">
              Términos
            </Link>
          </nav>

          {taller.slogan ? <p className="text-white/45">{taller.slogan}</p> : null}
        </div>
      </div>
    </footer>
  );
}

function Columna({
  titulo,
  indice,
  children,
}: {
  titulo: string;
  indice: number;
  children: React.ReactNode;
}) {
  return (
    <div style={paso(indice)} className="al-entrar flex flex-col gap-3">
      <h2 className="font-display text-[13px] font-bold tracking-[0.2em] text-white/50 uppercase">
        {titulo}
      </h2>
      {children}
    </div>
  );
}

/**
 * Un enlace del pie. El subrayado crece desde la izquierda y va sobre el
 * texto, no sobre la fila: así la barra mide lo que mide la palabra.
 */
function Enlace({
  href,
  externo,
  children,
}: {
  href: string;
  externo?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="w-fit text-[15px] text-white/78 transition-colors duration-200 hover:text-white"
    >
      <span className="subrayado">{children}</span>
    </a>
  );
}
