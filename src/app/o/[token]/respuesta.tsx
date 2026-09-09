"use client";

import { useActionState, useState } from "react";

import { responderPresupuesto, type EstadoRespuesta } from "./acciones";

const INICIAL: EstadoRespuesta = { error: null };

/**
 * Aprobar o rechazar, con el nombre de quien decide.
 *
 * El nombre no verifica nada —detrás del enlace no hay cuenta— pero es lo que
 * convierte "alguien abrió el enlace" en una constancia utilizable si después
 * hay un reclamo (decisión 8). Se guarda como lo que es: un texto que el cliente
 * escribió.
 */
export function FormularioRespuesta({ token }: { token: string }) {
  const [estado, accion, enviando] = useActionState(responderPresupuesto, INICIAL);

  // Controlado: si la acción devuelve error React vaciaría el campo y el
  // cliente tendría que volver a escribir su nombre desde el celular.
  const [nombre, setNombre] = useState("");

  return (
    <form action={accion} className="flex flex-col gap-3">
      <input type="hidden" name="token" value={token} />

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Tu nombre</span>
        <input
          name="nombre"
          value={nombre}
          onChange={(evento) => setNombre(evento.target.value)}
          required
          autoComplete="name"
          className="w-full rounded-lg border border-borde bg-fondo-alto px-3 py-2"
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          name="decision"
          value="APROBADO"
          disabled={enviando}
          className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {enviando ? "Enviando…" : "Aprobar el trabajo"}
        </button>

        <button
          type="submit"
          name="decision"
          value="RECHAZADO"
          disabled={enviando}
          className="rounded-lg border border-borde-fuerte px-4 py-2 font-medium disabled:opacity-50"
        >
          No por ahora
        </button>
      </div>

      {estado.error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {estado.error}
        </p>
      ) : null}
    </form>
  );
}
