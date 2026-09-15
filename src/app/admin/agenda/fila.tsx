"use client";

import { WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useActionState, useState } from "react";

import {
  puedeRecibirse,
  transicionesReserva,
  type EstadoReserva,
} from "@/lib/reserva/estados";

import { cambiarEstadoReserva } from "../acciones-agenda";
import { Aviso, InsigniaReserva } from "../componentes";
import { SIN_ERROR } from "../estado-formulario";

/** Una reserva con su texto ya armado en el servidor (ver `page.tsx`). */
export type ReservaEnFila = {
  id: string;
  estado: EstadoReserva;
  hora: string;
  /** Solo en «Sin cerrar», donde las filas son de días distintos. */
  dia: string | null;
  nombre: string;
  telefono: string;
  placa: string | null;
  vehiculo: string;
  tipo: string;
  motivo: string;
  whatsapp: string | null;
  yaPaso: boolean;
  orden: { id: string; numero: string } | null;
};

/**
 * Cada fila es su propia grilla, así que las columnas solo se alinean entre
 * filas si tienen ancho fijo. La de acciones lo tiene: si dependiera de cuántos
 * botones hay, una fila cancelada correría el vehículo hacia la derecha.
 */
const COLUMNAS =
  "lg:grid lg:grid-cols-[6.5rem_minmax(0,1fr)_minmax(0,11rem)_20rem] lg:items-center lg:gap-4";

const BOTON =
  "rounded-lg border border-borde-fuerte px-3 py-1.5 text-sm font-medium transition-colors " +
  "duration-200 hover:border-marca hover:text-marca disabled:opacity-50";

const ETIQUETA_BOTON: Partial<Record<EstadoReserva, string>> = {
  CONFIRMADA: "Confirmar",
  NO_ASISTIO: "No asistió",
  CANCELADA: "Cancelar",
};

/**
 * Estos dos no tienen vuelta atrás (ver `estados.ts`), así que piden un segundo
 * clic. Confirmar no: se puede confirmar y después cancelar.
 */
const PREGUNTA: Partial<Record<EstadoReserva, string>> = {
  NO_ASISTIO: "¿Marcar que no asistió?",
  CANCELADA: "¿Cancelar la reserva?",
};

export function FilaReserva({ reserva }: { reserva: ReservaEnFila }) {
  const [resultado, accion, enviando] = useActionState(cambiarEstadoReserva, SIN_ERROR);
  const [pidiendo, setPidiendo] = useState<EstadoReserva | null>(null);

  // Los botones salen de la función pura, no de una lista escrita acá: si
  // cambian las reglas, cambian solos.
  const destinos = transicionesReserva(reserva.estado, { yaPaso: reserva.yaPaso });
  const abierta = puedeRecibirse(reserva.estado);

  return (
    <li className={`flex flex-col gap-3 px-4 py-3.5 ${COLUMNAS} ${abierta ? "" : "text-tinta-suave"}`}>
      <div className="flex items-baseline gap-2 lg:flex-col lg:gap-1">
        <span className="font-display text-lg leading-none font-semibold tabular-nums">
          {reserva.hora}
        </span>
        {reserva.dia ? <span className="text-xs text-tinta-tenue">{reserva.dia}</span> : null}
      </div>

      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={`font-medium ${reserva.estado === "CANCELADA" ? "line-through" : ""}`}>
            {reserva.nombre}
          </span>
          <span className="text-sm tabular-nums text-tinta-tenue">{reserva.telefono}</span>
          <InsigniaReserva estado={reserva.estado} />
          {reserva.orden ? (
            <Link
              href={`/admin/orden/${reserva.orden.id}`}
              className="font-mono text-sm underline-offset-4 hover:underline"
            >
              {reserva.orden.numero}
            </Link>
          ) : null}
        </p>
        <p className="truncate text-sm text-tinta-suave" title={reserva.motivo}>
          {reserva.motivo}
        </p>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
        {reserva.placa ? <span className="font-mono font-medium">{reserva.placa}</span> : null}
        <span className="text-tinta-suave">{reserva.vehiculo || reserva.tipo}</span>
        {reserva.vehiculo ? <span className="text-xs text-tinta-tenue">{reserva.tipo}</span> : null}
      </div>

      <form action={accion} className="flex flex-wrap items-center gap-2 lg:justify-end">
        <input type="hidden" name="id" value={reserva.id} />
        <input type="hidden" name="estado_actual" value={reserva.estado} />

        {pidiendo ? (
          <>
            <span className="text-sm">{PREGUNTA[pidiendo]}</span>
            <button
              type="submit"
              name="estado_nuevo"
              value={pidiendo}
              disabled={enviando}
              className="rounded-lg bg-marca px-3 py-1.5 text-sm font-medium text-sobre-marca transition-colors duration-200 hover:bg-marca-viva disabled:opacity-50"
            >
              {enviando ? "Guardando…" : "Sí"}
            </button>
            <button type="button" onClick={() => setPidiendo(null)} className={BOTON}>
              No
            </button>
          </>
        ) : (
          <>
            {reserva.whatsapp ? (
              <a
                href={reserva.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Escribir por WhatsApp a ${reserva.nombre}`}
                title="Escribir por WhatsApp"
                className="rounded-lg border border-borde-fuerte p-1.5 text-tinta-suave transition-colors duration-200 hover:border-marca hover:text-marca"
              >
                <WhatsappLogo size={18} />
              </a>
            ) : null}

            {abierta ? (
              <Link
                href={`/admin/ingreso?reserva=${reserva.id}`}
                className="rounded-lg bg-marca px-3 py-1.5 text-sm font-medium text-sobre-marca transition-colors duration-200 hover:bg-marca-viva"
              >
                Recibir
              </Link>
            ) : null}

            {destinos.map((destino) =>
              PREGUNTA[destino] ? (
                <button
                  key={destino}
                  type="button"
                  onClick={() => setPidiendo(destino)}
                  className={BOTON}
                >
                  {ETIQUETA_BOTON[destino]}
                </button>
              ) : (
                <button
                  key={destino}
                  type="submit"
                  name="estado_nuevo"
                  value={destino}
                  disabled={enviando}
                  className={BOTON}
                >
                  {enviando ? "Guardando…" : ETIQUETA_BOTON[destino]}
                </button>
              ),
            )}
          </>
        )}
      </form>

      {resultado.error ? (
        <div className="lg:col-span-4">
          <Aviso>{resultado.error}</Aviso>
        </div>
      ) : null}
    </li>
  );
}
