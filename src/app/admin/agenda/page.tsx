import {
  ArrowSquareOut,
  CalendarBlank,
  CaretLeft,
  CaretRight,
  Clock,
  Info,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Suspense } from "react";

import {
  diaRelativo,
  diaSemanaISO,
  fechaISOLima,
  formatearDia,
  formatearFechaHora,
  formatearHoraFranja,
  instanteEnLima,
  lunesDe,
  piezasDelDia,
  sumarDias,
} from "@/lib/fecha";
import { cargarAgenda } from "@/lib/reserva/consultas";
import { puedeRecibirse } from "@/lib/reserva/estados";
import {
  ETIQUETA_TIPO_VEHICULO,
  horaCorta,
  motivoCompleto,
  type ReservaAgenda,
} from "@/lib/reserva/modelo";
import { requerirStaff } from "@/lib/sesion";
import { aplicarPlantilla, enlaceWhatsApp, formatearCelular } from "@/lib/whatsapp";

import { Aviso, Encabezado } from "../componentes";
import type { DiaVista, ReservaVista } from "./modelo";
import { VistaAgenda } from "./vista";

export const metadata = {
  title: "Agenda",
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/**
 * La agenda es el futuro; el tablero, el presente (ARQUITECTURA.md §11). El
 * tablero dice qué hay ahora mismo dentro del taller; la agenda, quién dijo que
 * venía.
 *
 * Se mira por semanas completas, de lunes a domingo, como un calendario: las
 * horas del horario son las filas y cada día una columna. La semana viaja en la
 * dirección (`?desde=`) y no en el estado del navegador, así que la flecha de
 * «atrás» funciona y una semana se puede dejar abierta en otra pestaña.
 *
 * Arriba de todo va lo que quedó sin cerrar de días pasados, se mire la semana
 * que se mire: es lo único que pide una decisión que ya se debió tomar.
 */
export default function PaginaAgenda(props: PageProps<"/admin/agenda">) {
  return (
    <div className="flex flex-col gap-8">
      <Encabezado
        seccion="Panel · lo que viene"
        titulo="Agenda"
        descripcion="Quién dijo que venía: lo que quedó sin cerrar, hoy y lo que sigue."
        acciones={
          <Link
            href="/admin/reservas"
            className="inline-flex items-center gap-2 border border-borde-fuerte px-4 py-2.75 font-display text-sm font-semibold tracking-[0.09em] uppercase transition duration-200 ease-salida hover:bg-tinta/6 active:translate-y-px"
          >
            <Clock size={16} />
            Horario y cupos
          </Link>
        }
      />

      <Suspense fallback={<p className="text-sm text-tinta-tenue">Cargando la agenda…</p>}>
        <Contenido searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Contenido({
  searchParams,
}: {
  searchParams: PageProps<"/admin/agenda">["searchParams"];
}) {
  await requerirStaff();

  const { desde } = await searchParams;

  const ahora = new Date();
  const hoy = fechaISOLima(ahora);

  // Cualquier cosa que no sea una fecha vuelve a hoy. `desde` llega de la
  // dirección, así que lo escribe cualquiera.
  const pedido = typeof desde === "string" && ISO.test(desde) ? desde : hoy;
  const lunes = lunesDe(pedido);
  const domingo = sumarDias(lunes, 6);

  const agenda = await cargarAgenda(hoy, lunes, domingo);

  if (agenda.error) return <Aviso>No se pudo leer la agenda: {agenda.error}</Aviso>;

  // El texto se arma acá, en el servidor: fechas, horas y el mensaje de
  // WhatsApp de cada reserva. Las pantallas solo muestran y abren.
  function enVista(reserva: ReservaAgenda): ReservaVista {
    const hora = formatearHoraFranja(reserva.hora);

    const mensaje = aplicarPlantilla(agenda.plantilla, {
      cliente: reserva.nombre,
      fecha: formatearDia(reserva.fecha),
      hora,
      taller: agenda.taller.nombre,
      direccion: agenda.taller.direccion,
    });

    return {
      id: reserva.id,
      estado: reserva.estado,
      clave: horaCorta(reserva.hora),
      hora,
      fecha: reserva.fecha,
      dia: formatearDia(reserva.fecha, { mayuscula: true }),
      nombre: reserva.nombre,
      telefono: formatearCelular(reserva.telefono),
      placa: reserva.placa,
      vehiculo: reserva.vehiculo,
      tipo: ETIQUETA_TIPO_VEHICULO[reserva.tipo_vehiculo],
      motivo: motivoCompleto(reserva),
      reservadaEn: formatearFechaHora(reserva.creado_en),
      whatsapp: puedeRecibirse(reserva.estado) ? enlaceWhatsApp(reserva.telefono, mensaje) : null,
      yaPaso: instanteEnLima(reserva.fecha, reserva.hora) <= ahora,
      orden: reserva.orden,
    };
  }

  // Las filas son las horas del horario más las de las reservas que ya están
  // tomadas. Las segundas importan: si el taller cambia el horario, una reserva
  // vieja puede caer en una hora que ya no se ofrece, y tiene que verse igual.
  const claves = new Set<string>();
  for (const franja of agenda.franjas) claves.add(horaCorta(franja.hora));
  for (const reserva of agenda.semana) claves.add(horaCorta(reserva.hora));

  const horas = [...claves].sort();

  const abiertas = new Map<number, string[]>();
  for (const franja of agenda.franjas) {
    const dia = franja.dia_semana;
    abiertas.set(dia, [...(abiertas.get(dia) ?? []), horaCorta(franja.hora)]);
  }

  const cerrados = new Map(agenda.cerrados.map((dia) => [dia.fecha, dia.motivo]));

  const dias: DiaVista[] = Array.from({ length: 7 }, (_, paso) => {
    const fecha = sumarDias(lunes, paso);
    const piezas = piezasDelDia(fecha);

    return {
      fecha,
      semana: piezas.semana,
      numero: piezas.dia,
      mes: piezas.mes,
      largo: formatearDia(fecha, { mayuscula: true }),
      relativo: diaRelativo(fecha, hoy),
      esHoy: fecha === hoy,
      pasado: fecha < hoy,
      // Cerrado sin motivo es la cadena vacía, y `??` la deja pasar: solo
      // convierte el «no está en la lista», que es lo que acá significa abierto.
      cerrado: cerrados.get(fecha) ?? null,
      abiertas: abiertas.get(diaSemanaISO(fecha)) ?? [],
      reservas: agenda.semana.filter((reserva) => reserva.fecha === fecha).map(enVista),
    };
  });

  const enSemana = agenda.semana.length;

  // Lo que quedó sin cerrar y cae dentro de la semana que se está mirando ya
  // está en su casilla: repetirlo arriba sería la misma reserva dos veces en la
  // misma pantalla. El recordatorio es para lo que no se ve.
  const sinCerrar = agenda.sinCerrar.filter(
    (reserva) => reserva.fecha < lunes || reserva.fecha > domingo,
  );

  return (
    <div className="flex flex-col gap-7">
      {!agenda.hayHorario ? (
        <Nota>
          Todavía no hay horario de reservas.{" "}
          <Link href="/admin/reservas" className="font-medium text-marca underline underline-offset-4">
            Ármalo en Reservas
          </Link>
          : sin horario, el formulario no tiene ninguna hora para ofrecer.
        </Nota>
      ) : null}

      {agenda.activas ? (
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/reservar"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-marca bg-marca px-4 py-2.75 font-display text-sm font-bold tracking-[0.09em] text-white uppercase transition duration-200 ease-salida hover:bg-marca-viva active:translate-y-px"
          >
            Nueva reserva
            <ArrowSquareOut size={16} />
          </a>
          <p className="text-sm text-tinta-suave">
            Para quien llama: se reserva con el mismo formulario de la web, así respeta los cupos.
          </p>
        </div>
      ) : (
        <Nota>
          Las reservas por la web están apagadas. Se encienden en{" "}
          <Link href="/admin/reservas" className="font-medium text-marca underline underline-offset-4">
            Reservas
          </Link>
          .
        </Nota>
      )}

      <Semana lunes={lunes} domingo={domingo} hoy={hoy} reservas={enSemana} />

      <VistaAgenda dias={dias} horas={horas} sinCerrar={sinCerrar.map(enVista)} />
    </div>
  );
}

/**
 * La barra de la semana: dónde estoy y cómo me muevo. Son enlaces y no botones
 * porque cambiar de semana es cambiar de dirección, no de estado.
 */
function Semana({
  lunes,
  domingo,
  hoy,
  reservas,
}: {
  lunes: string;
  domingo: string;
  hoy: string;
  reservas: number;
}) {
  const desde = piezasDelDia(lunes);
  const hasta = piezasDelDia(domingo);

  // Dentro del mismo mes el mes se dice una vez: «22 — 28 set.».
  const rango =
    desde.mes === hasta.mes
      ? `${desde.dia} — ${hasta.dia} ${hasta.mes}`
      : `${desde.dia} ${desde.mes} — ${hasta.dia} ${hasta.mes}`;

  const salto =
    "inline-flex items-center justify-center border border-borde-fuerte p-2 transition duration-200 ease-salida hover:border-marca hover:text-marca active:translate-y-px";

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-borde-fuerte pb-3">
      <div className="flex items-center gap-1.5">
        <Link href={`/admin/agenda?desde=${sumarDias(lunes, -7)}`} aria-label="Semana anterior" className={salto}>
          <CaretLeft size={16} />
        </Link>
        <Link href={`/admin/agenda?desde=${sumarDias(lunes, 7)}`} aria-label="Semana siguiente" className={salto}>
          <CaretRight size={16} />
        </Link>
      </div>

      <h2 className="font-display text-xl font-bold tracking-[0.06em] uppercase">{rango}</h2>

      <span className="font-mono text-xs text-tinta-tenue">
        {reservas === 1 ? "1 reserva" : `${reservas} reservas`}
      </span>

      {lunesDe(hoy) !== lunes ? (
        <Link
          href="/admin/agenda"
          className="ms-auto inline-flex items-center gap-2 border border-borde-fuerte px-3 py-1.5 font-display text-xs font-semibold tracking-[0.12em] uppercase transition duration-200 ease-salida hover:border-marca hover:text-marca active:translate-y-px"
        >
          <CalendarBlank size={14} />
          Esta semana
        </Link>
      ) : null}
    </div>
  );
}

function Nota({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex max-w-3xl items-start gap-2.5 border border-borde bg-fondo-alto px-4 py-3 text-sm text-tinta-suave">
      <Info size={18} weight="duotone" className="mt-px shrink-0 text-marca" />
      <span>{children}</span>
    </p>
  );
}
