/**
 * Máquina de estados de la orden de servicio.
 *
 * Función pura: no toca la base ni la sesión. Quien persiste es quien además
 * escribe el `evento_orden`, en la misma transacción.
 *
 * Ver ARQUITECTURA.md §3 y decisiones 3 y 23.
 */

export const ESTADOS = [
  "RECIBIDO",
  "DIAGNOSTICO",
  "ESPERANDO_APROBACION",
  "EN_TRABAJO",
  "LISTO",
] as const;

export type Estado = (typeof ESTADOS)[number];

export const ESTADO_INICIAL: Estado = "RECIBIDO";

/** Color semántico del estado en el tablero. Ver ARQUITECTURA.md §3. */
export const COLOR_ESTADO: Record<Estado, string> = {
  RECIBIDO: "verde",
  DIAGNOSTICO: "naranja",
  ESPERANDO_APROBACION: "morado",
  EN_TRABAJO: "azul",
  LISTO: "gris",
};

export const ETIQUETA_ESTADO: Record<Estado, string> = {
  RECIBIDO: "Recibido",
  DIAGNOSTICO: "En diagnóstico",
  ESPERANDO_APROBACION: "Esperando aprobación",
  EN_TRABAJO: "En trabajo",
  LISTO: "Listo",
};

/**
 * Único paso hacia adelante desde cada estado (decisión 23: no hay saltos).
 * Aparte de esto, desde cualquier estado se puede cerrar a LISTO —rechazo,
 * cancelación o derivación externa—, que es lo que hace `esCierre`.
 */
const SIGUIENTE: Record<Estado, Estado | null> = {
  RECIBIDO: "DIAGNOSTICO",
  DIAGNOSTICO: "ESPERANDO_APROBACION",
  ESPERANDO_APROBACION: "EN_TRABAJO",
  EN_TRABAJO: "LISTO",
  LISTO: null,
};

export function esEstado(valor: unknown): valor is Estado {
  return ESTADOS.includes(valor as Estado);
}

export function esFinal(estado: Estado): boolean {
  return estado === "LISTO";
}

/** Estados a los que se puede mover una orden que hoy está en `desde`. */
export function transicionesValidas(desde: Estado): Estado[] {
  if (esFinal(desde)) return [];
  const avance = SIGUIENTE[desde];
  const destinos: Estado[] = avance ? [avance] : [];
  if (!destinos.includes("LISTO")) destinos.push("LISTO");
  return destinos;
}

export function puedeTransicionar(desde: Estado, hacia: Estado): boolean {
  return transicionesValidas(desde).includes(hacia);
}

export type ResultadoTransicion =
  | { ok: true; estado: Estado }
  | { ok: false; motivo: string };

/**
 * Valida un cambio de estado. Devuelve el estado nuevo o el motivo del rechazo;
 * no lanza, porque el llamador casi siempre quiere mostrarle el motivo a alguien.
 */
export function transicionar(desde: Estado, hacia: Estado): ResultadoTransicion {
  if (desde === hacia) {
    return { ok: false, motivo: `La orden ya está en ${ETIQUETA_ESTADO[hacia]}.` };
  }
  if (esFinal(desde)) {
    return { ok: false, motivo: "La orden está cerrada y no admite más cambios." };
  }
  if (!puedeTransicionar(desde, hacia)) {
    return {
      ok: false,
      motivo:
        `No se puede pasar de ${ETIQUETA_ESTADO[desde]} a ${ETIQUETA_ESTADO[hacia]}. ` +
        `Desde acá solo se puede avanzar a ${transicionesValidas(desde)
          .map((e) => ETIQUETA_ESTADO[e])
          .join(" o ")}.`,
    };
  }
  return { ok: true, estado: hacia };
}
