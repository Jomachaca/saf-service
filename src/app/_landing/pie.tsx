import {
  EnvelopeSimple,
  FacebookLogo,
  InstagramLogo,
  MapPin,
  Phone,
  TiktokLogo,
  WhatsappLogo,
} from "@phosphor-icons/react/dist/ssr";
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
    <footer className="mt-auto bg-estructura text-white/70">
      <div className="mx-auto w-full max-w-6xl px-5 py-14 md:px-8 md:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div
            style={paso(0)}
            className="al-entrar flex flex-col gap-4 sm:col-span-2 lg:col-span-4"
          >
            <Marca tono="claro" url={taller.logoUrl} nombre={taller.nombre} alto="h-16" />

            {taller.descripcion ? (
              <p className="max-w-xs text-sm leading-relaxed">{taller.descripcion}</p>
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
                    className="rounded-lg border border-white/20 p-2.5 transition duration-200 ease-salida hover:border-white/50 hover:bg-white/10 hover:text-white active:translate-y-px"
                  >
                    <red.Icono size={20} />
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <Columna titulo="Navegación" indice={1} ancho="lg:col-span-3">
            <Enlace href={enlacesEn || "#inicio"}>Inicio</Enlace>
            <Enlace href={`${enlacesEn}#servicios`}>Servicios</Enlace>
            <Enlace href={`${enlacesEn}#taller`}>El taller</Enlace>
            <Enlace href={`${enlacesEn}#contacto`}>Contacto</Enlace>
            {reservarHref ? (
              <Link
                href={reservarHref}
                className="w-fit text-sm transition-colors duration-200 hover:text-white"
              >
                <span className="subrayado">Reservar hora</span>
              </Link>
            ) : null}
          </Columna>

          {categorias.length > 0 ? (
            <Columna titulo="Servicios" indice={2} ancho="lg:col-span-2">
              {categorias.map((categoria) => (
                <Enlace key={categoria} href={`${enlacesEn}#servicios`}>
                  {ETIQUETA_CATEGORIA[categoria]}
                </Enlace>
              ))}
            </Columna>
          ) : null}

          <Columna titulo="Contacto" indice={3} ancho="lg:col-span-3">
            {taller.telefono ? (
              <Enlace href={`tel:${taller.telefono.replace(/\s/g, "")}`} Icono={Phone}>
                <span className="tabular-nums">{taller.telefono}</span>
              </Enlace>
            ) : null}

            {whatsappHref ? (
              <Enlace href={whatsappHref} externo Icono={WhatsappLogo}>
                WhatsApp
              </Enlace>
            ) : null}

            {taller.email ? (
              <Enlace href={`mailto:${taller.email}`} Icono={EnvelopeSimple}>
                <span className="break-all">{taller.email}</span>
              </Enlace>
            ) : null}

            {taller.direccion ? (
              <p className="flex gap-2.5 text-sm leading-relaxed">
                <MapPin size={18} className="mt-0.5 shrink-0 text-vino-300" />
                {mapaHref ? (
                  <a
                    href={mapaHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors duration-200 hover:text-white"
                  >
                    {taller.direccion}
                  </a>
                ) : (
                  taller.direccion
                )}
              </p>
            ) : null}
          </Columna>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-sm">
          <p>{taller.nombre}</p>
          {taller.slogan ? <p className="text-white/50">{taller.slogan}</p> : null}
        </div>
      </div>
    </footer>
  );
}

function Columna({
  titulo,
  indice,
  ancho,
  children,
}: {
  titulo: string;
  indice: number;
  ancho: string;
  children: React.ReactNode;
}) {
  return (
    <div style={paso(indice)} className={`al-entrar flex flex-col gap-3 ${ancho}`}>
      <h2 className="font-display text-lg font-semibold tracking-wide text-white uppercase">
        {titulo}
      </h2>
      {children}
    </div>
  );
}

/**
 * Un enlace del pie. El subrayado crece desde el centro y va sobre el texto, no
 * sobre la fila entera: con el ícono adentro, la barra saldría más larga que la
 * palabra.
 */
function Enlace({
  href,
  externo,
  Icono,
  children,
}: {
  href: string;
  externo?: boolean;
  Icono?: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="flex w-fit items-center gap-2.5 text-sm transition-colors duration-200 hover:text-white"
    >
      {Icono ? <Icono size={18} className="shrink-0 text-vino-300" /> : null}
      <span className="subrayado">{children}</span>
    </a>
  );
}
