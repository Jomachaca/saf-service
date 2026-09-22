"use client";

import { useState } from "react";

import type { OrdenEnTablero } from "@/lib/orden/consultas";
import { ESTADOS, ETIQUETA_ESTADO, type Estado } from "@/lib/orden/estados";
import { tiempoTranscurrido } from "@/lib/fecha";

import { COLOR_ESTADO, EnlaceOrden, Insignia, Seccion, Ubicada } from "./componentes";

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
    <Seccion
      titulo="Órdenes activas"
      conteo={`${visibles.length} de ${ordenes.length}`}
    >
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
        <p className="text-sm text-tinta-suave">
          {ordenes.length === 0
            ? "No hay vehículos en el taller ahora mismo."
            : "Ninguna orden en ese estado."}
        </p>
      ) : (
        <ul className="flex flex-col border-t border-borde">
          {visibles.map((orden) => (
            <li
              key={orden.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-borde px-2 py-3.5 transition-colors duration-200 hover:bg-fondo-hondo"
            >
              {/* El filete abre la fila con el color del estado: la lista se
                  recorre por el margen antes que por las insignias. */}
              <span
                aria-hidden
                className={`min-h-8.5 shrink-0 basis-1 self-stretch ${COLOR_ESTADO[orden.estado]}`}
              />

              <EnlaceOrden id={orden.id} numero={orden.numero}>
                <span className="font-mono text-base font-medium">
                  {orden.vehiculo?.placa}
                </span>
              </EnlaceOrden>

              <span className="min-w-0 basis-44 truncate text-[15px]">
                {orden.vehiculo?.marca} {orden.vehiculo?.modelo}
              </span>

              <Insignia estado={orden.estado} />

              <Ubicada
                ubicacion={orden.ubicacion}
                box={orden.box_id ? nombresDeBox[orden.box_id] : null}
              />

              <span className="min-w-0 flex-1 basis-48 truncate text-sm text-tinta-suave">
                {orden.motivo_ingreso}
              </span>

              <span className="ms-auto font-mono text-xs text-tinta-tenue tabular-nums">
                {tiempoTranscurrido(orden.recibido_en, new Date(ahora))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Seccion>
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
      className={`border px-3.5 py-1.75 font-display text-[13px] font-semibold tracking-[0.1em] uppercase transition duration-200 ${
        activo
          ? "border-marca bg-marca text-white"
          : "border-borde text-tinta-suave hover:border-borde-fuerte hover:text-tinta"
      }`}
    >
      {children}
    </button>
  );
}
