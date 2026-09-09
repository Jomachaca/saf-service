import Image from "next/image";
import Link from "next/link";

/**
 * Piezas compartidas del landing.
 *
 * Todo lo que se repite entre secciones vive acá para que el sistema no se
 * disperse: un solo botón, un solo marco de foto, una sola escala de radios
 * (controles 8px, contenedores 16px, píldoras redondas).
 */

const BASE_BOTON =
  "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 " +
  "font-display text-base font-semibold uppercase tracking-wide whitespace-nowrap " +
  "transition duration-200 ease-salida active:translate-y-px";

const TONOS = {
  /** Acción principal. Granate del logo, el único color que se pulsa. */
  marca: "bg-marca text-sobre-marca hover:bg-marca-viva",
  /** Acción secundaria sobre fondo claro. */
  contorno: "border border-borde-fuerte text-tinta hover:border-marca hover:text-marca",
  /** Acción secundaria sobre el bloque marino. */
  claro: "border border-white/30 text-white hover:border-white hover:bg-white/10",
} as const;

export function Boton({
  href,
  tono = "marca",
  externo,
  children,
}: {
  href: string;
  tono?: keyof typeof TONOS;
  externo?: boolean;
  children: React.ReactNode;
}) {
  const clases = `${BASE_BOTON} ${TONOS[tono]}`;

  if (externo) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={clases}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={clases}>
      {children}
    </Link>
  );
}

export function Seccion({
  id,
  titulo,
  bajada,
  children,
}: {
  id?: string;
  titulo?: string;
  bajada?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-14 md:px-8 md:py-20"
    >
      {titulo ? (
        <div className="al-entrar mb-10 flex max-w-2xl flex-col gap-3">
          <h2 className="font-display text-3xl font-bold uppercase tracking-tight md:text-4xl">
            {titulo}
          </h2>
          {bajada ? <p className="text-lg text-tinta-suave">{bajada}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/**
 * El nombre en texto, con el corte del logo: la «S» granate y el resto marino,
 * en condensada cursiva. Se usa mientras no haya un archivo de logo subido, y
 * en sitios donde una imagen sería demasiado.
 */
export function Marca({
  tono = "oscuro",
  url,
  nombre = "SAF Service",
  alto = "h-9",
}: {
  tono?: "claro" | "oscuro";
  url?: string | null;
  nombre?: string;
  /**
   * Altura del archivo de logo. El del taller es un lockup apilado —nombre,
   * bajada y la banda de neumático— y por debajo de unos 50 px deja de leerse,
   * así que cada sitio le da la suya en vez de heredar una sola.
   */
  alto?: string;
}) {
  // Con logo subido manda el archivo; sin él, el nombre en la condensada
  // cursiva, que es lo más cerca del lettering del logo.
  if (url) {
    const imagen = (
      <Image
        src={url}
        alt={nombre}
        width={220}
        height={64}
        className={`${alto} w-auto object-contain`}
      />
    );

    // El logo del taller está dibujado para fondo claro: sobre el bloque
    // marino, el azul del propio logo se pierde contra el fondo. En vez de
    // pedirle otra versión al taller, se apoya sobre una placa clara, que es
    // como se resuelve esto en cualquier papelería.
    return tono === "claro" ? (
      <span className="inline-flex rounded-lg bg-marino-50 px-3 py-1.5">{imagen}</span>
    ) : (
      imagen
    );
  }

  // Sobre el bloque marino los colores son fijos; sobre el fondo de la página
  // van por token, porque ese fondo se invierte en modo oscuro y un granate del
  // logo sobre negro no se lee.
  const primero = tono === "claro" ? "text-vino-300" : "text-marca";
  const segundo = tono === "claro" ? "text-white" : "text-tinta";

  return (
    <span className="font-display text-2xl font-bold uppercase italic tracking-tight">
      <span className={primero}>SAF</span>
      <span className={segundo}> Service</span>
    </span>
  );
}

/**
 * Marco de foto con su estado vacío.
 *
 * Sin foto no se deja un hueco ni un icono de imagen rota: se pinta la trama de
 * neumático del logo con el nombre encima. La página de un taller que todavía
 * no subió fotos tiene que verse terminada igual.
 */
export function MarcoFoto({
  url,
  alt,
  proporcion = "aspect-4/3",
  prioridad,
  tamanos = "(min-width: 768px) 50vw, 100vw",
}: {
  url: string | null;
  alt: string;
  proporcion?: string;
  prioridad?: boolean;
  tamanos?: string;
}) {
  if (!url) {
    return (
      <div
        className={`${proporcion} trama-neumatico relative overflow-hidden rounded-2xl border border-borde bg-fondo-hondo`}
      >
        <div className="absolute inset-0 grid place-items-center bg-fondo/70 px-6 text-center">
          <Marca />
        </div>
      </div>
    );
  }

  return (
    <div className={`${proporcion} relative overflow-hidden rounded-2xl bg-fondo-hondo`}>
      <Image
        src={url}
        alt={alt}
        fill
        sizes={tamanos}
        priority={prioridad}
        className="object-cover"
      />
    </div>
  );
}
