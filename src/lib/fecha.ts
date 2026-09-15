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

// ---------------------------------------------------------------------------
// Días y horas de reserva
// ---------------------------------------------------------------------------
//
// Las reservas se guardan como `date` y `time` sueltos, sin zona: "el martes a
// las 10" es una hora de reloj de pared en Lima, no un instante. Estas funciones
// traducen entre las dos cosas.
//
// Lo que devuelve texto conviene llamarlo en el servidor y pasarle el resultado
// a la pantalla: el navegador puede traer otra versión de las tablas de idioma,
// escribir "sept." donde el servidor escribió "set." y hacer que React se queje
// al hidratar.

/**
 * Perú no tiene horario de verano (decisión 21), así que la hora de Lima es
 * siempre UTC−5 y se puede escribir fija.
 */
const DESFASE_LIMA = "-05:00";

/** "2026-09-16" y "10:00" → el instante en que son las 10:00 de ese día en Lima. */
export function instanteEnLima(fechaISO: string, hora = "12:00"): Date {
  return new Date(`${fechaISO}T${hora.slice(0, 5)}:00${DESFASE_LIMA}`);
}

/** "2026-09-16" más `dias` días. Aritmética de calendario: no pasa por ninguna zona. */
export function sumarDias(fechaISO: string, dias: number): string {
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia + dias)).toISOString().slice(0, 10);
}

/** "Hoy" o "Mañana" cuando corresponde. */
export function diaRelativo(fechaISO: string, hoyISO: string): "Hoy" | "Mañana" | null {
  if (fechaISO === hoyISO) return "Hoy";
  if (fechaISO === sumarDias(hoyISO, 1)) return "Mañana";
  return null;
}

const SEMANA_CORTA = new Intl.DateTimeFormat(LOCALE, { timeZone: ZONA, weekday: "short" });
const NUMERO_DIA = new Intl.DateTimeFormat(LOCALE, { timeZone: ZONA, day: "numeric" });
const MES_CORTO = new Intl.DateTimeFormat(LOCALE, { timeZone: ZONA, month: "short" });

const DIA_COMPLETO = new Intl.DateTimeFormat(LOCALE, {
  timeZone: ZONA,
  weekday: "long",
  day: "numeric",
  month: "long",
});

/** Las piezas de un día para pintarlo como hoja de calendario: "mié", "16", "set.". */
export function piezasDelDia(fechaISO: string): { semana: string; dia: string; mes: string } {
  const instante = instanteEnLima(fechaISO);
  return {
    semana: SEMANA_CORTA.format(instante).replace(".", ""),
    dia: NUMERO_DIA.format(instante),
    mes: MES_CORTO.format(instante),
  };
}

/** "miércoles 16 de setiembre". Con `mayuscula`, "Miércoles 16 de setiembre". */
export function formatearDia(fechaISO: string, { mayuscula = false } = {}): string {
  const partes = DIA_COMPLETO.formatToParts(instanteEnLima(fechaISO));
  const pieza = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find((parte) => parte.type === tipo)?.value ?? "";

  const texto = `${pieza("weekday")} ${pieza("day")} de ${pieza("month")}`;
  return mayuscula ? texto.charAt(0).toUpperCase() + texto.slice(1) : texto;
}

/** "10:00:00" → "10:00 a. m.". La hora de una franja no trae fecha, así que se le presta una. */
export function formatearHoraFranja(hora: string): string {
  return SOLO_HORA.format(instanteEnLima("2026-01-01", hora));
}
