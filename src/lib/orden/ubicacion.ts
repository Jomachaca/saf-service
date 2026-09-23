/**
 * Dónde está el vehículo. Es independiente del estado de la orden.
 *
 * Un auto esperando repuestos puede estar en el taller sin ocupar el elevador.
 * Si se ata el lugar al estado, el taller le miente al sistema para liberar
 * espacio y el tablero deja de reflejar la realidad. Ver decisión 2 y
 * ARQUITECTURA.md §4.
 *
 * Son dos, y no más, porque son las dos únicas respuestas que el sistema
 * necesita distinguir: está acá, o no está. **Los lugares de adentro son
 * datos**, filas de `espacio` que el taller configura en `/admin/espacios`
 * (decisión 35). Un vehículo en el taller puede tener espacio asignado o no
 * tenerlo, y no tenerlo es válido: es el auto que está en el local pero no en
 * un sitio concreto.
 */

export const UBICACIONES = ["TALLER", "FUERA"] as const;

export type Ubicacion = (typeof UBICACIONES)[number];

export const UBICACION_INICIAL: Ubicacion = "TALLER";

export const ETIQUETA_UBICACION: Record<Ubicacion, string> = {
  TALLER: "En el taller",
  FUERA: "Fuera del taller",
};

export function esUbicacion(valor: unknown): valor is Ubicacion {
  return UBICACIONES.includes(valor as Ubicacion);
}

/** Solo lo que está adentro puede ocupar un espacio de adentro. */
export function admiteEspacio(ubicacion: Ubicacion): boolean {
  return ubicacion === "TALLER";
}

/**
 * Cómo se nombra el lugar de un vehículo: el espacio si tiene uno, y si no la
 * ubicación a secas. Una sola función para que el tablero, la lista y el
 * detalle digan lo mismo.
 */
export function nombrarLugar(ubicacion: Ubicacion, espacio: string | null): string {
  return espacio ?? ETIQUETA_UBICACION[ubicacion];
}

export type ResultadoUbicacion =
  | { ok: true; ubicacion: Ubicacion; espacioId: string | null }
  | { ok: false; motivo: string };

export function ubicar(ubicacion: Ubicacion, espacioId: string | null): ResultadoUbicacion {
  if (!admiteEspacio(ubicacion) && espacioId) {
    return {
      ok: false,
      motivo: `Un vehículo ${ETIQUETA_UBICACION[ubicacion].toLowerCase()} no ocupa ningún espacio del taller.`,
    };
  }
  return { ok: true, ubicacion, espacioId: admiteEspacio(ubicacion) ? espacioId : null };
}
