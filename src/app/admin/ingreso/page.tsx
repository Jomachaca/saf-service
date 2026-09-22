import { Suspense } from "react";

import { diaRelativo, fechaISOLima, formatearDia, formatearHoraFranja } from "@/lib/fecha";
import { cargarBoxes, cargarTablero } from "@/lib/orden/consultas";
import { cargarReserva } from "@/lib/reserva/consultas";
import { ETIQUETA_ESTADO_RESERVA, puedeRecibirse } from "@/lib/reserva/estados";
import { motivoCompleto } from "@/lib/reserva/modelo";
import { requerirStaff } from "@/lib/sesion";
import { formatearCelular } from "@/lib/whatsapp";

import { Encabezado } from "../componentes";
import { FormularioIngreso, type ReservaEnRecepcion } from "./formulario";

export const metadata = {
  title: "Recepción",
};

type ParametrosBusqueda = PageProps<"/admin/ingreso">["searchParams"];

export default function PaginaIngreso({ searchParams }: PageProps<"/admin/ingreso">) {
  return (
    <div className="flex flex-col gap-6">
      <Encabezado
        seccion="Panel · en menos de un minuto"
        titulo="Recepción"
        descripcion="Busca el vehículo por placa, teléfono o nombre. Si ya vino antes, quedan cuatro campos."
      />

      <Suspense fallback={<p className="text-sm text-tinta-tenue">Cargando…</p>}>
        <Contenido searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

/**
 * `searchParams` se resuelve acá adentro y no en la página, por lo mismo que
 * `params` en el detalle de orden: esperarlo arriba impide prerenderizar el
 * armazón (decisión 22).
 */
async function Contenido({ searchParams }: { searchParams: ParametrosBusqueda }) {
  await requerirStaff();

  const { reserva: idReserva } = await searchParams;

  const [boxes, { ocupacion }, reserva] = await Promise.all([
    cargarBoxes(),
    cargarTablero(),
    typeof idReserva === "string" ? cargarReserva(idReserva) : null,
  ]);

  const boxesLibres = boxes
    .filter((box) => !ocupacion.has(box.id))
    .map((box) => box.id);

  // Desde la agenda llega el id de la reserva (decisión 28). Si ya se cerró, no
  // se ofrece: la base la rechazaría al guardar, después de llenarlo todo.
  const recibible = reserva && puedeRecibirse(reserva.estado) ? reserva : null;
  const hoy = fechaISOLima(new Date());

  const enRecepcion: ReservaEnRecepcion | null = recibible
    ? {
        id: recibible.id,
        nombre: recibible.nombre,
        telefono: formatearCelular(recibible.telefono),
        placa: recibible.placa,
        vehiculo: recibible.vehiculo,
        tipo: recibible.tipo_vehiculo,
        motivo: motivoCompleto(recibible),
        cuando: `${
          diaRelativo(recibible.fecha, hoy) ?? formatearDia(recibible.fecha, { mayuscula: true })
        }, ${formatearHoraFranja(recibible.hora)}`,
      }
    : null;

  return (
    <>
      {reserva && !recibible ? (
        <p className="max-w-[54rem] border border-borde-fuerte bg-fondo-hondo px-4 py-3 text-sm text-tinta-suave">
          La reserva de {reserva.nombre} ya figura como «{ETIQUETA_ESTADO_RESERVA[reserva.estado]}».
          Se puede recibir el vehículo igual, sin reserva.
        </p>
      ) : null}

      <FormularioIngreso
        key={enRecepcion?.id ?? "sin-reserva"}
        boxes={boxes}
        boxesLibres={boxesLibres}
        reserva={enRecepcion}
      />
    </>
  );
}
