"use client";

import { useActionState, useState } from "react";

import { formatearFechaHora } from "@/lib/fecha";
import type { Diagnostico } from "@/lib/orden/presupuesto";

import { Aviso } from "../../componentes";
import { SIN_ERROR } from "../../estado-formulario";
import { guardarDiagnostico } from "../../acciones-presupuesto";

const CLASES_CAMPO =
  "w-full rounded-lg border border-borde bg-fondo-alto px-3 py-2 text-sm";

/**
 * Hallazgos y recomendación, separados a propósito: lo que se encontró es un
 * hecho, lo que conviene hacer es una opinión, y el cliente ve las dos cosas por
 * el enlace público. Mezclarlas en un solo campo hace que el presupuesto parezca
 * una lista de precios sin justificación.
 */
export function FormularioDiagnostico({
  ordenId,
  diagnostico,
}: {
  ordenId: string;
  diagnostico: Diagnostico | null;
}) {
  const [estado, accion, guardando] = useActionState(guardarDiagnostico, SIN_ERROR);

  // Controlados a propósito. React vacía los campos no controlados apenas se
  // envía el formulario: si la acción fallaba, el mecánico perdía el
  // diagnóstico que acababa de escribir.
  const [campos, setCampos] = useState({
    hallazgos: diagnostico?.hallazgos ?? "",
    recomendacion: diagnostico?.recomendacion ?? "",
    mecanico: diagnostico?.mecanico ?? "",
  });

  function cambiar(campo: keyof typeof campos, valor: string) {
    setCampos((previos) => ({ ...previos, [campo]: valor }));
  }

  return (
    <form action={accion} className="flex max-w-2xl flex-col gap-3">
      <input type="hidden" name="orden_id" value={ordenId} />

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Hallazgos</span>
        <textarea
          name="hallazgos"
          rows={3}
          required
          value={campos.hallazgos}
          onChange={(evento) => cambiar("hallazgos", evento.target.value)}
          placeholder="Qué se encontró al revisar el vehículo"
          className={CLASES_CAMPO}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Recomendación</span>
        <textarea
          name="recomendacion"
          rows={2}
          value={campos.recomendacion}
          onChange={(evento) => cambiar("recomendacion", evento.target.value)}
          placeholder="Qué conviene hacer, y con qué urgencia"
          className={CLASES_CAMPO}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="opacity-70">Mecánico</span>
          <input
            name="mecanico"
            value={campos.mecanico}
            onChange={(evento) => cambiar("mecanico", evento.target.value)}
            className={`${CLASES_CAMPO} w-40`}
          />
        </label>

        <button
          type="submit"
          disabled={guardando}
          className="rounded-lg border border-borde-fuerte px-3 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          {guardando ? "Guardando…" : diagnostico ? "Actualizar" : "Guardar diagnóstico"}
        </button>

        {diagnostico ? (
          <span className="text-xs text-tinta-tenue">
            última edición {formatearFechaHora(diagnostico.actualizado_en)}
          </span>
        ) : null}
      </div>

      {estado.error ? <Aviso>{estado.error}</Aviso> : null}
    </form>
  );
}
