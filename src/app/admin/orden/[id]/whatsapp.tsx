"use client";

import { useTransition } from "react";

import { registrarLinkGenerado } from "../../acciones-presupuesto";

/**
 * Abre WhatsApp con el mensaje escrito y registra que el enlace se generó.
 *
 * El evento se llama `LINK_GENERADO` y no "cliente notificado" porque `wa.me`
 * no devuelve confirmación de nada: quien aprieta enviar es una persona, y bien
 * puede cerrar WhatsApp sin mandarlo (decisión 9, regla 7).
 */
export function BotonWhatsApp({
  ordenId,
  enlace,
  enlacePublico,
}: {
  ordenId: string;
  enlace: string | null;
  enlacePublico: string;
}) {
  const [, registrar] = useTransition();

  return (
    <div className="flex flex-col gap-2">
      {enlace ? (
        <a
          href={enlace}
          target="_blank"
          rel="noreferrer"
          onClick={() => registrar(() => registrarLinkGenerado(ordenId))}
          className="inline-flex w-fit rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white"
        >
          Enviar por WhatsApp
        </a>
      ) : (
        <p className="text-sm text-tinta-suave">
          Falta el teléfono del cliente o el WhatsApp del taller para armar el
          mensaje.
        </p>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-xs text-tinta-tenue">Enlace del cliente</span>
        <input
          readOnly
          value={enlacePublico}
          onFocus={(evento) => evento.target.select()}
          className="w-full rounded-lg border border-borde bg-fondo-hondo px-2.5 py-1.5 font-mono text-xs"
        />
      </label>
    </div>
  );
}
