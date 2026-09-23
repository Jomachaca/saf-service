/**
 * Los lugares del taller (decisión 35).
 *
 * Un espacio es una fila de la tabla `espacio`: un patio, un elevador, la
 * vereda de al lado. Los crea el taller en `/admin/espacios`, con su nombre y
 * cuántos vehículos le caben. Dónde está un vehículo lo dice `ubicacion.ts`;
 * acá está qué es un lugar.
 *
 * Igual que `presupuesto.ts`, este módulo **no puede ser `server-only`**: lo
 * importan componentes de cliente. Las consultas viven en `consultas.ts`.
 */

/** Qué vehículos admite un espacio. `AMBOS` es el patio: entra lo que entre. */
export const TIPOS_ESPACIO = ["SEDAN", "GRANDE", "AMBOS"] as const;

export type TipoEspacio = (typeof TIPOS_ESPACIO)[number];

export const ETIQUETA_TIPO_ESPACIO: Record<TipoEspacio, string> = {
  SEDAN: "Autos",
  GRANDE: "Camionetas",
  AMBOS: "Cualquiera",
};

export function esTipoEspacio(valor: unknown): valor is TipoEspacio {
  return (TIPOS_ESPACIO as readonly string[]).includes(valor as string);
}

export type Espacio = {
  id: string;
  nombre: string;
  tipo: TipoEspacio;
  /** Cuántos vehículos entran a la vez. Lo hace cumplir la base. */
  capacidad: number;
  activo: boolean;
  orden_visual: number;
};

/** Un espacio con cuántos vehículos tiene dentro ahora mismo. */
export type EspacioConCupo = Espacio & { ocupados: number };
