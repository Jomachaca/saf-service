"use client";

import { WhatsappLogo, X } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useActionState, useState } from "react";

import {
  puedeRecibirse,
  transicionesReserva,
  type EstadoReserva,
} from "@/lib/reserva/estados";

import { cambiarEstadoReserva } from "../acciones-agenda";
import { Aviso, Dato, InsigniaReserva } from "../componentes";
import { SIN_ERROR } from "../estado-formulario";

import type { ReservaVista } from "./modelo";

const BOTON =
  "inline-flex items-center gap-2 border border-borde-fuerte px-3.5 py-2 font-display " +
  "text-xs font-semibold tracking-[0.12em] uppercase transition duration-200 ease-salida " +
  "hover:border-marca hover:text-marca active:translate-y-px disabled:opacity-50";

const BOTON_MARCA =
  "inline-flex items-center gap-2 border border-marca bg-marca px-3.5 py-2 font-display " +
  "text-xs font-bold tracking-[0.12em] text-white uppercase transition duration-200 " +
  "ease-salida hover:bg-marca-viva active:translate-y-px disabled:opacity-50";

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

/**
 * El detalle de una reserva, dentro de la lámina.
 *
 * Acá viven todas las acciones de la agenda, y en un solo lugar: la cuadrícula
 * solo muestra y abre. El padre monta este componente con una `key` que incluye
 * el estado, así que al cambiar se remonta limpio, sin la pregunta de
 * «¿seguro?» que había quedado abierta ni el error de un intento anterior.
 */
export function DetalleReserva({
  reserva,
  cerrar,
}: {
  reserva: ReservaVista;
  cerrar: () => void;
}) {
  const [resultado, accion, enviando] = useActionState(cambiarEstadoReserva, SIN_ERROR);
  const [pidiendo, setPidiendo] = useState<EstadoReserva | null>(null);

  // Los botones salen de la función pura, no de una lista escrita acá: si
  // cambian las reglas, cambian solos.
  const destinos = transicionesReserva(reserva.estado, { yaPaso: reserva.yaPaso });
  const abierta = puedeRecibirse(reserva.estado);

  return (
    <div className="flex max-h-[88dvh] flex-col">
      <header className="huella flex shrink-0 items-start justify-between gap-4 bg-marino-900 px-5 py-4 text-sobre-estructura sm:px-6">
        <div className="flex flex-col gap-1">
          <p className="flex items-center gap-2.5 font-display text-[11px] font-semibold tracking-[0.24em] text-vino-200 uppercase">
            <span aria-hidden className="h-px w-4 bg-vino-300" />
            Reserva
          </p>
          <p className="font-display text-[1.75rem] leading-none font-bold uppercase">
            {reserva.hora}
          </p>
          <p className="text-sm text-marino-200">{reserva.dia}</p>
        </div>

        <button
          type="button"
          onClick={cerrar}
          aria-label="Cerrar el detalle"
          className="-mt-1 -mr-2 p-2 text-marino-200 transition-colors duration-200 hover:bg-white/10 hover:text-white"
        >
          <X size={20} />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4.5 sm:px-6">
        <div className="flex flex-wrap items-center gap-2.5">
          <InsigniaReserva estado={reserva.estado} />
          {reserva.orden ? (
            <Link
              href={`/admin/orden/${reserva.orden.id}`}
              className="subrayado font-mono text-sm"
            >
              {reserva.orden.numero}
            </Link>
          ) : null}
        </div>

        <dl className="mt-4 grid gap-3.5 sm:grid-cols-2">
          <Dato etiqueta="Cliente">{reserva.nombre}</Dato>
          <Dato etiqueta="Teléfono">
            <span className="tabular-nums">{reserva.telefono}</span>
          </Dato>
          <Dato etiqueta="Vehículo">{reserva.vehiculo || reserva.tipo}</Dato>
          <Dato etiqueta="Placa">
            {reserva.placa ? (
              <span className="font-mono">{reserva.placa}</span>
            ) : (
              <span className="text-tinta-tenue">Sin placa</span>
            )}
          </Dato>
        </dl>

        {/* Aparte y no en una celda que ocupa dos columnas: `Dato` ya trae su
            propio contenedor, y meterlo en otro dejaría el <dl> con un div de
            más entre él y sus <dt>. */}
        <dl className="mt-3.5 flex flex-col gap-3.5">
          <Dato etiqueta="Motivo">{reserva.motivo}</Dato>
          <Dato etiqueta="Reservada el">
            <span className="text-sm text-tinta-suave">{reserva.reservadaEn}</span>
          </Dato>
        </dl>
      </div>

      <footer className="flex shrink-0 flex-col gap-3 border-t border-borde-fuerte px-5 py-4 sm:px-6">
        <form action={accion} className="flex flex-wrap items-center gap-2">
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
                className={BOTON_MARCA}
              >
                {enviando ? "Guardando…" : "Sí"}
              </button>
              <button type="button" onClick={() => setPidiendo(null)} className={BOTON}>
                No
              </button>
            </>
          ) : (
            <>
              {abierta ? (
                <Link href={`/admin/ingreso?reserva=${reserva.id}`} className={BOTON_MARCA}>
                  Recibir el vehículo
                </Link>
              ) : null}

              {reserva.whatsapp ? (
                <a
                  href={reserva.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={BOTON}
                >
                  <WhatsappLogo size={16} />
                  Escribirle
                </a>
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

              {!abierta && destinos.length === 0 ? (
                <p className="text-sm text-tinta-tenue">
                  La reserva ya está cerrada: no admite más cambios.
                </p>
              ) : null}
            </>
          )}
        </form>

        {resultado.error ? <Aviso>{resultado.error}</Aviso> : null}
      </footer>
    </div>
  );
}
