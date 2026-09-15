import { ArrowSquareOut, CalendarX, Clock, Info } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Suspense } from "react";

import {
  diaRelativo,
  fechaISOLima,
  formatearDia,
  formatearHoraFranja,
  instanteEnLima,
} from "@/lib/fecha";
import { cargarAgenda } from "@/lib/reserva/consultas";
import { puedeRecibirse } from "@/lib/reserva/estados";
import { ETIQUETA_TIPO_VEHICULO, motivoCompleto, type ReservaAgenda } from "@/lib/reserva/modelo";
import { requerirStaff } from "@/lib/sesion";
import { aplicarPlantilla, enlaceWhatsApp, formatearCelular } from "@/lib/whatsapp";

import { Aviso, Seccion } from "../componentes";
import { FilaReserva, type ReservaEnFila } from "./fila";

export const metadata = {
  title: "Agenda",
};

/**
 * La agenda es el futuro; el tablero, el presente (ARQUITECTURA.md §11). El
 * tablero dice qué hay ahora dentro del taller; la agenda, quién dijo que
 * venía.
 *
 * Arriba va lo que quedó sin cerrar de días pasados, porque es lo único que
 * pide una decisión que ya se debió tomar. Después, hoy y lo que sigue.
 */
export default function PaginaAgenda() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Agenda</h1>
        <Link
          href="/admin/agenda/horario"
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-borde-fuerte px-3 py-1.5 text-sm font-medium transition-colors duration-200 hover:border-marca hover:text-marca"
        >
          <Clock size={16} />
          Horario de reservas
        </Link>
      </div>

      <Suspense fallback={<p className="text-sm text-tinta-tenue">Cargando la agenda…</p>}>
        <Contenido />
      </Suspense>
    </div>
  );
}

async function Contenido() {
  await requerirStaff();

  const ahora = new Date();
  const hoy = fechaISOLima(ahora);
  const agenda = await cargarAgenda(hoy);

  if (agenda.error) return <Aviso>No se pudo leer la agenda: {agenda.error}</Aviso>;

  // El texto se arma acá, en el servidor: fechas, horas y el mensaje de
  // WhatsApp de cada reserva. La fila solo decide qué botones mostrar.
  function enFila(reserva: ReservaAgenda, conDia = false): ReservaEnFila {
    const dia = formatearDia(reserva.fecha);
    const hora = formatearHoraFranja(reserva.hora);

    const mensaje = aplicarPlantilla(agenda.plantilla, {
      cliente: reserva.nombre,
      fecha: dia,
      hora,
      taller: agenda.taller.nombre,
      direccion: agenda.taller.direccion,
    });

    return {
      id: reserva.id,
      estado: reserva.estado,
      hora,
      dia: conDia ? formatearDia(reserva.fecha, { mayuscula: true }) : null,
      nombre: reserva.nombre,
      telefono: formatearCelular(reserva.telefono),
      placa: reserva.placa,
      vehiculo: reserva.vehiculo,
      tipo: ETIQUETA_TIPO_VEHICULO[reserva.tipo_vehiculo],
      motivo: motivoCompleto(reserva),
      whatsapp: puedeRecibirse(reserva.estado) ? enlaceWhatsApp(reserva.telefono, mensaje) : null,
      yaPaso: instanteEnLima(reserva.fecha, reserva.hora) <= ahora,
      orden: reserva.orden,
    };
  }

  const porDia = new Map<string, ReservaAgenda[]>();
  for (const reserva of agenda.proximas) {
    porDia.set(reserva.fecha, [...(porDia.get(reserva.fecha) ?? []), reserva]);
  }

  const cerrados = new Map(agenda.cerrados.map((dia) => [dia.fecha, dia.motivo]));

  // Hoy sale siempre, aunque esté vacío: es la pregunta con la que se abre la
  // agenda a primera hora.
  const fechas = [...new Set([hoy, ...porDia.keys(), ...cerrados.keys()])].sort();

  return (
    <div className="flex flex-col gap-8">
      {!agenda.hayHorario ? (
        <Nota>
          Todavía no hay horario de reservas.{" "}
          <Link href="/admin/agenda/horario" className="font-medium text-marca underline underline-offset-4">
            Ármalo acá
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
            className="inline-flex items-center gap-1.5 rounded-lg bg-marca px-3 py-1.5 font-display text-sm font-semibold uppercase tracking-wide text-sobre-marca transition duration-200 ease-salida hover:bg-marca-viva active:translate-y-px"
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
          <Link href="/admin/config#reservas" className="font-medium text-marca underline underline-offset-4">
            Sitio, «Reservas en línea»
          </Link>
          .
        </Nota>
      )}

      {agenda.sinCerrar.length > 0 ? (
        <Seccion titulo="Sin cerrar">
          <p className="text-sm text-tinta-suave">
            Reservas de días pasados que nadie marcó. Ciérralas para que la agenda diga lo que
            pasó.
          </p>
          <Lista reservas={agenda.sinCerrar.map((reserva) => enFila(reserva, true))} />
        </Seccion>
      ) : null}

      {fechas.map((fecha) => {
        const reservas = porDia.get(fecha) ?? [];
        const relativo = diaRelativo(fecha, hoy);
        const motivoCierre = cerrados.get(fecha);
        const porAvisar = reservas.filter((reserva) => puedeRecibirse(reserva.estado)).length;

        return (
          <Seccion
            key={fecha}
            titulo={relativo ? `${relativo} · ${formatearDia(fecha)}` : formatearDia(fecha)}
            accion={
              reservas.length > 0 ? (
                <span className="text-xs text-tinta-tenue">
                  {reservas.length === 1 ? "1 reserva" : `${reservas.length} reservas`}
                </span>
              ) : null
            }
          >
            {motivoCierre !== undefined ? (
              <p className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-borde-fuerte px-3 py-2 text-sm text-tinta-suave">
                <CalendarX size={16} className="text-marca" />
                Cerrado a reservas{motivoCierre ? `: ${motivoCierre}` : ""}.
                {porAvisar > 0 ? " Las de abajo son de antes del cierre: avísales." : null}
              </p>
            ) : null}

            {reservas.length === 0 ? (
              <p className="text-sm text-tinta-tenue">Sin reservas.</p>
            ) : (
              <Lista reservas={reservas.map((reserva) => enFila(reserva))} />
            )}
          </Seccion>
        );
      })}
    </div>
  );
}

function Lista({ reservas }: { reservas: ReservaEnFila[] }) {
  return (
    <ul className="flex flex-col divide-y divide-borde rounded-2xl border border-borde bg-fondo-alto">
      {reservas.map((reserva) => (
        // El estado entra en la `key`: al cambiar, la fila se remonta limpia,
        // sin la pregunta de «¿seguro?» que había quedado abierta.
        <FilaReserva key={`${reserva.id}-${reserva.estado}`} reserva={reserva} />
      ))}
    </ul>
  );
}

function Nota({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex max-w-3xl items-start gap-2.5 rounded-2xl border border-borde bg-fondo-alto px-4 py-3 text-sm text-tinta-suave">
      <Info size={18} weight="duotone" className="mt-px shrink-0 text-marca" />
      <span>{children}</span>
    </p>
  );
}
