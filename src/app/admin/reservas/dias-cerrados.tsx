"use client";

import { CalendarX, X } from "@phosphor-icons/react/dist/ssr";
import { useActionState, useState, useTransition } from "react";

import { CLASES_CAMPO } from "../campos";
import { Aviso } from "../componentes";
import { DIA_CERRADO_INICIAL } from "../estado-formulario";
import { abrirDia, cerrarDia } from "./acciones";

export type DiaCerradoEnPantalla = {
  fecha: string;
  motivo: string;
  reservas: number;
  etiqueta: string;
};

/**
 * Feriados y cierres puntuales. Un día cerrado no aparece en el formulario de
 * reservas aunque su día de la semana tenga cupos.
 *
 * Cerrar un día no cancela las reservas que ya había: eso lo decide una persona
 * después de avisarles, desde la agenda.
 */
export function DiasCerrados({ cerrados, hoy }: { cerrados: DiaCerradoEnPantalla[]; hoy: string }) {
  const [estado, accion, enviando] = useActionState(cerrarDia, DIA_CERRADO_INICIAL);

  return (
    <section className="rounded-2xl border border-borde bg-fondo-alto p-5 md:p-6">
      <div className="mb-5 flex flex-col gap-1">
        <h2 className="font-display text-xl font-semibold uppercase tracking-tight">Días cerrados</h2>
        <p className="max-w-2xl text-sm text-tinta-suave">
          Feriados o días en que el taller no atiende. Ese día no aparece en el formulario de
          reservas.
        </p>
      </div>

      {cerrados.length === 0 ? (
        <p className="mb-5 text-sm text-tinta-tenue">No hay días cerrados por delante.</p>
      ) : (
        <ul className="mb-5 flex flex-col divide-y divide-borde border border-borde">
          {cerrados.map((dia) => (
            <FilaDiaCerrado key={dia.fecha} dia={dia} />
          ))}
        </ul>
      )}

      {/* La `key` vacía los campos después de cerrar un día, igual que en el catálogo. */}
      <CamposDiaCerrado
        key={estado.creado ?? "nuevo"}
        accion={accion}
        enviando={enviando}
        hoy={hoy}
      />

      {estado.error ? (
        <div className="mt-3">
          <Aviso>{estado.error}</Aviso>
        </div>
      ) : null}

      {estado.aviso ? (
        <p role="status" className="mt-3 text-sm text-amber-800">
          {estado.aviso}
        </p>
      ) : null}
    </section>
  );
}

function FilaDiaCerrado({ dia }: { dia: DiaCerradoEnPantalla }) {
  const [abriendo, empezar] = useTransition();

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5">
      <CalendarX size={18} weight="duotone" className="text-marca" />
      <span className="font-medium">{dia.etiqueta}</span>
      {dia.motivo ? <span className="text-sm text-tinta-suave">{dia.motivo}</span> : null}
      {dia.reservas > 0 ? (
        <span className="text-sm text-amber-800">
          {dia.reservas === 1 ? "1 reserva de antes del cierre" : `${dia.reservas} reservas de antes del cierre`}
        </span>
      ) : null}

      <button
        type="button"
        disabled={abriendo}
        onClick={() => empezar(() => abrirDia(dia.fecha))}
        className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 text-sm text-tinta-suave transition-colors duration-200 hover:text-marca disabled:opacity-50"
      >
        <X size={14} />
        {abriendo ? "Abriendo…" : "Abrir de nuevo"}
      </button>
    </li>
  );
}

function CamposDiaCerrado({
  accion,
  enviando,
  hoy,
}: {
  accion: (datos: FormData) => void;
  enviando: boolean;
  hoy: string;
}) {
  // Controlados: un error de la acción no puede vaciar la fecha elegida.
  const [fecha, setFecha] = useState("");
  const [motivo, setMotivo] = useState("");

  return (
    <form action={accion} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Fecha</span>
        <input
          type="date"
          name="fecha"
          min={hoy}
          required
          value={fecha}
          onChange={(evento) => setFecha(evento.target.value)}
          className={`${CLASES_CAMPO} w-44`}
        />
      </label>

      <label className="flex min-w-48 flex-1 flex-col gap-1.5">
        <span className="text-sm font-medium">
          Motivo <span className="font-normal text-tinta-tenue">(opcional)</span>
        </span>
        <input
          name="motivo"
          maxLength={80}
          value={motivo}
          onChange={(evento) => setMotivo(evento.target.value)}
          placeholder="Fiestas Patrias"
          className={CLASES_CAMPO}
        />
      </label>

      <button
        type="submit"
        disabled={enviando || !fecha}
        className="rounded-lg bg-marca px-4 py-2 font-display text-sm font-semibold uppercase tracking-wide text-sobre-marca transition duration-200 ease-salida hover:bg-marca-viva active:translate-y-px disabled:opacity-50"
      >
        {enviando ? "Cerrando…" : "Cerrar ese día"}
      </button>
    </form>
  );
}
