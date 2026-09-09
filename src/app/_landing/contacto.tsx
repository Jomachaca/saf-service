import {
  EnvelopeSimple,
  FacebookLogo,
  InstagramLogo,
  MapPin,
  Phone,
  TiktokLogo,
  WhatsappLogo,
} from "@phosphor-icons/react/dist/ssr";

import type { Taller } from "@/lib/sitio/contenido";

import { Boton, Seccion } from "./piezas";

const REDES = [
  { clave: "facebook", etiqueta: "Facebook", Icono: FacebookLogo },
  { clave: "instagram", etiqueta: "Instagram", Icono: InstagramLogo },
  { clave: "tiktok", etiqueta: "TikTok", Icono: TiktokLogo },
] as const;

/**
 * Datos de contacto y mapa.
 *
 * La sección cambia de forma según haya mapa cargado o no: con mapa son dos
 * columnas, y sin mapa los datos se reparten a lo ancho en vez de dejar media
 * pantalla vacía. Un taller que todavía no pegó su enlace de Google no tiene
 * por qué ver un hueco.
 */
export function Contacto({
  taller,
  whatsappHref,
  mapaHref,
}: {
  taller: Taller;
  whatsappHref: string | null;
  mapaHref: string | null;
}) {
  const redes = REDES.filter((red) => taller[red.clave].trim());
  const conMapa = Boolean(taller.mapaUrl);

  return (
    <Seccion id="contacto" titulo="Dónde estamos">
      <div className={conMapa ? "grid gap-10 md:grid-cols-2 md:gap-14" : "flex flex-col gap-10"}>
        <div className="al-entrar flex flex-col gap-8">
          <dl className={conMapa ? "flex flex-col gap-5" : "grid gap-6 sm:grid-cols-3"}>
            {taller.direccion ? (
              <Dato Icono={MapPin} etiqueta="Dirección">
                {mapaHref ? (
                  <Enlace href={mapaHref} externo>
                    {taller.direccion}
                  </Enlace>
                ) : (
                  taller.direccion
                )}
              </Dato>
            ) : null}

            {taller.telefono ? (
              <Dato Icono={Phone} etiqueta="Teléfono">
                <Enlace href={`tel:${taller.telefono.replace(/\s/g, "")}`}>
                  <span className="tabular-nums">{taller.telefono}</span>
                </Enlace>
              </Dato>
            ) : null}

            {taller.email ? (
              <Dato Icono={EnvelopeSimple} etiqueta="Correo">
                <Enlace href={`mailto:${taller.email}`}>
                  <span className="break-all">{taller.email}</span>
                </Enlace>
              </Dato>
            ) : null}
          </dl>

          {taller.horarios.length > 0 ? (
            <div className="flex max-w-sm flex-col gap-2">
              <h3 className="font-display text-lg font-semibold uppercase tracking-wide">
                Horario
              </h3>
              <dl className="flex flex-col gap-1.5">
                {taller.horarios.map((horario) => (
                  <div
                    key={horario.etiqueta}
                    className="flex flex-wrap justify-between gap-x-6"
                  >
                    <dt className="text-tinta-suave">{horario.etiqueta}</dt>
                    <dd className="tabular-nums">{horario.horario}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            {whatsappHref ? (
              <Boton href={whatsappHref} externo>
                <WhatsappLogo size={20} weight="fill" />
                Escribir por WhatsApp
              </Boton>
            ) : null}

            {redes.map((red) => (
              <a
                key={red.clave}
                href={taller[red.clave]}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={red.etiqueta}
                className="rounded-lg border border-borde-fuerte p-3 text-tinta-suave transition duration-200 ease-salida hover:border-marca hover:text-marca active:translate-y-px"
              >
                <red.Icono size={22} />
              </a>
            ))}
          </div>
        </div>

        {taller.mapaUrl ? (
          <div className="al-entrar overflow-hidden rounded-2xl border border-borde bg-fondo-hondo">
            <iframe
              src={taller.mapaUrl}
              title={`Ubicación de ${taller.nombre}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="aspect-4/3 w-full"
            />
          </div>
        ) : null}
      </div>
    </Seccion>
  );
}

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
      className="underline decoration-borde-fuerte underline-offset-4 transition-colors duration-200 hover:decoration-marca"
    >
      {children}
    </a>
  );
}

function Dato({
  Icono,
  etiqueta,
  children,
}: {
  Icono: React.ComponentType<{ size?: number; weight?: "fill" | "duotone" }>;
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 shrink-0 text-marca">
        <Icono size={22} weight="duotone" />
      </span>
      <div>
        <dt className="text-sm text-tinta-tenue">{etiqueta}</dt>
        <dd className="text-lg">{children}</dd>
      </div>
    </div>
  );
}
