"use client";

import { Plus, X } from "@phosphor-icons/react/dist/ssr";
import { useActionState, useState } from "react";

import { DIAS_SEMANA, horaCorta, type Franja } from "@/lib/reserva/modelo";

import { Bloque, CLASES_CAMPO } from "../campos";
import { SIN_ERROR } from "../estado-formulario";
import { guardarFranjas } from "./acciones";

type Celdas = Record<string, string>;

const SECUNDARIO =
  "inline-flex items-center gap-2  border border-borde-fuerte px-3 py-2 text-sm " +
  "font-medium transition duration-200 ease-salida hover:border-marca hover:text-marca " +
  "disabled:opacity-40 disabled:hover:border-borde-fuerte disabled:hover:text-tinta";

/** El horario de partida de ARQUITECTURA.md §7: de 8:00 a 17:00, con 2 cupos. */
const HORAS_BASE = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

function clave(dia: number, hora: string): string {
  return `${dia}-${hora}`;
}

function desdeFranjas(franjas: Franja[]): { horas: string[]; celdas: Celdas } {
  const horas = [...new Set(franjas.map((franja) => horaCorta(franja.hora)))].sort();
  const celdas: Celdas = {};
  for (const franja of franjas) {
    celdas[clave(franja.dia_semana, horaCorta(franja.hora))] = String(franja.cupos);
  }
  return { horas, celdas };
}

/** Lo que viaja a la acción: solo las celdas con cupos. Vacío o cero es cerrado. */
function serializar(horas: string[], celdas: Celdas): string {
  return JSON.stringify(
    horas.flatMap((hora) =>
      DIAS_SEMANA.flatMap(({ dia }) => {
        const cupos = Number(celdas[clave(dia, hora)] || 0);
        return cupos > 0 ? [{ dia_semana: dia, hora, cupos }] : [];
      }),
    ),
  );
}

/**
 * La semana como tabla: horas en las filas, días en las columnas y los cupos en
 * cada celda. Una celda vacía quiere decir que a esa hora, ese día, no se
 * reserva.
 *
 * Se guarda la tabla entera de una vez, como las líneas de un presupuesto: no
 * hay que reconciliar qué celda cambió. El estado local no se resincroniza con
 * las props; después de guardar coincide con ellas y el botón vuelve a
 * «Guardado» solo.
 */
export function EditorFranjas({ franjas }: { franjas: Franja[] }) {
  const [estado, accion, guardando] = useActionState(guardarFranjas, SIN_ERROR);

  const [horas, setHoras] = useState(() => desdeFranjas(franjas).horas);
  const [celdas, setCeldas] = useState(() => desdeFranjas(franjas).celdas);
  const [nuevaHora, setNuevaHora] = useState("");

  const original = desdeFranjas(franjas);
  const serializado = serializar(horas, celdas);
  const sucio = serializado !== serializar(original.horas, original.celdas);

  function cambiarCelda(dia: number, hora: string, valor: string) {
    const limpio = valor.replace(/\D/g, "").slice(0, 2);
    setCeldas((previas) => ({ ...previas, [clave(dia, hora)]: limpio }));
  }

  function agregarHora() {
    if (!/^\d{2}:\d{2}$/.test(nuevaHora) || horas.includes(nuevaHora)) return;
    setHoras((previas) => [...previas, nuevaHora].sort());
    setNuevaHora("");
  }

  function quitarHora(hora: string) {
    setHoras((previas) => previas.filter((otra) => otra !== hora));
    setCeldas((previas) =>
      Object.fromEntries(Object.entries(previas).filter(([llave]) => !llave.endsWith(`-${hora}`))),
    );
  }

  // No se guarda solo: queda en pantalla para que alguien lo revise, lo ajuste
  // a lo que el taller hace de verdad y recién ahí pulse Guardar.
  function llenarBase() {
    setHoras(HORAS_BASE);
    setCeldas(
      Object.fromEntries(
        HORAS_BASE.flatMap((hora) =>
          DIAS_SEMANA.filter(({ dia }) => dia <= 6).map(({ dia }) => [clave(dia, hora), "2"]),
        ),
      ),
    );
  }

  function copiarLunes() {
    setCeldas((previas) => {
      const siguientes = { ...previas };
      for (const hora of horas) {
        for (const dia of [2, 3, 4, 5]) {
          siguientes[clave(dia, hora)] = previas[clave(1, hora)] ?? "";
        }
      }
      return siguientes;
    });
  }

  return (
    <form action={accion}>
      <input type="hidden" name="franjas" value={serializado} />

      <Bloque
        titulo="Cupos por hora"
        descripcion="Cuántas reservas se aceptan a cada hora. Deja vacío donde el taller no recibe."
        sucio={sucio}
        guardando={guardando}
        error={estado.error}
      >
        {horas.length === 0 ? (
          <div className="flex flex-col items-start gap-3 border border-dashed border-borde-fuerte p-4">
            <p className="text-sm text-tinta-suave">
              Todavía no hay horas. Agrégalas abajo, o empieza con un horario base y ajústalo
              antes de guardar.
            </p>
            <button type="button" onClick={llenarBase} className={SECUNDARIO}>
              Llenar de 8:00 a 17:00, de lunes a sábado, 2 por hora
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-xl border-separate border-spacing-x-1 border-spacing-y-1.5 text-sm">
              <thead>
                <tr>
                  <th scope="col" className="w-20 pb-1 text-left text-xs font-medium text-tinta-tenue">
                    Hora
                  </th>
                  {DIAS_SEMANA.map((dia) => (
                    <th key={dia.dia} scope="col" className="pb-1 text-xs font-medium text-tinta-tenue">
                      <abbr title={dia.largo} className="no-underline">
                        {dia.corto}
                      </abbr>
                    </th>
                  ))}
                  <th scope="col">
                    <span className="sr-only">Quitar</span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {horas.map((hora) => (
                  <tr key={hora}>
                    <th scope="row" className="text-left font-mono font-medium tabular-nums">
                      {hora}
                    </th>

                    {DIAS_SEMANA.map((dia) => {
                      const valor = celdas[clave(dia.dia, hora)] ?? "";
                      const abierta = Number(valor) > 0;

                      return (
                        <td key={dia.dia}>
                          <input
                            value={valor}
                            onChange={(evento) => cambiarCelda(dia.dia, hora, evento.target.value)}
                            inputMode="numeric"
                            aria-label={`${dia.largo} a las ${hora}, cupos`}
                            className={`w-full min-w-11 border px-1 py-1.5 text-center tabular-nums transition-colors duration-200 focus:border-marca focus:outline-none ${
                              abierta
                                ? "border-borde-fuerte bg-fondo-alto font-semibold text-tinta"
                                : "border-borde bg-fondo text-tinta-tenue"
                            }`}
                          />
                        </td>
                      );
                    })}

                    <td className="w-9 text-center">
                      <button
                        type="button"
                        onClick={() => quitarHora(hora)}
                        aria-label={`Quitar las ${hora}`}
                        className="rounded-lg p-1.5 text-tinta-tenue transition-colors duration-200 hover:text-marca"
                      >
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Agregar hora</span>
            <input
              type="time"
              step={1800}
              value={nuevaHora}
              onChange={(evento) => setNuevaHora(evento.target.value)}
              className={`${CLASES_CAMPO} w-36`}
            />
          </label>

          <button
            type="button"
            onClick={agregarHora}
            disabled={!nuevaHora || horas.includes(nuevaHora)}
            className={SECUNDARIO}
          >
            <Plus size={16} />
            Agregar
          </button>

          {horas.length > 0 ? (
            <button type="button" onClick={copiarLunes} className={`${SECUNDARIO} md:ml-auto`}>
              Copiar el lunes de martes a viernes
            </button>
          ) : null}
        </div>
      </Bloque>
    </form>
  );
}
