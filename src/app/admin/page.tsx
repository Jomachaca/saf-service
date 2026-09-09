import Link from "next/link";
import { Suspense } from "react";

import { cargarTablero } from "@/lib/orden/consultas";
import { ETIQUETA_ESTADO, type Estado } from "@/lib/orden/estados";
import { requerirStaff } from "@/lib/sesion";

import { EnlaceOrden, Insignia, Seccion } from "./componentes";
import { ListaOrdenes } from "./lista-ordenes";

export const metadata = {
  title: "Tablero · SAF Service",
};

/**
 * Tablero: presente, no futuro (ARQUITECTURA.md §11). Tres bloques en este
 * orden, porque responden en ese orden las preguntas del taller: cuántos hay,
 * dónde están, y qué le pasa a cada uno.
 */
export default function PaginaTablero() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Tablero</h1>
        <Link
          href="/admin/ingreso"
          className="rounded-lg bg-marca px-4 py-2 font-display text-sm font-semibold uppercase tracking-wide text-sobre-marca transition duration-200 ease-salida hover:bg-marca-viva active:translate-y-px"
        >
          Recibir vehículo
        </Link>
      </div>

      <Suspense fallback={<Cargando />}>
        <Contenido />
      </Suspense>
    </div>
  );
}

function Cargando() {
  return <p className="text-sm text-tinta-tenue">Cargando el taller…</p>;
}

async function Contenido() {
  await requerirStaff();

  const { boxes, activas, ocupacion, contadores } = await cargarTablero();
  const ahora = new Date();
  const nombresDeBox = Object.fromEntries(boxes.map((box) => [box.id, box.nombre]));

  return (
    <>
      <Seccion titulo="Resumen">
        <dl className="flex flex-wrap gap-2">
          {(Object.keys(contadores) as Estado[])
            .filter((estado) => estado !== "LISTO")
            .map((estado) => (
              <div
                key={estado}
                className="flex min-w-28 flex-col gap-1 rounded-lg border border-borde bg-fondo-alto px-3 py-2"
              >
                <dt className="text-xs text-tinta-tenue">{ETIQUETA_ESTADO[estado]}</dt>
                <dd className="text-xl font-semibold tabular-nums">
                  {contadores[estado]}
                </dd>
              </div>
            ))}
        </dl>
      </Seccion>

      <Seccion titulo="Espacios">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {boxes.map((box) => {
            const orden = ocupacion.get(box.id);

            return (
              <li
                key={box.id}
                className={`flex flex-col items-start gap-1.5 rounded-lg border p-3 ${
                  orden
                    ? "border-borde-fuerte bg-fondo-alto"
                    : "border-dashed border-borde"
                } ${box.activo ? "" : "opacity-40"}`}
              >
                <div className="flex w-full items-baseline justify-between gap-2">
                  <span className="text-sm font-medium">{box.nombre}</span>
                  <span className="text-xs text-tinta-tenue">{box.tipo}</span>
                </div>

                {orden ? (
                  <>
                    <EnlaceOrden id={orden.id} numero={orden.numero}>
                      <span className="font-mono text-sm">{orden.vehiculo?.placa}</span>
                    </EnlaceOrden>
                    <Insignia estado={orden.estado} />
                  </>
                ) : (
                  <span className="text-sm text-tinta-tenue">Libre</span>
                )}
              </li>
            );
          })}
        </ul>
      </Seccion>

      <Seccion titulo="Órdenes activas">
        <ListaOrdenes
          ordenes={activas}
          nombresDeBox={nombresDeBox}
          ahora={ahora.toISOString()}
        />
      </Seccion>
    </>
  );
}
