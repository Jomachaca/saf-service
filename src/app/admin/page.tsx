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
        <h1 className="text-lg font-semibold">Tablero</h1>
        <Link
          href="/admin/ingreso"
          className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background"
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
  return <p className="text-sm opacity-40">Cargando el taller…</p>;
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
                className="flex min-w-28 flex-col gap-1 rounded-lg border border-black/10 px-3 py-2 dark:border-white/15"
              >
                <dt className="text-xs opacity-60">{ETIQUETA_ESTADO[estado]}</dt>
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
                className={`flex flex-col gap-1.5 rounded-lg border p-3 ${
                  orden
                    ? "border-black/20 dark:border-white/25"
                    : "border-dashed border-black/15 dark:border-white/15"
                } ${box.activo ? "" : "opacity-40"}`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium">{box.nombre}</span>
                  <span className="text-xs opacity-50">{box.tipo}</span>
                </div>

                {orden ? (
                  <>
                    <EnlaceOrden id={orden.id} numero={orden.numero}>
                      <span className="font-mono text-sm">{orden.vehiculo?.placa}</span>
                    </EnlaceOrden>
                    <Insignia estado={orden.estado} />
                  </>
                ) : (
                  <span className="text-sm opacity-40">Libre</span>
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
