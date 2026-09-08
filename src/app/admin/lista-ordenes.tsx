"use client";

import { useState } from "react";

import type { OrdenEnTablero } from "@/lib/orden/consultas";
import { ESTADOS, ETIQUETA_ESTADO, type Estado } from "@/lib/orden/estados";
import { tiempoTranscurrido } from "@/lib/fecha";

import { EnlaceOrden, Insignia, Ubicada } from "./componentes";

/**
 * El filtro es del lado del cliente a propósito: la lista ya está en memoria y
 * filtrar sin viaje al servidor es lo que hace que el tablero se sienta un
 * tablero y no un formulario de búsqueda.
 *
 * `ahora` llega del servidor para que las funciones de fecha sigan siendo puras
 * y no haya desajuste entre el HTML servido y el hidratado.
 */
export function ListaOrdenes({
  ordenes,
  nombresDeBox,
  ahora,
}: {
  ordenes: OrdenEnTablero[];
  nombresDeBox: Record<string, string>;
  ahora: string;
}) {
  const [filtro, setFiltro] = useState<Estado | "TODAS">("TODAS");

  const visibles =
    filtro === "TODAS" ? ordenes : ordenes.filter((o) => o.estado === filtro);

  const conteo = (estado: Estado) =>
    ordenes.filter((o) => o.estado === estado).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Chip activo={filtro === "TODAS"} onClick={() => setFiltro("TODAS")}>
          Todas ({ordenes.length})
        </Chip>
        {ESTADOS.filter((estado) => estado !== "LISTO").map((estado) => (
          <Chip
            key={estado}
            activo={filtro === estado}
            onClick={() => setFiltro(estado)}
          >
            {ETIQUETA_ESTADO[estado]} ({conteo(estado)})
          </Chip>
        ))}
      </div>

      {visibles.length === 0 ? (
        <p className="text-sm opacity-60">
          {ordenes.length === 0
            ? "No hay vehículos en el taller ahora mismo."
            : "Ninguna orden en ese estado."}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-black/10 dark:divide-white/10">
          {visibles.map((orden) => (
            <li key={orden.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
              <Insignia estado={orden.estado} />

              <EnlaceOrden id={orden.id} numero={orden.numero}>
                <span className="font-mono font-medium">{orden.vehiculo?.placa}</span>
              </EnlaceOrden>

              <span className="text-sm opacity-80">
                {orden.vehiculo?.marca} {orden.vehiculo?.modelo}
              </span>

              <Ubicada
                ubicacion={orden.ubicacion}
                box={orden.box_id ? nombresDeBox[orden.box_id] : null}
              />

              <span className="min-w-0 flex-1 truncate text-sm opacity-60">
                {orden.motivo_ingreso}
              </span>

              <span className="text-xs tabular-nums opacity-50">
                {tiempoTranscurrido(orden.recibido_en, new Date(ahora))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Chip({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`rounded-full border px-3 py-1 text-xs transition ${
        activo
          ? "border-foreground bg-foreground text-background"
          : "border-black/15 hover:border-black/40 dark:border-white/20 dark:hover:border-white/50"
      }`}
    >
      {children}
    </button>
  );
}
