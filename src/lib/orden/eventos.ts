/**
 * Tipos de evento de la bitácora (decisión 14).
 *
 * `evento_orden.tipo` es texto libre en la base a propósito —cada fase agrega
 * los suyos sin migrar—, pero los que la aplicación escribe salen de acá, para
 * que no convivan "ESTADO_CAMBIADO" y "CAMBIO_ESTADO" según quién lo escribió.
 *
 * Los nombres describen lo que pasó de verdad: en la Fase 2, mandar el
 * presupuesto por `wa.me` registra LINK_GENERADO y no "cliente notificado",
 * porque `wa.me` no confirma entrega (decisión 9).
 */

export const ETIQUETA_EVENTO: Record<string, string> = {
  ORDEN_CREADA: "Orden creada",
  ESTADO_CAMBIADO: "Cambio de estado",
  BOX_ASIGNADO: "Box asignado",
  BOX_CAMBIADO: "Cambio de box",
  BOX_LIBERADO: "Box liberado",
  UBICACION_CAMBIADA: "Cambio de ubicación",
};

export function etiquetaEvento(tipo: string): string {
  return ETIQUETA_EVENTO[tipo] ?? tipo;
}
