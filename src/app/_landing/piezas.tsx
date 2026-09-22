import Image from "next/image";
import Link from "next/link";

import { Esquinas } from "../plano";

/**
 * Piezas compartidas del landing.
 *
 * El lenguaje es de plano técnico: cantos vivos, filetes de un pixel y marcas
 * de registro «+» en las esquinas de todo lo que es un objeto (tarjetas,
 * figuras y el botón primario). Nada de cajas redondeadas con relleno suave.
 * Las clases `plano`, `esquina`, `reglilla`, `duotono` y `llama` viven en
 * `globals.css`.
 */

const BASE_BOTON =
  "relative inline-flex items-center justify-center gap-2.5 border " +
  "font-display font-semibold tracking-[0.09em] whitespace-nowrap uppercase " +
  "transition duration-200 ease-salida active:translate-y-px";

const TONOS = {
  /** Acción principal. Granate del logo, el único objeto con relleno. */
  marca: "border-marca bg-marca text-white hover:bg-marca-viva",
  /** Acción secundaria sobre papel. */
  linea: "border-borde-fuerte text-tinta hover:bg-tinta/6",
  /** Acción secundaria sobre el bloque marino. */
  clara: "border-white/40 text-white hover:bg-white/12",
} as const;

const TAMANOS = {
  normal: "px-6 py-3.5 text-[17px]",
  chico: "px-4 py-2.5 text-sm",
} as const;

export function Boton({
  href,
  tono = "marca",
  tamano = "normal",
  externo,
  /**
   * Cada ocho segundos el ícono se sacude y el botón suelta un anillo. Va solo
   * en WhatsApp y en «Reservar hora». Con "b" el ciclo entra desfasado, para
   * que dos botones de la misma barra nunca se muevan a la vez: dos cosas
   * moviéndose juntas no llaman el doble de atención, se anulan.
   */
  llamativo,
  children,
}: {
  href: string;
  tono?: keyof typeof TONOS;
  tamano?: keyof typeof TAMANOS;
  externo?: boolean;
  llamativo?: boolean | "b";
  children: React.ReactNode;
}) {
  const llamada = llamativo ? (llamativo === "b" ? " llama llama-b" : " llama") : "";
  const clases = `${BASE_BOTON} ${TONOS[tono]} ${TAMANOS[tamano]}${llamada}`;

  // El primario es el único objeto sólido del tablero, así que lleva las
  // marcas de registro como cualquier otra pieza enmarcada.
  const marcas =
    tono === "marca" ? <Esquinas className="text-vino-300" /> : null;

  if (externo) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={clases}>
        {children}
        {marcas}
      </a>
    );
  }

  return (
    <Link href={href} className={clases}>
      {children}
      {marcas}
    </Link>
  );
}

/** Reexportada para que las secciones del landing la tomen de un solo sitio. */
export { Esquinas };

export function Seccion({
  id,
  fondo,
  children,
}: {
  id?: string;
  /** Papel por omisión; "hondo" es la franja gris y "marino" el bloque oscuro. */
  fondo?: "hondo" | "marino";
  children: React.ReactNode;
}) {
  if (fondo === "marino") {
    return (
      <section
        id={id}
        className="relative scroll-mt-20 overflow-hidden bg-estructura text-white"
      >
        <div aria-hidden className="huella pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative mx-auto w-full max-w-7xl px-5 py-20 md:px-7 md:py-24">
          {children}
        </div>
      </section>
    );
  }

  if (fondo === "hondo") {
    return (
      <section
        id={id}
        className="scroll-mt-20 border-y border-borde bg-fondo-hondo"
      >
        <div className="mx-auto w-full max-w-7xl px-5 py-20 md:px-7 md:py-24">{children}</div>
      </section>
    );
  }

  return (
    <section
      id={id}
      className="mx-auto w-full max-w-7xl scroll-mt-20 px-5 py-20 md:px-7 md:py-24"
    >
      {children}
    </section>
  );
}

/**
 * El encabezado de una sección: el número y el tema en versalitas, el título
 * en condensada y, opcionalmente, la bajada y la reglilla que ocupa el resto
 * del ancho.
 */
export function Encabezado({
  numero,
  tema,
  titulo,
  bajada,
  conReglilla,
  tono = "oscuro",
}: {
  numero?: string;
  tema?: string;
  titulo: string;
  bajada?: string;
  conReglilla?: boolean;
  tono?: "claro" | "oscuro";
}) {
  const acento = tono === "claro" ? "text-vino-300" : "text-marca";
  const cuerpo = tono === "claro" ? "text-white/70" : "text-tinta-suave";

  return (
    <div
      className={`al-entrar mb-10 flex flex-wrap items-end justify-between gap-x-10 gap-y-6 ${
        conReglilla ? "" : "mb-9"
      }`}
    >
      <div className="max-w-2xl">
        {numero && tema ? (
          <p
            className={`mb-3.5 flex items-center gap-3.5 font-display text-xs font-semibold tracking-[0.24em] uppercase ${acento}`}
          >
            <span aria-hidden className="h-px w-6 bg-current" />
            {numero} · {tema}
          </p>
        ) : null}

        <h2 className="font-display text-[clamp(2.125rem,4vw,3.25rem)] leading-none font-bold uppercase">
          {titulo}
        </h2>

        {bajada ? <p className={`mt-3 text-lg ${cuerpo}`}>{bajada}</p> : null}
      </div>

      {conReglilla ? (
        <div aria-hidden className="reglilla min-w-36 flex-1 text-tinta" />
      ) : null}
    </div>
  );
}

/**
 * El logo del taller.
 *
 * Sin archivo cargado en el panel manda el del proyecto, que viene en dos
 * versiones: la de tinta para el papel y la blanca para los bloques marinos.
 * Con archivo cargado manda el del taller, y sobre marino se apoya en una
 * placa clara, porque el logo está dibujado para fondo claro.
 */
export function Marca({
  tono = "oscuro",
  url,
  nombre = "SAF Service",
  alto = "h-13",
  prioridad,
}: {
  tono?: "claro" | "oscuro";
  url?: string | null;
  nombre?: string;
  alto?: string;
  prioridad?: boolean;
}) {
  const propio = tono === "claro" ? "/marca/saf-logo-blanco.webp" : "/marca/saf-logo.webp";

  const imagen = (
    <Image
      src={url || propio}
      alt={nombre}
      width={624}
      height={354}
      priority={prioridad}
      className={`${alto} w-auto object-contain`}
    />
  );

  if (url && tono === "claro") {
    return <span className="inline-flex bg-marino-50 px-3 py-1.5">{imagen}</span>;
  }

  return imagen;
}

/**
 * Marco de foto: figura cuadrada, filete, marcas de registro y la foto teñida
 * de acero. Sin foto no se deja un hueco: se pinta el marco vacío con el
 * nombre, para que la página de un taller que todavía no subió nada se vea
 * terminada igual.
 */
export function MarcoFoto({
  url,
  alt,
  proporcion = "aspect-4/3",
  prioridad,
  tamanos = "(min-width: 768px) 50vw, 100vw",
  tono = "oscuro",
  paso: retraso,
}: {
  url: string | null;
  alt: string;
  proporcion?: string;
  prioridad?: boolean;
  tamanos?: string;
  tono?: "claro" | "oscuro";
  paso?: number;
}) {
  const filete = tono === "claro" ? "border-white/40" : "border-borde";
  const marcas = tono === "claro" ? "text-white" : undefined;

  return (
    <figure
      style={retraso === undefined ? undefined : paso(retraso)}
      className={`al-entrar plano duotono relative m-0 overflow-hidden ${proporcion} ${filete}`}
    >
      {url ? (
        <Image
          src={url}
          alt={alt}
          fill
          sizes={tamanos}
          priority={prioridad}
          className="object-cover"
        />
      ) : (
        <div
          className={`huella grid h-full place-items-center ${
            tono === "claro" ? "bg-marino-700" : "bg-marino-800"
          }`}
        >
          <span className="font-display text-sm font-semibold tracking-[0.24em] text-marino-200 uppercase">
            {alt}
          </span>
        </div>
      )}
      <Esquinas className={marcas} />
    </figure>
  );
}

/**
 * El turno de aparición de un elemento dentro de una lista.
 *
 * `.al-entrar` lo lee como `--paso` y corre su rango de scroll: el segundo
 * ítem termina de aparecer un poco después que el primero. Con una línea de
 * tiempo de scroll no sirve `animation-delay`, porque el tiempo lo pone el
 * dedo de quien mira y no el reloj.
 */
export function paso(indice: number): React.CSSProperties {
  return { "--paso": indice } as React.CSSProperties;
}
