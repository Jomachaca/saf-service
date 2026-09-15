/**
 * Estado del formulario público de reserva.
 *
 * Vive fuera de `acciones.ts` porque un archivo `"use server"` solo puede
 * exportar funciones async (ver `src/app/admin/estado-formulario.ts`).
 */

export type EstadoEnvioReserva = { error: string | null; reservada: boolean };

export const ENVIO_INICIAL: EstadoEnvioReserva = { error: null, reservada: false };
