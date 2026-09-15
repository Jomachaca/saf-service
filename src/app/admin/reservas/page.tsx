import { Suspense } from "react";

import { fechaISOLima, formatearDia } from "@/lib/fecha";
import { cargarHorario } from "@/lib/reserva/consultas";
import { cargarConfigCompleta } from "@/lib/sitio/panel";
import { requerirStaff } from "@/lib/sesion";

import { Encabezado } from "../componentes";
import { DiasCerrados } from "./dias-cerrados";
import { EditorFranjas } from "./editor";
import { ReservasEnLinea } from "./en-linea";

export const metadata = {
  title: "Reservas",
};

/**
 * Todo lo que configura las reservas por la web, en una pantalla: si se
 * aceptan, a qué horas y cuántas, y qué días no. Antes el interruptor vivía en
 * «Sitio» y los cupos colgaban de la agenda, cada uno con un enlace al otro
 * (decisión 31). Confirmar o cancelar una reserva sigue siendo de la agenda.
 */
export default function PaginaReservas() {
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <Encabezado
        titulo="Reservas"
        descripcion="Si se aceptan reservas por la web, a qué horas y cuántas. Es un tope, no un cálculo de boxes: los vehículos que llegan sin reserva no cuentan acá."
      />

      <Suspense fallback={<p className="text-sm text-tinta-tenue">Cargando las reservas…</p>}>
        <Contenido />
      </Suspense>
    </div>
  );
}

async function Contenido() {
  await requerirStaff();

  const hoy = fechaISOLima(new Date());
  const [config, { franjas, cerrados }] = await Promise.all([
    cargarConfigCompleta(),
    cargarHorario(hoy),
  ]);

  return (
    <>
      {config ? (
        <ReservasEnLinea
          activas={config.reservasActivas}
          dias={config.reservasDias}
          plantilla={config.plantillas.reserva ?? ""}
          hayHorario={franjas.length > 0}
        />
      ) : null}

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
