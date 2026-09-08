/**
 * Fechas. Se guardan en UTC (`timestamptz`) y se formatean en America/Lima al
 * mostrar (decisión 21). Ninguna vista llama a `toLocaleString` por su cuenta.
 *
 * Las funciones que necesitan "ahora" lo reciben como argumento en vez de leer
 * el reloj: así siguen siendo puras y no rompen el prerenderizado de las páginas
 * cacheadas (decisión 22).
 */

export const ZONA = "America/Lima";
export const LOCALE = "es-PE";

const FECHA_HORA = new Intl.DateTimeFormat(LOCALE, {
  timeZone: ZONA,
  dateStyle: "short",
  timeStyle: "short",
});

const SOLO_FECHA = new Intl.DateTimeFormat(LOCALE, {
  timeZone: ZONA,
  dateStyle: "medium",
});

const SOLO_HORA = new Intl.DateTimeFormat(LOCALE, {
  timeZone: ZONA,
  timeStyle: "short",
});

function aFecha(valor: Date | string): Date {
  return valor instanceof Date ? valor : new Date(valor);
}

export function formatearFechaHora(valor: Date | string): string {
  return FECHA_HORA.format(aFecha(valor));
}

export function formatearFecha(valor: Date | string): string {
  return SOLO_FECHA.format(aFecha(valor));
}

export function formatearHora(valor: Date | string): string {
  return SOLO_HORA.format(aFecha(valor));
}

/**
 * Cuánto lleva el vehículo en el taller, para el tablero: "3 h 12 min".
 * Recibe `ahora` explícitamente; ver la nota de arriba sobre pureza.
 */
export function tiempoTranscurrido(desde: Date | string, ahora: Date): string {
  const minutosTotales = Math.max(
    0,
    Math.floor((ahora.getTime() - aFecha(desde).getTime()) / 60_000),
  );

  if (minutosTotales < 60) return `${minutosTotales} min`;

  const horas = Math.floor(minutosTotales / 60);
  const minutos = minutosTotales % 60;

  if (horas < 24) return minutos === 0 ? `${horas} h` : `${horas} h ${minutos} min`;

  const dias = Math.floor(horas / 24);
  const restoHoras = horas % 24;
  return restoHoras === 0 ? `${dias} d` : `${dias} d ${restoHoras} h`;
}

/** Fecha en formato `YYYY-MM-DD` según el calendario de Lima, para columnas `date`. */
export function fechaISOLima(valor: Date | string): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(aFecha(valor));
  return partes;
}
