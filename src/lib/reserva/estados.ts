/**
 * Estados de la reserva.
 *
 * Función pura, igual que la de la orden (`src/lib/orden/estados.ts`): no toca
 * la base ni lee el reloj. Quien la llama le dice si la hora ya pasó.
 *
 * La reserva no es la orden (decisión 1). Su ciclo es corto y termina en uno de
 * tres finales: el vehículo llegó y se recibió, no vino, o se canceló.
 */

export const ESTADOS_RESERVA = [
  "PENDIENTE",
  "CONFIRMADA",
  "CONVERTIDA",
  "NO_ASISTIO",
  "CANCELADA",
] as const;

export type EstadoReserva = (typeof ESTADOS_RESERVA)[number];

export const ETIQUETA_ESTADO_RESERVA: Record<EstadoReserva, string> = {
  PENDIENTE: "Por confirmar",
  CONFIRMADA: "Confirmada",
  CONVERTIDA: "Recibida",
  NO_ASISTIO: "No asistió",
  CANCELADA: "Cancelada",
};

/**
 * Lo que se puede hacer desde la agenda con un botón.
 *
 * CONVERTIDA no es destino de nadie, y es a propósito: a ese estado se llega
 * solo recibiendo el vehículo, porque es `recepcionar_vehiculo()` quien cierra
 * la reserva en la misma transacción que abre la orden (decisión 28). Un botón
 * de «marcar recibida» dejaría reservas convertidas sin orden detrás.
 *
 * Tampoco se vuelve atrás. Una reserva cancelada por error se rehace: con el
 * mismo criterio de la decisión 23, agregar una transición es más barato que
 * quitarla cuando ya hay datos.
 */
const DESTINOS: Record<EstadoReserva, readonly EstadoReserva[]> = {
  PENDIENTE: ["CONFIRMADA", "NO_ASISTIO", "CANCELADA"],
  CONFIRMADA: ["NO_ASISTIO", "CANCELADA"],
  CONVERTIDA: [],
  NO_ASISTIO: [],
  CANCELADA: [],
};

export function esEstadoReserva(valor: unknown): valor is EstadoReserva {
  return ESTADOS_RESERVA.includes(valor as EstadoReserva);
}

export function esFinalReserva(estado: EstadoReserva): boolean {
  return DESTINOS[estado].length === 0;
}

/**
 * Con esta reserva se puede recibir el vehículo. Es el espejo del `where` que
 * usa `recepcionar_vehiculo()` al convertirla.
 */
export function puedeRecibirse(estado: EstadoReserva): boolean {
  return estado === "PENDIENTE" || estado === "CONFIRMADA";
}

/** «No asistió» solo se ofrece cuando la hora ya pasó: marcarlo antes es adivinar. */
export function transicionesReserva(
  desde: EstadoReserva,
  { yaPaso }: { yaPaso: boolean },
): EstadoReserva[] {
  return DESTINOS[desde].filter((destino) => destino !== "NO_ASISTIO" || yaPaso);
}

export type ResultadoReserva =
  | { ok: true; estado: EstadoReserva }
  | { ok: false; motivo: string };

/**
 * Valida un cambio pedido desde la agenda. Devuelve el motivo del rechazo en
 * vez de lanzar, porque casi siempre hay que mostrárselo a alguien.
 */
export function cambiarReserva(
  desde: EstadoReserva,
  hacia: EstadoReserva,
  contexto: { yaPaso: boolean },
): ResultadoReserva {
  if (desde === hacia) {
    return { ok: false, motivo: `La reserva ya figura como «${ETIQUETA_ESTADO_RESERVA[hacia]}».` };
  }
  if (esFinalReserva(desde)) {
    return { ok: false, motivo: "La reserva ya está cerrada y no admite cambios." };
  }
  if (hacia === "NO_ASISTIO" && !contexto.yaPaso) {
    return { ok: false, motivo: "Todavía no llega la hora de la reserva." };
  }
  if (!transicionesReserva(desde, contexto).includes(hacia)) {
    return {
      ok: false,
      motivo: `Una reserva «${ETIQUETA_ESTADO_RESERVA[desde]}» no puede pasar a «${ETIQUETA_ESTADO_RESERVA[hacia]}».`,
    };
  }
  return { ok: true, estado: hacia };
}
