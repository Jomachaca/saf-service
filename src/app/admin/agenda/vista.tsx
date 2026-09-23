"use client";

import { Fragment, useEffect, useRef, useState } from "react";

import { Esquinas } from "../../plano";
import {
  CITA_ESTADO_RESERVA,
  FILETE_ESTADO_RESERVA,
  InsigniaReserva,
  Seccion,
} from "../componentes";

import { DetalleReserva } from "./detalle";
import type { DiaVista, ReservaVista } from "./modelo";

/**
 * La agenda como calendario: los días en columnas, las horas del taller en
 * filas y cada reserva en su casilla.
 *
 * Tres lecturas de la misma reserva, cada vez con más detalle: la cita en la
 * casilla dice hora y nombre; al pasar el mouse por encima se asoma una ficha
 * con lo justo para decidir; y de ahí se abre la lámina, donde está todo y
 * viven las acciones. Nada actúa desde la cuadrícula: así no hay un botón de
 * «cancelar» al alcance de un clic distraído sobre una casilla de 90 px.
 *
 * El corte es `@2xl` y no un `lg:`: se mide la columna del panel, no la
 * pantalla, porque la barra lateral se queda con parte del ancho. Donde no
 * entran siete columnas, los mismos días se apilan en listas y la cita se abre
 * tocándola, que es lo que hace un dedo.
 */
export function VistaAgenda({
  dias,
  horas,
  sinCerrar,
}: {
  dias: DiaVista[];
  horas: string[];
  sinCerrar: ReservaVista[];
}) {
  const [abierta, setAbierta] = useState<string | null>(null);
  const lamina = useRef<HTMLDialogElement>(null);

  const indice = new Map<string, ReservaVista>();
  for (const dia of dias) for (const reserva of dia.reservas) indice.set(reserva.id, reserva);
  for (const reserva of sinCerrar) indice.set(reserva.id, reserva);

  // Se guarda el id y no la reserva: después de un cambio de estado la página
  // se revalida y llega otra copia, y lo que tiene que mostrarse es la nueva.
  const reserva = abierta ? (indice.get(abierta) ?? null) : null;

  useEffect(() => {
    const dialogo = lamina.current;
    if (!dialogo) return;

    if (reserva && !dialogo.open) dialogo.showModal();
    if (!reserva && dialogo.open) dialogo.close();
  }, [reserva]);

  const cerrar = () => lamina.current?.close();

  // Apilados, siete días con «Sin reservas» son una pared: van los que tienen
  // algo y hoy, que es la pregunta con la que se abre la agenda.
  const conAlgo = dias.filter((dia) => dia.reservas.length > 0 || dia.esHoy);

  return (
    <div className="flex flex-col gap-8">
      {sinCerrar.length > 0 ? (
        <Seccion titulo="Sin cerrar" conteo={`${sinCerrar.length}`}>
          <p className="text-sm text-tinta-suave">
            Reservas de días pasados que nadie marcó. Ciérralas para que la agenda diga lo que
            pasó.
          </p>
          <ul className="flex flex-col divide-y divide-borde border border-borde bg-fondo-alto">
            {sinCerrar.map((reserva) => (
              <FilaCita
                key={reserva.id}
                reserva={reserva}
                conDia
                abrir={() => setAbierta(reserva.id)}
              />
            ))}
          </ul>
        </Seccion>
      ) : null}

      {horas.length === 0 ? (
        <p className="border border-dashed border-borde-fuerte px-4 py-6 text-center text-sm text-tinta-suave">
          Sin horario cargado no hay cuadrícula que dibujar: son las horas del horario las que
          arman las filas.
        </p>
      ) : (
        <>
          <div className="plano hidden bg-fondo-alto @2xl:block">
            <div
              className="grid"
              style={{ gridTemplateColumns: `3.5rem repeat(${dias.length}, minmax(0, 1fr))` }}
            >
              <div className="border-b border-borde-fuerte" />

              {dias.map((dia) => (
                <div
                  key={dia.fecha}
                  className={`flex flex-col items-center gap-0.5 border-b border-l border-borde-fuerte px-1 py-2.5 ${
                    dia.esHoy ? "bg-vino-50" : ""
                  }`}
                >
                  <span
                    className={`font-display text-[10px] font-semibold tracking-[0.18em] uppercase ${
                      dia.esHoy ? "text-marca" : "text-tinta-tenue"
                    }`}
                  >
                    {dia.semana}
                  </span>
                  <span
                    className={`font-display text-xl leading-none font-bold tabular-nums ${
                      dia.esHoy ? "text-marca" : dia.pasado ? "text-tinta-tenue" : ""
                    }`}
                  >
                    {dia.numero}
                  </span>
                  {dia.cerrado !== null ? (
                    <span
                      title={dia.cerrado || undefined}
                      className="font-display text-[9px] font-semibold tracking-[0.14em] text-tinta-tenue uppercase"
                    >
                      Cerrado
                    </span>
                  ) : null}
                </div>
              ))}

              {horas.map((hora) => (
                <Fragment key={hora}>
                  <div className="border-t border-borde px-1 py-2 text-center font-mono text-[11px] leading-none tracking-[0.06em] text-tinta-tenue">
                    {hora}
                  </div>

                  {dias.map((dia, columna) => (
                    <Casilla
                      key={dia.fecha}
                      dia={dia}
                      hora={hora}
                      // Las dos últimas columnas abren la ficha hacia adentro:
                      // pegada al borde derecho se saldría del panel.
                      alDerecha={columna >= dias.length - 2}
                      abrir={setAbierta}
                    />
                  ))}
                </Fragment>
              ))}
            </div>

            <Esquinas />
          </div>

          <div className="flex flex-col gap-6 @2xl:hidden">
            {conAlgo.map((dia) => (
              <section key={dia.fecha} className="flex flex-col gap-2.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 border-b border-borde-fuerte pb-2">
                  <h3
                    className={`font-display text-base font-bold tracking-[0.08em] uppercase ${
                      dia.esHoy ? "text-marca" : ""
                    }`}
                  >
                    {dia.relativo ? `${dia.relativo} · ${dia.largo}` : dia.largo}
                  </h3>
                  <span className="font-mono text-xs text-tinta-tenue">
                    {dia.cerrado !== null
                      ? "Cerrado"
                      : dia.reservas.length === 1
                        ? "1 reserva"
                        : `${dia.reservas.length} reservas`}
                  </span>
                </div>

                {dia.reservas.length === 0 ? (
                  <p className="text-sm text-tinta-tenue">Sin reservas.</p>
                ) : (
                  <ul className="flex flex-col divide-y divide-borde border border-borde bg-fondo-alto">
                    {dia.reservas.map((reserva) => (
                      <FilaCita
                        key={reserva.id}
                        reserva={reserva}
                        abrir={() => setAbierta(reserva.id)}
                      />
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </>
      )}

      <dialog
        ref={lamina}
        aria-label="Detalle de la reserva"
        onClose={() => setAbierta(null)}
        onClick={(evento) => {
          // El fondo oscuro es del propio <dialog>: un clic ahí llega con el
          // dialog como destino, y no con el contenido.
          if (evento.target === evento.currentTarget) evento.currentTarget.close();
        }}
        className="lamina m-auto w-[min(36rem,94vw)] max-w-none border-0 bg-fondo-alto p-0 text-tinta backdrop:bg-marino-900/55"
      >
        {reserva ? (
          <DetalleReserva
            key={`${reserva.id}-${reserva.estado}`}
            reserva={reserva}
            cerrar={cerrar}
          />
        ) : null}
      </dialog>
    </div>
  );
}

/** Una casilla de la cuadrícula: un día a una hora. */
function Casilla({
  dia,
  hora,
  alDerecha,
  abrir,
}: {
  dia: DiaVista;
  hora: string;
  alDerecha: boolean;
  abrir: (id: string) => void;
}) {
  const citas = dia.reservas.filter((reserva) => reserva.clave === hora);

  // Fuera del horario no es lo mismo que libre, y el rayado lo dice: ahí no
  // hay cupo que ofrecer, no es que nadie lo haya tomado.
  const cerrado = dia.cerrado !== null;
  const fuera = !cerrado && !dia.abiertas.includes(hora);

  return (
    <div
      className={`min-h-13 border-t border-l border-borde p-1 ${
        cerrado || fuera ? "tramado" : ""
      } ${dia.esHoy ? "bg-vino-50/45" : ""}`}
    >
      {citas.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {citas.map((reserva) => (
            <Cita key={reserva.id} reserva={reserva} alDerecha={alDerecha} abrir={abrir} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * La cita y su ficha.
 *
 * La ficha no está escondida con `display`, sino apagada: así entra y sale con
 * una transición. Mientras está apagada no recibe el mouse —si no, taparía las
 * citas de abajo—, y se enciende también con `focus-within`, que es como llega
 * quien se mueve con el teclado.
 */
function Cita({
  reserva,
  alDerecha,
  abrir,
}: {
  reserva: ReservaVista;
  alDerecha: boolean;
  abrir: (id: string) => void;
}) {
  return (
    <li className="group/cita relative z-0 hover:z-30 focus-within:z-30">
      <button
        type="button"
        onClick={() => abrir(reserva.id)}
        aria-haspopup="dialog"
        className={`flex w-full items-stretch gap-1.5 border text-left transition duration-200 ease-salida hover:-translate-y-px ${CITA_ESTADO_RESERVA[reserva.estado]}`}
      >
        <span aria-hidden className={`w-[3px] shrink-0 ${FILETE_ESTADO_RESERVA[reserva.estado]}`} />
        {/* Sin la hora: la fila en la que está la cita ya la dice, y repetirla
            en cada una llenaba de números una casilla de 90 px. */}
        <span
          className={`min-w-0 flex-1 py-1.5 pr-1.5 font-display text-[13px] leading-tight font-semibold ${
            reserva.estado === "CANCELADA" ? "line-through" : ""
          }`}
        >
          <span className="line-clamp-2">{reserva.nombre}</span>
        </span>
      </button>

      <div
        className={`pointer-events-none absolute top-[calc(100%-1px)] z-30 w-62 translate-y-1.5 border border-borde-fuerte bg-fondo-alto p-3.5 opacity-0 shadow-xl shadow-marino-900/15 transition duration-200 ease-salida group-hover/cita:pointer-events-auto group-hover/cita:translate-y-0 group-hover/cita:opacity-100 group-focus-within/cita:pointer-events-auto group-focus-within/cita:translate-y-0 group-focus-within/cita:opacity-100 ${
          alDerecha ? "right-0" : "left-0"
        }`}
      >
        <p className="font-mono text-[11px] tracking-[0.08em] text-tinta-tenue">
          {reserva.hora} · {reserva.dia}
        </p>

        <p className="mt-1.5 font-display text-base leading-tight font-bold tracking-[0.04em] uppercase">
          {reserva.nombre}
        </p>

        <p className="text-sm text-tinta-suave">
          {reserva.vehiculo || reserva.tipo}
          {reserva.placa ? <span className="font-mono"> · {reserva.placa}</span> : null}
        </p>

        <p className="mt-2 line-clamp-2 text-sm">{reserva.motivo}</p>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <InsigniaReserva estado={reserva.estado} />
          <button
            type="button"
            onClick={() => abrir(reserva.id)}
            aria-haspopup="dialog"
            className="border border-marca bg-marca px-2.5 py-1.5 font-display text-[11px] font-bold tracking-[0.1em] text-white uppercase transition duration-200 ease-salida hover:bg-marca-viva active:translate-y-px"
          >
            Ver info detallada
          </button>
        </div>
      </div>
    </li>
  );
}

/** La misma cita, apilada: en una lista hay ancho y no hace falta asomar nada. */
function FilaCita({
  reserva,
  conDia = false,
  abrir,
}: {
  reserva: ReservaVista;
  /** Solo en «Sin cerrar», donde las filas son de días distintos. */
  conDia?: boolean;
  abrir: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={abrir}
        aria-haspopup="dialog"
        className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors duration-200 hover:bg-tinta/4"
      >
        <span
          aria-hidden
          className={`min-h-9 w-[3px] shrink-0 self-stretch ${FILETE_ESTADO_RESERVA[reserva.estado]}`}
        />

        <span className="flex w-18 shrink-0 flex-col">
          <span className="font-display text-base leading-none font-semibold tabular-nums">
            {reserva.clave}
          </span>
          {conDia ? (
            <span className="mt-0.5 text-[11px] text-tinta-tenue">{reserva.dia}</span>
          ) : null}
        </span>

        {/* La insignia va debajo y no al final de la fila: al costado le comía
            el ancho al nombre, y en un celular «Percy Huamán» terminaba en
            «Percy Huam…». */}
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span
            className={`truncate font-medium ${
              reserva.estado === "CANCELADA" ? "line-through" : ""
            }`}
          >
            {reserva.nombre}
          </span>
          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="truncate text-sm text-tinta-suave">
              {reserva.vehiculo || reserva.tipo}
              {reserva.placa ? ` · ${reserva.placa}` : ""}
            </span>
            <InsigniaReserva estado={reserva.estado} />
          </span>
        </span>
      </button>
    </li>
  );
}
