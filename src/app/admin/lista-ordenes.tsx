"use client";

import { CaretDown, CaretUp, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";

import type { OrdenEnTablero } from "@/lib/orden/consultas";
import { ESTADOS, ETIQUETA_ESTADO, type Estado } from "@/lib/orden/estados";
import { nombrarLugar } from "@/lib/orden/ubicacion";
import { tiempoTranscurrido } from "@/lib/fecha";

import { COLOR_ESTADO, EnlaceOrden, Insignia, Seccion, Ubicada } from "./componentes";

/**
 * La lista de órdenes activas, con buscador, filtro por estado y orden por
 * columna.
 *
 * Todo pasa del lado del cliente a propósito: la lista ya está en memoria y
 * filtrarla sin viaje al servidor es lo que hace que el tablero se sienta un
 * tablero y no un formulario de búsqueda.
 *
 * `ahora` llega del servidor para que las funciones de fecha sigan siendo puras
 * y no haya desajuste entre el HTML servido y el hidratado.
 */

/** Las columnas por las que se puede ordenar. «Motivo» no: es prosa. */
type Campo = "tiempo" | "vehiculo" | "estado" | "lugar";

const ETIQUETA_CAMPO: Record<Campo, string> = {
  tiempo: "Tiempo",
  vehiculo: "Vehículo",
  estado: "Estado",
  lugar: "Dónde",
};

/**
 * Cada comparador ordena de menor a mayor en la lectura natural de su columna.
 * El de tiempo mira la fecha de ingreso, así que ascendente es el que entró
 * primero: el que más lleva esperando, que es el urgente.
 */
function comparar(campo: Campo, lugarDe: (orden: OrdenEnTablero) => string) {
  return (uno: OrdenEnTablero, otro: OrdenEnTablero): number => {
    switch (campo) {
      case "tiempo":
        return Date.parse(uno.recibido_en) - Date.parse(otro.recibido_en);
      case "vehiculo":
        return (uno.vehiculo?.placa ?? "").localeCompare(otro.vehiculo?.placa ?? "", "es");
      case "estado":
        return ESTADOS.indexOf(uno.estado) - ESTADOS.indexOf(otro.estado);
      case "lugar":
        return lugarDe(uno).localeCompare(lugarDe(otro), "es");
    }
  };
}

/** Sin tildes y en minúsculas, para que «Cárdenas» se encuentre tecleando «cardenas». */
function plano(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

const COLUMNAS =
  "@2xl:grid @2xl:grid-cols-[3px_minmax(0,1fr)_9.5rem_7.5rem_minmax(0,1.2fr)_4.5rem] " +
  "@2xl:items-center @2xl:gap-x-3.5";

export function ListaOrdenes({
  ordenes,
  nombresDeEspacio,
  ahora,
}: {
  ordenes: OrdenEnTablero[];
  nombresDeEspacio: Record<string, string>;
  ahora: string;
}) {
  const [filtro, setFiltro] = useState<Estado | "TODAS">("TODAS");
  const [busqueda, setBusqueda] = useState("");
  // El que más tiempo lleva, arriba: es el orden con el que se prioriza.
  const [campo, setCampo] = useState<Campo>("tiempo");
  const [ascendente, setAscendente] = useState(true);

  const lugarDe = (orden: OrdenEnTablero) =>
    nombrarLugar(orden.ubicacion, orden.espacio_id ? nombresDeEspacio[orden.espacio_id] : null);

  const buscado = plano(busqueda.trim());

  const visibles = ordenes
    .filter((orden) => filtro === "TODAS" || orden.estado === filtro)
    .filter((orden) => {
      if (!buscado) return true;
      const donde = [
        orden.numero,
        orden.vehiculo?.placa,
        orden.vehiculo?.marca,
        orden.vehiculo?.modelo,
        orden.cliente?.nombre,
        orden.cliente?.telefono,
        orden.motivo_ingreso,
        lugarDe(orden),
      ];
      return donde.some((dato) => dato && plano(dato).includes(buscado));
    })
    .sort((uno, otro) => comparar(campo, lugarDe)(uno, otro) * (ascendente ? 1 : -1));

  const conteo = (estado: Estado) => ordenes.filter((o) => o.estado === estado).length;

  // Clic en la misma columna da la vuelta al orden; en otra, empieza de nuevo
  // por arriba. Es lo que hace cualquier tabla.
  const ordenarPor = (nuevo: Campo) => {
    if (nuevo === campo) setAscendente(!ascendente);
    else {
      setCampo(nuevo);
      setAscendente(true);
    }
  };

  return (
    <Seccion titulo="Órdenes activas" conteo={`${visibles.length} de ${ordenes.length}`}>
      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-2.5 border border-borde bg-fondo-alto px-3.5 py-2.5 focus-within:border-borde-fuerte">
          <MagnifyingGlass size={16} className="shrink-0 text-tinta-tenue" />
          <input
            type="search"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Placa, cliente, motivo, número de orden…"
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-tinta-tenue"
          />
          {busqueda ? (
            <button
              type="button"
              onClick={() => setBusqueda("")}
              className="shrink-0 font-display text-[11px] font-semibold tracking-[0.12em] text-tinta-tenue uppercase transition-colors duration-200 hover:text-marca"
            >
              Limpiar
            </button>
          ) : null}
        </label>

        <div className="flex flex-wrap gap-2">
          <Chip activo={filtro === "TODAS"} onClick={() => setFiltro("TODAS")}>
            Todas ({ordenes.length})
          </Chip>
          {ESTADOS.filter((estado) => estado !== "LISTO").map((estado) => (
            <Chip key={estado} activo={filtro === estado} onClick={() => setFiltro(estado)}>
              {ETIQUETA_ESTADO[estado]} ({conteo(estado)})
            </Chip>
          ))}
        </div>

        {/* Donde no entra la fila de encabezados, el mismo orden se elige en un
            desplegable: las dos cosas mandan sobre el mismo estado. */}
        <label className="flex items-center gap-2.5 text-sm text-tinta-suave @2xl:hidden">
          Ordenar por
          <select
            value={`${campo}:${ascendente ? "asc" : "desc"}`}
            onChange={(evento) => {
              const [nuevo, sentido] = evento.target.value.split(":");
              setCampo(nuevo as Campo);
              setAscendente(sentido === "asc");
            }}
            className="min-w-0 flex-1 border border-borde bg-fondo-alto px-2.5 py-1.5"
          >
            <option value="tiempo:asc">El que más tiempo lleva</option>
            <option value="tiempo:desc">El último que entró</option>
            <option value="vehiculo:asc">Placa (A–Z)</option>
            <option value="estado:asc">Estado</option>
            <option value="lugar:asc">Dónde está</option>
          </select>
        </label>
      </div>

      {visibles.length === 0 ? (
        <p className="text-sm text-tinta-suave">
          {ordenes.length === 0
            ? "No hay vehículos en el taller ahora mismo."
            : "Ninguna orden coincide con eso."}
        </p>
      ) : (
        <div className="flex flex-col">
          <div
            className={`hidden border-b border-borde-fuerte pb-2 ${COLUMNAS} @2xl:grid`}
            role="presentation"
          >
            <span />
            <Cabecera campo="vehiculo" actual={campo} ascendente={ascendente} al={ordenarPor} />
            <Cabecera campo="estado" actual={campo} ascendente={ascendente} al={ordenarPor} />
            <Cabecera campo="lugar" actual={campo} ascendente={ascendente} al={ordenarPor} />
            <span className="font-display text-[11px] font-semibold tracking-[0.14em] text-tinta-tenue uppercase">
              Motivo
            </span>
            <Cabecera
              campo="tiempo"
              actual={campo}
              ascendente={ascendente}
              al={ordenarPor}
              alFinal
            />
          </div>

          <ul className="flex flex-col">
            {visibles.map((orden) => (
              <li
                key={orden.id}
                className={`flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-borde px-1 py-3 transition-colors duration-200 hover:bg-fondo-hondo ${COLUMNAS}`}
              >
                {/* El filete abre la fila con el color del estado: la lista se
                    recorre por el margen antes que por las insignias. */}
                <span
                  aria-hidden
                  className={`min-h-8.5 shrink-0 basis-1 self-stretch ${COLOR_ESTADO[orden.estado]}`}
                />

                <span className="flex min-w-0 flex-col">
                  <EnlaceOrden id={orden.id} numero={orden.numero}>
                    <span className="font-mono text-base font-medium">
                      {orden.vehiculo?.placa}
                    </span>
                  </EnlaceOrden>
                  <span className="truncate text-[13px] text-tinta-suave">
                    {orden.vehiculo?.marca} {orden.vehiculo?.modelo}
                  </span>
                </span>

                <Insignia estado={orden.estado} />

                <Ubicada
                  ubicacion={orden.ubicacion}
                  espacio={orden.espacio_id ? nombresDeEspacio[orden.espacio_id] : null}
                />

                <span className="min-w-0 flex-1 basis-48 truncate text-sm text-tinta-suave">
                  {orden.motivo_ingreso}
                </span>

                <span className="ms-auto font-mono text-xs tabular-nums text-tinta-tenue @2xl:ms-0 @2xl:text-right">
                  {tiempoTranscurrido(orden.recibido_en, new Date(ahora))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Seccion>
  );
}

/** Un encabezado que ordena. La flecha solo aparece en la columna que manda. */
function Cabecera({
  campo,
  actual,
  ascendente,
  al,
  alFinal = false,
}: {
  campo: Campo;
  actual: Campo;
  ascendente: boolean;
  al: (campo: Campo) => void;
  alFinal?: boolean;
}) {
  const manda = campo === actual;

  return (
    <button
      type="button"
      onClick={() => al(campo)}
      aria-label={`Ordenar por ${ETIQUETA_CAMPO[campo].toLowerCase()}`}
      className={`flex items-center gap-1 font-display text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors duration-200 hover:text-marca ${
        manda ? "text-tinta" : "text-tinta-tenue"
      } ${alFinal ? "justify-end" : ""}`}
    >
      {ETIQUETA_CAMPO[campo]}
      {manda ? (
        ascendente ? (
          <CaretUp size={11} weight="bold" />
        ) : (
          <CaretDown size={11} weight="bold" />
        )
      ) : null}
    </button>
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
