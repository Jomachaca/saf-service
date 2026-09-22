import Link from "next/link";
import { Suspense } from "react";

import { cargarTablero } from "@/lib/orden/consultas";
import { ETIQUETA_ESTADO, type Estado } from "@/lib/orden/estados";
import { requerirStaff } from "@/lib/sesion";

import { Encabezado, EnlaceOrden, Insignia, Seccion } from "./componentes";
import { ListaOrdenes } from "./lista-ordenes";

export const metadata = {
  title: "Tablero",
};

/**
 * Tablero: presente, no futuro (ARQUITECTURA.md §11). Tres bloques en este
 * orden, porque responden en ese orden las preguntas del taller: cuántos hay,
 * dónde están, y qué le pasa a cada uno.
 */
export default function PaginaTablero() {
  return (
    <div className="flex flex-col gap-8">
      <Encabezado
        titulo="Tablero"
        descripcion="Qué está pasando ahora mismo dentro del taller."
        acciones={
          <Link
            href="/admin/ingreso"
            className="border border-marca bg-marca px-4 py-2.5 font-display text-sm font-semibold tracking-[0.09em] text-white uppercase transition duration-200 ease-salida hover:bg-marca-viva active:translate-y-px"
          >
            Recibir vehículo
          </Link>
        }
      />

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
        <dl className="grid grid-cols-2 gap-px border border-borde bg-borde @xl:grid-cols-4">
          {(Object.keys(contadores) as Estado[])
            .filter((estado) => estado !== "LISTO")
            .map((estado) => (
              <div key={estado} className="flex flex-col gap-1.5 bg-fondo-alto px-4 py-4">
                <dt className="font-display text-[11px] font-semibold tracking-[0.2em] text-tinta-tenue uppercase">
                  {ETIQUETA_ESTADO[estado]}
                </dt>
                <dd className="font-display text-[2.4rem] leading-none font-bold tabular-nums">
                  {contadores[estado]}
                </dd>
              </div>
            ))}
        </dl>
      </Seccion>

      <Seccion titulo="Espacios">
        <ul className="grid grid-cols-2 gap-2.5 @xl:grid-cols-3 @4xl:grid-cols-5">
          {boxes.map((box) => {
            const orden = ocupacion.get(box.id);

            return (
              <li
                key={box.id}
                className={`flex min-h-26 flex-col items-start gap-2 border bg-fondo-alto p-3.5 ${
                  orden ? "border-borde-fuerte" : "border-borde"
                } ${box.activo ? "" : "opacity-40"}`}
              >
                <div className="flex w-full items-baseline justify-between gap-2">
                  <span className="font-display font-bold tracking-[0.06em] uppercase">
                    {box.nombre}
                  </span>
                  <span className="font-display text-[10px] font-semibold tracking-[0.16em] text-tinta-tenue uppercase">
                    {box.tipo}
                  </span>
                </div>

                {orden ? (
                  <>
                    <EnlaceOrden id={orden.id} numero={orden.numero}>
                      <span className="font-mono text-sm">{orden.vehiculo?.placa}</span>
                    </EnlaceOrden>
                    <Insignia estado={orden.estado} />
                  </>
                ) : (
                  <span className="font-display text-sm font-semibold tracking-[0.14em] text-tinta-tenue uppercase">
                    Libre
                  </span>
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
