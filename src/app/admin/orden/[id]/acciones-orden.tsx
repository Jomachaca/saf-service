"use client";

import { useActionState, useState } from "react";

import type { EspacioConCupo } from "@/lib/orden/espacio";
import { ETIQUETA_ESTADO, transicionesValidas, type Estado } from "@/lib/orden/estados";
import { UBICACIONES, ETIQUETA_UBICACION, type Ubicacion } from "@/lib/orden/ubicacion";

import { Aviso, SelectorEspacio } from "../../componentes";
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
        className="w-full border border-borde bg-fondo-alto px-3 py-2 text-sm"
      />

      <div className="flex flex-wrap gap-2">
        {destinos.map((destino) => (
          <button
            key={destino}
            type="submit"
            name="estado_nuevo"
            value={destino}
            disabled={enviando}
            className="border border-marca bg-marca px-3.5 py-2 font-display text-xs font-semibold tracking-[0.09em] text-white uppercase transition duration-200 ease-salida hover:bg-marca-viva active:translate-y-px disabled:opacity-50"
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
 * puede salir del elevador sin dejar de estar en trabajo.
 */
export function MoverVehiculo({
  ordenId,
  ubicacion,
  espacioId,
  espacios,
}: {
  ordenId: string;
  ubicacion: Ubicacion;
  espacioId: string | null;
  espacios: EspacioConCupo[];
}) {
  const [resultado, accion, enviando] = useActionState(moverOrden, SIN_ERROR);
  const [destino, setDestino] = useState<Ubicacion>(ubicacion);
  const [espacio, setEspacio] = useState(espacioId ?? "");

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
            className={`border px-3 py-1.5 text-sm ${
              destino === opcion
                ? "border-marca bg-marca text-sobre-marca"
                : "border-borde"
            }`}
          >
            {ETIQUETA_UBICACION[opcion]}
          </button>
        ))}
      </div>

      {destino === "TALLER" && espacios.length > 0 ? (
        <SelectorEspacio
          espacios={espacios}
          valor={espacio}
          alCambiar={setEspacio}
          // El sitio propio sigue disponible: guardar sin mover el vehículo no
          // tiene que fallar por «lleno».
          actual={espacioId}
          className="text-sm"
        />
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
