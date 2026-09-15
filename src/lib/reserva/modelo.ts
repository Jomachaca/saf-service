/**
 * Lo que comparten el formulario público, la agenda y la recepción.
 *
 * Igual que `src/lib/orden/presupuesto.ts`, este módulo **no puede ser
 * `server-only`**: lo importan componentes de cliente. Las consultas viven en
 * `consultas.ts`.
 */

import type { EstadoReserva } from "./estados";

export const TIPOS_VEHICULO = ["SEDAN", "GRANDE"] as const;

export type TipoVehiculo = (typeof TIPOS_VEHICULO)[number];

/**
 * Cómo lo nombra el cliente. En la base son los mismos tipos que usan los boxes
 * (`SEDAN`, `GRANDE`), pero nadie reserva diciendo «sedán».
 */
export const ETIQUETA_TIPO_VEHICULO: Record<TipoVehiculo, string> = {
  SEDAN: "Auto",
  GRANDE: "Camioneta o pesado",
};

export function esTipoVehiculo(valor: unknown): valor is TipoVehiculo {
  return TIPOS_VEHICULO.includes(valor as TipoVehiculo);
}

/**
 * El motivo que guarda `crear_reserva()` cuando el cliente no eligió servicio
 * (decisiones 15 y 30). Lo escribe la base; acá está para mostrarlo antes de
 * enviar. Si cambia, cambia en los dos lados.
 */
export const MOTIVO_DIAGNOSTICO = "No sé qué tiene / suena raro";

/** Mensaje por defecto para confirmar una reserva por WhatsApp desde la agenda. */
export const PLANTILLA_RESERVA =
  "Hola {cliente}, te escribimos de {taller}. Confirmamos tu reserva para el {fecha} a las {hora}. Te esperamos en {direccion}.";

/** ISO 8601, como `extract(isodow)` en la base: 1 es lunes y 7 es domingo. */
export const DIAS_SEMANA = [
  { dia: 1, corto: "Lun", largo: "Lunes" },
  { dia: 2, corto: "Mar", largo: "Martes" },
  { dia: 3, corto: "Mié", largo: "Miércoles" },
  { dia: 4, corto: "Jue", largo: "Jueves" },
  { dia: 5, corto: "Vie", largo: "Viernes" },
  { dia: 6, corto: "Sáb", largo: "Sábado" },
  { dia: 7, corto: "Dom", largo: "Domingo" },
] as const;

export type Franja = { dia_semana: number; hora: string; cupos: number };

/** "08:00:00" → "08:00". La base devuelve las columnas `time` con segundos. */
export function horaCorta(hora: string): string {
  return hora.slice(0, 5);
}

export type HoraDisponible = { hora: string; libres: number };

export type DiaDisponible = { fecha: string; horas: HoraDisponible[] };

/** Las filas de `disponibilidad_reservas()`, que ya vienen ordenadas, agrupadas por día. */
export function agruparDisponibilidad(
  filas: { fecha: string; hora: string; libres: number }[],
): DiaDisponible[] {
  const dias: DiaDisponible[] = [];

  for (const fila of filas) {
    const hora = { hora: horaCorta(fila.hora), libres: fila.libres };
    const ultimo = dias[dias.length - 1];

    if (ultimo?.fecha === fila.fecha) ultimo.horas.push(hora);
    else dias.push({ fecha: fila.fecha, horas: [hora] });
  }

  return dias;
}

export type ReservaAgenda = {
  id: string;
  nombre: string;
  telefono: string;
  placa: string | null;
  vehiculo: string;
  tipo_vehiculo: TipoVehiculo;
  motivo: string;
  detalle: string;
  fecha: string;
  hora: string;
  estado: EstadoReserva;
  creado_en: string;
  orden: { id: string; numero: string } | null;
};

/** El motivo como entra a la orden: lo que eligió el cliente y lo que contó. */
export function motivoCompleto(reserva: { motivo: string; detalle: string }): string {
  return reserva.detalle ? `${reserva.motivo}: ${reserva.detalle}` : reserva.motivo;
}
