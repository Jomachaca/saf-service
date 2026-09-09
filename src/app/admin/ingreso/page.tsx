import { Suspense } from "react";

import { cargarBoxes, cargarTablero } from "@/lib/orden/consultas";
import { requerirStaff } from "@/lib/sesion";

import { FormularioIngreso } from "./formulario";

export const metadata = {
  title: "Recepción · SAF Service",
};

export default function PaginaIngreso() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Recibir vehículo</h1>
        <p className="mt-1 text-sm text-tinta-suave">
          Busca por placa o teléfono. Si el vehículo ya vino antes, quedan cuatro
          campos.
        </p>
      </div>

      <Suspense fallback={<p className="text-sm text-tinta-tenue">Cargando…</p>}>
        <Contenido />
      </Suspense>
    </div>
  );
}

async function Contenido() {
  await requerirStaff();

  const [boxes, { ocupacion }] = await Promise.all([cargarBoxes(), cargarTablero()]);
  const boxesLibres = boxes
    .filter((box) => !ocupacion.has(box.id))
    .map((box) => box.id);

  return <FormularioIngreso boxes={boxes} boxesLibres={boxesLibres} />;
}
