/**
 * Ubicación física del vehículo. Es independiente del estado de la orden.
 *
 * Un auto esperando repuestos está en PATIO sin ocupar box. Si se ata el box al
 * estado, el taller le miente al sistema para liberar espacio y el tablero deja
 * de reflejar la realidad. Ver decisión 2 y ARQUITECTURA.md §4.
 */

export const UBICACIONES = ["BOX", "PATIO", "FUERA"] as const;

export type Ubicacion = (typeof UBICACIONES)[number];

export const UBICACION_INICIAL: Ubicacion = "PATIO";

export const ETIQUETA_UBICACION: Record<Ubicacion, string> = {
  BOX: "En box",
  PATIO: "En patio",
  FUERA: "Fuera del taller",
};

export function esUbicacion(valor: unknown): valor is Ubicacion {
  return UBICACIONES.includes(valor as Ubicacion);
}

/** El `box_id` solo tiene sentido cuando la ubicación es BOX. */
export function requiereBox(ubicacion: Ubicacion): boolean {
  return ubicacion === "BOX";
}

export type ResultadoUbicacion =
  | { ok: true; ubicacion: Ubicacion; boxId: string | null }
  | { ok: false; motivo: string };

export function ubicar(ubicacion: Ubicacion, boxId: string | null): ResultadoUbicacion {
  if (requiereBox(ubicacion) && !boxId) {
    return { ok: false, motivo: "Falta indicar en qué box está el vehículo." };
  }
  if (!requiereBox(ubicacion) && boxId) {
    return {
      ok: false,
      motivo: `Un vehículo en ${ETIQUETA_UBICACION[ubicacion].toLowerCase()} no ocupa un box.`,
    };
  }
  return { ok: true, ubicacion, boxId: requiereBox(ubicacion) ? boxId : null };
}
