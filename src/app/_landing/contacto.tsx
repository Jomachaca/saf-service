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

import { Boton, Encabezado, Esquinas, Seccion, paso } from "./piezas";

const REDES = [
  { clave: "facebook", etiqueta: "Facebook", Icono: FacebookLogo },
  { clave: "instagram", etiqueta: "Instagram", Icono: InstagramLogo },
  { clave: "tiktok", etiqueta: "TikTok", Icono: TiktokLogo },
] as const;

/**
 * Datos de contacto y mapa, sobre el bloque marino.
 *
 * La sección cambia de forma según haya mapa o no: con mapa son dos columnas,
 * y sin mapa los datos se reparten a lo ancho en vez de dejar media pantalla
 * vacía. Eso último pasa solo si tampoco hay dirección cargada, porque el mapa
 * se arma con ella cuando nadie pegó un enlace (`mapaIncrustado`).
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
    <Seccion id="contacto" fondo="marino">
      <Encabezado numero="04" tema="Dónde estamos" titulo="Contacto" tono="claro" />

      <div className={conMapa ? "grid gap-12 lg:grid-cols-2" : "flex flex-col gap-12"}>
        <div className="al-entrar flex flex-col gap-8" style={paso(0)}>
          <dl className="m-0 flex flex-col border-t border-white/25">
            {taller.direccion ? (
              <Dato Icono={MapPin} etiqueta="Dirección">
                {mapaHref ? (
                  <a href={mapaHref} target="_blank" rel="noopener noreferrer" className="subrayado">
                    {taller.direccion}
                  </a>
                ) : (
                  taller.direccion
                )}
              </Dato>
            ) : null}

            {taller.telefono ? (
              <Dato Icono={Phone} etiqueta="Teléfono">
                <a href={`tel:${taller.telefono.replace(/\s/g, "")}`} className="subrayado">
                  <span className="tabular-nums">{taller.telefono}</span>
                </a>
              </Dato>
            ) : null}

            {taller.email ? (
              <Dato Icono={EnvelopeSimple} etiqueta="Correo">
                <a href={`mailto:${taller.email}`} className="subrayado">
                  <span className="break-all">{taller.email}</span>
                </a>
              </Dato>
            ) : null}
          </dl>

          {taller.horarios.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              <h3 className="font-display text-base font-bold tracking-[0.2em] text-white/55 uppercase">
                Horario
              </h3>
              <dl className="m-0 flex max-w-sm flex-col gap-1.5">
                {taller.horarios.map((horario) => (
                  <div key={horario.etiqueta} className="flex flex-wrap justify-between gap-x-6">
                    <dt className="text-white/70">{horario.etiqueta}</dt>
                    <dd className="m-0 tabular-nums">{horario.horario}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2.5">
            {whatsappHref ? (
              <Boton href={whatsappHref} externo llamativo>
                <WhatsappLogo size={19} />
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
                className="inline-flex border border-white/35 p-3.5 text-white transition duration-200 ease-salida hover:bg-white/12 active:translate-y-px"
              >
                <red.Icono size={20} />
              </a>
            ))}
          </div>
        </div>

        {taller.mapaUrl ? (
          <figure style={paso(1)} className="al-entrar plano m-0 border-white/40">
            <figcaption className="flex items-center justify-between gap-3 border-b border-white/30 px-4 py-3 font-display text-[13px] font-semibold tracking-[0.14em] uppercase">
              <span className="flex min-w-0 items-center gap-2.5">
                <MapPin size={15} className="shrink-0 text-vino-300" />
                <span className="truncate">{taller.nombre}</span>
              </span>

              {mapaHref ? (
                <a
                  href={mapaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="subrayado shrink-0 text-white"
                >
                  Cómo llegar
                </a>
              ) : null}
            </figcaption>

            <iframe
              src={taller.mapaUrl}
              title={`Ubicación de ${taller.nombre}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="aspect-4/3 w-full"
            />

            <Esquinas className="text-white" />
          </figure>
        ) : null}
      </div>
    </Seccion>
  );
}

function Dato({
  Icono,
  etiqueta,
  children,
}: {
  Icono: React.ComponentType<{ size?: number; className?: string }>;
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[1.875rem_minmax(0,1fr)] items-center gap-4 border-b border-white/25 py-4">
      <Icono size={22} className="text-vino-300" />
      <div>
        <dt className="font-display text-xs font-semibold tracking-[0.2em] text-white/55 uppercase">
          {etiqueta}
        </dt>
        <dd className="m-0 mt-0.5 text-lg text-white">{children}</dd>
      </div>
    </div>
  );
}
