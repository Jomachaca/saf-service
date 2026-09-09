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
    return <p className="text-sm text-tinta-suave">La orden está cerrada.</p>;
  }

  return (
    <form action={accion} className="flex flex-col gap-3">
      <input type="hidden" name="orden_id" value={ordenId} />
      <input type="hidden" name="estado_actual" value={estado} />

      <input
        name="nota"
        placeholder="Nota (opcional): queda en la bitácora"
        className="w-full rounded-lg border border-borde bg-fondo-alto px-3 py-2 text-sm"
      />

      <div className="flex flex-wrap gap-2">
        {destinos.map((destino) => (
          <button
            key={destino}
            type="submit"
            name="estado_nuevo"
            value={destino}
            disabled={enviando}
            className="rounded-lg bg-marca px-3 py-1.5 text-sm font-medium text-sobre-marca disabled:opacity-50"
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

      {/*
        Botones y no radios, por lo mismo que en la recepción: React no
        sincroniza el atributo `checked`, y el reset previo a la acción hacía
        que se enviara una ubicación distinta de la que estaba marcada.
      */}
      <input type="hidden" name="ubicacion" value={destino} />

      <div className="flex flex-wrap gap-2">
        {UBICACIONES.map((opcion) => (
          <button
            key={opcion}
            type="button"
            aria-pressed={destino === opcion}
            onClick={() => setDestino(opcion)}
            className={`rounded-full border px-3 py-1 text-sm ${
              destino === opcion
                ? "border-marca bg-marca text-sobre-marca"
                : "border-borde"
            }`}
          >
            {ETIQUETA_UBICACION[opcion]}
          </button>
        ))}
      </div>

      {destino === "BOX" ? (
        <select
          name="box_id"
          required
          defaultValue={boxId ?? ""}
          className="w-full rounded-lg border border-borde bg-fondo-alto px-3 py-2 text-sm"
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
          className="rounded-lg border border-borde-fuerte px-3 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          {enviando ? "Moviendo…" : "Mover"}
        </button>
      </div>

      {resultado.error ? <Aviso>{resultado.error}</Aviso> : null}
    </form>
  );
}
