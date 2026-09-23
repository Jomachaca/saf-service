/**
 * Lo que la agenda le pasa a sus pantallas.
 *
 * Todo el texto viene armado desde el servidor (`page.tsx`): fechas, horas y el
 * mensaje de WhatsApp. La cuadrícula y la lámina de detalle son componentes de
 * cliente y no formatean nada, por la razón de siempre —el navegador puede
 * escribir «sept.» donde el servidor escribió «set.» y romper la hidratación—,
 * así que este módulo es de tipos y no importa nada del servidor.
 */

import type { EstadoReserva } from "@/lib/reserva/estados";

export type ReservaVista = {
  id: string;
  estado: EstadoReserva;
  /** «09:00»: la fila de la cuadrícula en la que cae. */
  clave: string;
  /** «9:00 a. m.» */
  hora: string;
  /** La fecha en ISO, para agrupar por columna. */
  fecha: string;
  /** «Miércoles 23 de setiembre» */
  dia: string;
  nombre: string;
  telefono: string;
  placa: string | null;
  vehiculo: string;
  tipo: string;
  motivo: string;
  /** Cuándo la pidió el cliente. */
  reservadaEn: string;
  whatsapp: string | null;
  yaPaso: boolean;
  orden: { id: string; numero: string } | null;
};

/** Una columna: un día de la semana que se está mirando. */
export type DiaVista = {
  fecha: string;
  /** «mié» */
  semana: string;
  /** «23» */
  numero: string;
  /** «set.» */
  mes: string;
  /** «Miércoles 23 de setiembre» */
  largo: string;
  relativo: "Hoy" | "Mañana" | null;
  esHoy: boolean;
  pasado: boolean;
  /**
   * El motivo del cierre, o `null` si el día está abierto. Ojo: cerrado sin
   * motivo es la cadena vacía, que es falsa; la pregunta es `!== null`.
   */
  cerrado: string | null;
  /** Las horas en que el taller atiende ese día, según el horario. */
  abiertas: string[];
  reservas: ReservaVista[];
};
