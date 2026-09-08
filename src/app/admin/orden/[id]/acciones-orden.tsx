"use client";

import { useActionState, useState } from "react";

import type { Box } from "@/lib/orden/consultas";
import { ETIQUETA_ESTADO, transicionesValidas, type Estado } from "@/lib/orden/estados";
import { UBICACIONES, ETIQUETA_UBICACION, type Ubicacion } from "@/lib/orden/ubicacion";

import { Aviso } from "../../componentes";
import { cambiarEstado, moverOrden } from "../../acciones";
import { SIN_ERROR } from "../../estado-formulario";

/**
 * Las transiciones que se ofrecen salen de la función pura, no de una lista
 * escrita a mano en la pantalla: si mañana cambia la máquina de estados, los
 * botones cambian solos (decisión 23).
 */
export function CambiarEstado({
  ordenId,
  estado,
}: {
  ordenId: string;
  estado: Estado;
}) {
  const [resultado, accion, enviando] = useActionState(cambiarEstado, SIN_ERROR);
  const destinos = transicionesValidas(estado);

  if (destinos.length === 0) {
    return <p className="text-sm opacity-60">La orden está cerrada.</p>;
  }

  return (
    <form action={accion} className="flex flex-col gap-3">
      <input type="hidden" name="orden_id" value={ordenId} />
      <input type="hidden" name="estado_actual" value={estado} />

      <input
        name="nota"
        placeholder="Nota (opcional): queda en la bitácora"
        className="w-full rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/20"
      />

      <div className="flex flex-wrap gap-2">
        {destinos.map((destino) => (
          <button
            key={destino}
            type="submit"
            name="estado_nuevo"
            value={destino}
            disabled={enviando}
            className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background disabled:opacity-50"
          >
            Pasar a {ETIQUETA_ESTADO[destino].toLowerCase()}
          </button>
        ))}
      </div>

      {resultado.error ? <Aviso>{resultado.error}</Aviso> : null}
    </form>
  );
}

/**
 * Mover el vehículo no toca el estado (decisión 2). Un auto esperando repuestos
 * puede salir del box sin dejar de estar en trabajo.
 */
export function MoverVehiculo({
  ordenId,
  ubicacion,
  boxId,
  boxes,
  boxesOcupados,
}: {
  ordenId: string;
  ubicacion: Ubicacion;
  boxId: string | null;
  boxes: Box[];
  boxesOcupados: string[];
}) {
  const [resultado, accion, enviando] = useActionState(moverOrden, SIN_ERROR);
  const [destino, setDestino] = useState<Ubicacion>(ubicacion);

  return (
    <form action={accion} className="flex flex-col gap-3">
      <input type="hidden" name="orden_id" value={ordenId} />

      <div className="flex flex-wrap gap-2">
        {UBICACIONES.map((opcion) => (
          <label
            key={opcion}
            className={`cursor-pointer rounded-full border px-3 py-1 text-sm ${
              destino === opcion
                ? "border-foreground bg-foreground text-background"
                : "border-black/15 dark:border-white/20"
            }`}
          >
            <input
              type="radio"
              name="ubicacion"
              value={opcion}
              checked={destino === opcion}
              onChange={() => setDestino(opcion)}
              className="sr-only"
            />
            {ETIQUETA_UBICACION[opcion]}
          </label>
        ))}
      </div>

      {destino === "BOX" ? (
        <select
          name="box_id"
          required
          defaultValue={boxId ?? ""}
          className="w-full rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/20"
        >
          <option value="" disabled>
            Elegir box…
          </option>
          {boxes.map((box) => {
            // El box propio sigue disponible: mover una orden al box en el que
            // ya está no tiene que fallar.
            const libre = !boxesOcupados.includes(box.id) || box.id === boxId;
            return (
              <option key={box.id} value={box.id} disabled={!libre}>
                {box.nombre} · {box.tipo}
                {libre ? "" : " · ocupado"}
              </option>
            );
          })}
        </select>
      ) : null}

      <div>
        <button
          type="submit"
          disabled={enviando}
          className="rounded-md border border-black/20 px-3 py-1.5 text-sm font-medium disabled:opacity-50 dark:border-white/25"
        >
          {enviando ? "Moviendo…" : "Mover"}
        </button>
      </div>

      {resultado.error ? <Aviso>{resultado.error}</Aviso> : null}
    </form>
  );
}
