import Image from "next/image";
import Link from "next/link";

import { Esquinas } from "../plano";

import { ETIQUETA_ESTADO, type Estado } from "@/lib/orden/estados";
import type { EspacioConCupo } from "@/lib/orden/espacio";
import { nombrarLugar, type Ubicacion } from "@/lib/orden/ubicacion";
import { ETIQUETA_ESTADO_RESERVA, type EstadoReserva } from "@/lib/reserva/estados";

const BASE_INSIGNIA =
  "inline-flex shrink-0 border px-2.5 py-0.5 font-display text-[11px] " +
  "font-semibold tracking-[0.14em] uppercase";

/**
 * Una sola escala para los cinco estados, del acero claro al granate, en el
 * mismo orden en que avanza la orden: así una columna de insignias se lee de
 * un vistazo y no como cinco colores sueltos (decisión 33). El granate lleno
 * es «En trabajo», que es lo único que está pasando ahora mismo.
 *
 * Se escriben completas y no armadas por concatenación: Tailwind no ve las
 * clases construidas en tiempo de ejecución.
 */
const CLASES_ESTADO: Record<Estado, string> = {
  RECIBIDO: "border-marino-400/40 bg-marino-50 text-marino-700",
  DIAGNOSTICO: "border-marino-400/50 bg-marino-100 text-marino-700",
  ESPERANDO_APROBACION: "border-vino-500/40 bg-vino-50 text-vino-600",
  EN_TRABAJO: "border-marca bg-marca text-white",
  LISTO: "border-borde-fuerte text-tinta-tenue",
};

/**
 * El color macizo de cada estado, la misma escala de la insignia pero en
 * relleno. Lo usan la barra de proporción del tablero, el punto de su leyenda
 * y el filete que abre cada fila de órdenes: son tres lecturas del mismo dato,
 * y si no comparten color no se reconocen como lo mismo.
 */
export const COLOR_ESTADO: Record<Estado, string> = {
  RECIBIDO: "bg-marino-200",
  DIAGNOSTICO: "bg-marino-300",
  ESPERANDO_APROBACION: "bg-vino-300",
  EN_TRABAJO: "bg-marca",
  LISTO: "bg-marino-400",
};

/** La tinta que se lee encima de ese relleno. */
export const SOBRE_COLOR_ESTADO: Record<Estado, string> = {
  RECIBIDO: "text-marino-800",
  DIAGNOSTICO: "text-marino-800",
  ESPERANDO_APROBACION: "text-marino-800",
  EN_TRABAJO: "text-white",
  LISTO: "text-white",
};

export function Insignia({ estado }: { estado: Estado }) {
  return (
    <span className={`${BASE_INSIGNIA} ${CLASES_ESTADO[estado]}`}>
      {ETIQUETA_ESTADO[estado]}
    </span>
  );
}

export function Ubicada({
  ubicacion,
  espacio,
}: {
  ubicacion: Ubicacion;
  espacio?: string | null;
}) {
  return (
    <span className="font-mono text-xs tracking-[0.1em] text-tinta-tenue uppercase">
      {nombrarLugar(ubicacion, espacio ?? null)}
    </span>
  );
}

/**
 * Elegir dónde queda el vehículo dentro del taller.
 *
 * «Sin espacio asignado» es una opción de verdad y va primero: el auto que está
 * en el local pero en ningún sitio concreto es el caso más común de todos, y es
 * lo que había que elegir a mano cuando esto se llamaba «patio» (decisión 35).
 *
 * Va controlado porque React resetea el formulario antes de cada acción: sin
 * `value`, un error de la acción devolvería el desplegable a su valor inicial y
 * quien recibe el auto tendría que volver a elegir.
 */
export function SelectorEspacio({
  espacios,
  valor,
  alCambiar,
  actual = null,
  className = "",
}: {
  espacios: EspacioConCupo[];
  valor: string;
  alCambiar: (valor: string) => void;
  /** El espacio donde la orden ya está: no se ofrece como lleno. */
  actual?: string | null;
  className?: string;
}) {
  return (
    <select
      name="espacio_id"
      value={valor}
      onChange={(evento) => alCambiar(evento.target.value)}
      aria-label="Espacio del taller"
      className={`w-full border border-borde bg-fondo-alto px-3 py-2 ${className}`}
    >
      <option value="">Sin espacio asignado</option>
      {espacios.map((espacio) => {
        const lleno = espacio.ocupados >= espacio.capacidad && espacio.id !== actual;

        return (
          <option key={espacio.id} value={espacio.id} disabled={lleno}>
            {espacio.nombre} · {espacio.ocupados}/{espacio.capacidad}
            {lleno ? " · lleno" : ""}
          </option>
        );
      })}
    </select>
  );
}

/**
 * Un bloque dentro de una pantalla: título en condensada, el conteo en
 * monoespaciada justo al lado —«1 libre», «6 de 6»— y un filete debajo. El
 * conteo va pegado al título y no en la otra punta porque dice de qué tamaño
 * es lo que sigue, y eso se lee con el título, no aparte.
 */
export function Seccion({
  titulo,
  numero,
  conteo,
  accion,
  children,
}: {
  titulo: string;
  /** El paso, cuando la pantalla es una secuencia: «01», «02». */
  numero?: string;
  conteo?: string;
  accion?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-borde-fuerte pb-2.5">
        <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
          {numero ? (
            <span className="font-mono text-[13px] tracking-[0.16em] text-marca">{numero}</span>
          ) : null}
          <h2 className="font-display text-xl font-bold tracking-[0.06em] uppercase">
            {titulo}
          </h2>
          {conteo ? <span className="font-mono text-xs text-tinta-tenue">{conteo}</span> : null}
        </div>
        {accion}
      </div>
      {children}
    </section>
  );
}

export function EnlaceOrden({
  id,
  numero,
  children,
}: {
  id: string;
  numero: string;
  children?: React.ReactNode;
}) {
  return (
    <Link href={`/admin/orden/${id}`} className="subrayado" title={numero}>
      {children ?? numero}
    </Link>
  );
}

export function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="border-l-2 border-marca pl-3 text-sm text-marca">
      {children}
    </p>
  );
}

/**
 * La insignia de la agenda. Una reserva no es una orden (decisión 1), así que
 * tiene su propia lectura: granate lo que falta confirmar, acero lo confirmado
 * y acero lleno lo que ya se convirtió en orden.
 */
const CLASES_ESTADO_RESERVA: Record<EstadoReserva, string> = {
  PENDIENTE: "border-vino-500/40 bg-vino-50 text-vino-600",
  CONFIRMADA: "border-marino-400/40 bg-marino-50 text-marino-700",
  CONVERTIDA: "border-marino-700 bg-marino-700 text-white",
  NO_ASISTIO: "border-marca text-marca",
  CANCELADA: "border-borde-fuerte text-tinta-tenue",
};

export function InsigniaReserva({ estado }: { estado: EstadoReserva }) {
  return (
    <span className={`${BASE_INSIGNIA} ${CLASES_ESTADO_RESERVA[estado]}`}>
      {ETIQUETA_ESTADO_RESERVA[estado]}
    </span>
  );
}

/**
 * La misma lectura de la insignia, en la cita de la cuadrícula de la agenda.
 * Ahí el color no acompaña a un texto que ya dice el estado: es lo único que lo
 * dice, así que el relleno pesa más y el filete de la izquierda lo remarca.
 */
export const CITA_ESTADO_RESERVA: Record<EstadoReserva, string> = {
  PENDIENTE: "border-vino-300 bg-vino-50 text-vino-700 hover:border-marca",
  CONFIRMADA: "border-marino-300 bg-marino-50 text-marino-800 hover:border-marino-500",
  CONVERTIDA: "border-marino-700 bg-marino-700 text-white hover:border-marino-900",
  NO_ASISTIO: "border-borde-fuerte bg-fondo-hondo text-marca hover:border-marca",
  CANCELADA: "border-borde bg-fondo-hondo text-tinta-tenue hover:border-borde-fuerte",
};

/** El filete macizo que abre cada cita, en la escala de arriba. */
export const FILETE_ESTADO_RESERVA: Record<EstadoReserva, string> = {
  PENDIENTE: "bg-marca",
  CONFIRMADA: "bg-marino-400",
  CONVERTIDA: "bg-white/60",
  NO_ASISTIO: "bg-marca/50",
  CANCELADA: "bg-borde-fuerte",
};

/** El logo en blanco al pie de la barra lateral. Lleva al tablero. */
export function MarcaPanel() {
  return (
    <Link href="/admin" className="leading-none">
      <Image
        src="/marca/saf-palabra-blanco.webp"
        alt="SAF Service"
        width={520}
        height={168}
        priority
        className="h-9 w-auto object-contain"
      />
    </Link>
  );
}

/**
 * La cabecera de cada pantalla: dónde estoy en versalitas, el título en
 * condensada y un filete que lo separa del contenido. `seccion` nombra la
 * entrada de la barra lateral cuando la pantalla es una de sus partes, como
 * las tres de «Sitio web».
 */
export function Encabezado({
  titulo,
  seccion,
  descripcion,
  acciones,
}: {
  titulo: string;
  seccion?: string;
  descripcion?: React.ReactNode;
  acciones?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-borde-fuerte pb-4">
      <div className="flex max-w-2xl flex-col gap-2">
        {seccion ? (
          <p className="flex items-center gap-3 font-display text-[11px] font-semibold tracking-[0.24em] text-marca uppercase">
            <span aria-hidden className="h-px w-5 bg-marca" />
            {seccion}
          </p>
        ) : null}

        <h1 className="font-display text-[2.6rem] leading-none font-bold uppercase">
          {titulo}
        </h1>

        {descripcion ? <p className="text-tinta-suave">{descripcion}</p> : null}
      </div>

      {acciones ? <div className="flex flex-wrap items-center gap-2">{acciones}</div> : null}
    </div>
  );
}

/**
 * Una ficha de plano: marco, marcas de registro en las esquinas y un título.
 * Es el objeto del panel, el mismo que en el sitio público envuelve una
 * tarjeta de servicio (decisión 33). Se usa para lo que es una cosa —el
 * diagnóstico, el presupuesto—, no para lo que es una lista.
 */
export function Ficha({
  titulo,
  accion,
  children,
}: {
  titulo: string;
  accion?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="plano flex flex-col gap-3.5 bg-fondo-alto p-5 md:p-5.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="font-display text-lg font-bold tracking-[0.1em] uppercase">
          {titulo}
        </h2>
        {accion}
      </div>

      {children}
      <Esquinas />
    </section>
  );
}

/**
 * La misma ficha, con el título más chico y apagado. Va en la columna
 * lateral, donde el título rotula un dato y no encabeza una sección.
 */
export function FichaLateral({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="plano flex flex-col gap-2.5 bg-fondo-alto p-5">
      <h2 className="font-display text-[13px] font-bold tracking-[0.2em] text-tinta-tenue uppercase">
        {titulo}
      </h2>

      {children}
      <Esquinas />
    </section>
  );
}

/** Un rótulo suelto, sin marco ni filete: encabeza algo que ya se ve solo. */
export function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-lg font-bold tracking-[0.14em] text-tinta-tenue uppercase">
      {children}
    </h2>
  );
}

/** Una fila de dato en la columna lateral: etiqueta arriba, valor debajo. */
export function Dato({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs tracking-[0.12em] text-tinta-tenue uppercase">{etiqueta}</dt>
      <dd className="m-0 text-base">{children}</dd>
    </div>
  );
}
