import Link from "next/link";
import { Suspense } from "react";

import { fechaISOLima, formatearDia } from "@/lib/fecha";
import { cargarHorario } from "@/lib/reserva/consultas";
import { requerirStaff } from "@/lib/sesion";

import { DiasCerrados } from "./dias-cerrados";
import { EditorFranjas } from "./editor";

export const metadata = {
  title: "Horario de reservas",
};

export default function PaginaHorario() {
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/admin/agenda"
          className="text-sm text-tinta-tenue underline-offset-4 hover:underline"
        >
          ← Agenda
        </Link>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight">
          Horario de reservas
        </h1>
        <p className="max-w-2xl text-sm text-tinta-suave">
          Cuántos vehículos se aceptan por reserva a cada hora de la semana. Es un tope, no un
          cálculo de boxes (decisión 4): los que llegan sin reserva no cuentan acá. Los cambios
          valen desde que guardas, sin publicar.
        </p>
      </div>

      <Suspense fallback={<p className="text-sm text-tinta-tenue">Cargando el horario…</p>}>
        <Contenido />
      </Suspense>
    </div>
  );
}

async function Contenido() {
  await requerirStaff();

  const hoy = fechaISOLima(new Date());
  const { franjas, cerrados } = await cargarHorario(hoy);

  return (
    <>
      <EditorFranjas franjas={franjas} />
      <DiasCerrados
        hoy={hoy}
        cerrados={cerrados.map((dia) => ({
          ...dia,
          etiqueta: formatearDia(dia.fecha, { mayuscula: true }),
        }))}
      />
    </>
  );
}
