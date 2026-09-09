"use client";

import { ArrowSquareOut, CloudArrowUp } from "@phosphor-icons/react/dist/ssr";
import { useTransition } from "react";

import { publicarCambios } from "./acciones";

/**
 * Guardar y publicar son cosas distintas (decisión 17).
 *
 * Editar el horario, subir tres fotos y corregir el lema son varios guardados
 * seguidos. Si cada uno saliera al aire, el visitante vería la página a medio
 * hacer. Acá se guarda cuanto haga falta y se publica una vez.
 */
export function BarraPublicar({
  sinPublicar,
  ultimaPublicacion,
}: {
  sinPublicar: boolean;
  ultimaPublicacion: string | null;
}) {
  const [publicando, empezar] = useTransition();

  return (
    <div className="sticky top-0 z-30 -mx-6 mb-2 border-b border-borde bg-fondo/95 px-6 py-3 backdrop-blur">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {sinPublicar ? "Hay cambios sin publicar" : "El sitio está al día"}
          </span>
          <span className="text-xs text-tinta-tenue">
            {ultimaPublicacion
              ? `Última publicación: ${ultimaPublicacion}`
              : "Todavía no se publicó nunca"}
          </span>
        </div>

        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-2 rounded-lg border border-borde-fuerte px-3 py-2 text-sm font-medium transition duration-200 ease-salida hover:border-marca hover:text-marca"
        >
          <ArrowSquareOut size={16} />
          Ver el sitio
        </a>

        <button
          type="button"
          disabled={publicando || !sinPublicar}
          onClick={() => empezar(() => publicarCambios())}
          className="inline-flex items-center gap-2 rounded-lg bg-marca px-4 py-2 font-display text-sm font-semibold uppercase tracking-wide text-sobre-marca transition duration-200 ease-salida hover:bg-marca-viva disabled:cursor-not-allowed disabled:opacity-40 active:translate-y-px"
        >
          <CloudArrowUp size={18} />
          {publicando ? "Publicando…" : "Publicar cambios"}
        </button>
      </div>
    </div>
  );
}
