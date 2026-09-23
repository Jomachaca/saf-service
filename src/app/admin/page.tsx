import { SlidersHorizontal } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Suspense } from "react";

import { cargarTablero } from "@/lib/orden/consultas";
import { ETIQUETA_TIPO_ESPACIO } from "@/lib/orden/espacio";
import { ETIQUETA_ESTADO, type Estado } from "@/lib/orden/estados";
import { requerirStaff } from "@/lib/sesion";

import { Esquinas } from "../plano";
import {
  COLOR_ESTADO,
  Encabezado,
  EnlaceOrden,
  Insignia,
  SOBRE_COLOR_ESTADO,
  Seccion,
} from "./componentes";
import { ListaOrdenes } from "./lista-ordenes";

export const metadata = {
  title: "Tablero",
};

/** Los cuatro estados que ocupan el taller. «Listo» ya no está pasando nada. */
const EN_CURSO: Estado[] = [
  "RECIBIDO",
  "DIAGNOSTICO",
  "ESPERANDO_APROBACION",
  "EN_TRABAJO",
];

/**
 * Tablero: presente, no futuro (ARQUITECTURA.md §11). Tres bloques en este
 * orden, porque responden en ese orden las preguntas del taller: cuántos hay,
 * dónde están, y qué le pasa a cada uno.
 */
export default function PaginaTablero() {
  return (
    <div className="flex flex-col gap-9">
      <Encabezado
        seccion="Panel · ahora mismo"
        titulo="Tablero"
        descripcion="Qué está pasando ahora mismo dentro del taller."
        acciones={
          <Link
            href="/admin/ingreso"
            className="relative inline-flex items-center gap-2.5 border border-marca bg-marca px-5 py-3.5 font-display text-[15px] font-bold tracking-[0.09em] text-white uppercase transition duration-200 ease-salida hover:bg-marca-viva active:translate-y-px"
          >
            Recibir vehículo
            <Esquinas className="text-vino-300" />
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

  const { espacios, activas, ocupacion, contadores } = await cargarTablero();
  const ahora = new Date();
  const nombresDeEspacio = Object.fromEntries(espacios.map((uno) => [uno.id, uno.nombre]));

  const tuberia = EN_CURSO.map((estado) => ({
    estado,
    n: contadores[estado] ?? 0,
  }));
  const enTaller = tuberia.reduce((suma, tramo) => suma + tramo.n, 0);

  // Los huecos, no los espacios vacíos: un patio con cupo para seis y dos autos
  // adentro tiene cuatro huecos, y eso es lo que se pregunta al recibir.
  const sitios = espacios
    .filter((espacio) => espacio.activo)
    .reduce((suma, espacio) => suma + espacio.capacidad, 0);
  const tomados = espacios
    .filter((espacio) => espacio.activo)
    .reduce((suma, espacio) => suma + (ocupacion.get(espacio.id)?.length ?? 0), 0);
  const huecos = sitios - tomados;

  return (
    <>
      {/*
        La barra de proporción. Cada tramo mide lo que pesa su estado, así que
        de un vistazo se ve si el taller está trabajando o esperando respuestas:
        un bloque granate ancho es producción, uno rosado ancho es plata parada.
      */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3.5 gap-y-1">
          <h2 className="font-display text-xl font-bold tracking-[0.06em] uppercase">
            En el taller
          </h2>
          <span className="font-mono text-xs text-tinta-tenue">
            {enTaller === 1 ? "1 vehículo" : `${enTaller} vehículos`}
            {sitios > 0 ? ` · ${tomados} de ${sitios} sitios ocupados` : ""}
          </span>
        </div>

        {enTaller > 0 ? (
          <div className="flex h-8.5 w-full overflow-hidden border border-borde-fuerte">
            {tuberia
              .filter((tramo) => tramo.n > 0)
              .map((tramo, indice) => (
                <div
                  key={tramo.estado}
                  title={`${ETIQUETA_ESTADO[tramo.estado]}: ${tramo.n}`}
                  style={{ flex: `${tramo.n} 0 0` }}
                  className={`grid place-items-center font-display text-[15px] font-bold tabular-nums ${
                    COLOR_ESTADO[tramo.estado]
                  } ${SOBRE_COLOR_ESTADO[tramo.estado]} ${
                    indice > 0 ? "border-l border-fondo" : ""
                  }`}
                >
                  {tramo.n}
                </div>
              ))}
          </div>
        ) : null}

        <dl className="grid grid-cols-2 border-t border-borde @2xl:grid-cols-4">
          {tuberia.map((tramo, indice) => (
            <div
              key={tramo.estado}
              className={`flex items-center gap-3 py-3.5 pr-4 ${
                indice > 0 ? "border-borde @2xl:border-l @2xl:pl-4" : ""
              } ${indice > 1 ? "border-t border-borde @2xl:border-t-0" : ""}`}
            >
              <span
                aria-hidden
                className={`size-2.75 shrink-0 ${COLOR_ESTADO[tramo.estado]}`}
              />
              <div className="flex flex-col">
                <dd className="font-display text-[26px] leading-none font-bold tabular-nums">
                  {tramo.n}
                </dd>
                <dt className="font-display text-[11px] font-semibold tracking-[0.16em] text-tinta-tenue uppercase">
                  {ETIQUETA_ESTADO[tramo.estado]}
                </dt>
              </div>
            </div>
          ))}
        </dl>
      </section>

      {/*
        Los espacios. El que está vacío va con filete punteado y no lleno: es un
        hueco, y un hueco se dibuja distinto de una caja con algo adentro.
      */}
      <Seccion
        titulo="Espacios"
        conteo={sitios === 0 ? undefined : huecos === 1 ? "1 hueco" : `${huecos} huecos`}
        accion={
          <Link
            href="/admin/espacios"
            className="inline-flex items-center gap-1.5 font-display text-[11px] font-semibold tracking-[0.14em] text-tinta-tenue uppercase transition-colors duration-200 hover:text-marca"
          >
            <SlidersHorizontal size={13} />
            Configurar
          </Link>
        }
      >
        {espacios.length === 0 ? (
          <p className="border border-dashed border-borde-fuerte px-4 py-6 text-center text-sm text-tinta-suave">
            Todavía no hay espacios configurados, y no pasa nada: los vehículos figuran «en el
            taller» sin sitio asignado.{" "}
            <Link href="/admin/espacios" className="font-medium text-marca underline underline-offset-4">
              Créalos en Espacios
            </Link>{" "}
            si quieres saber dónde está cada uno.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3.5 @2xl:grid-cols-3 @4xl:grid-cols-4">
            {espacios.map((espacio) => {
              const dentro = ocupacion.get(espacio.id) ?? [];
              const vacio = dentro.length === 0;

              return (
                <li
                  key={espacio.id}
                  className={`flex flex-col gap-2 border bg-fondo-alto p-4 ${
                    vacio ? "border-dashed border-borde-fuerte" : "border-borde-fuerte"
                  } ${espacio.activo ? "" : "opacity-40"}`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-display text-[17px] font-bold tracking-[0.08em] uppercase">
                      {espacio.nombre}
                    </span>
                    <span className="font-mono text-[11px] tracking-[0.1em] text-tinta-tenue tabular-nums">
                      {dentro.length}/{espacio.capacidad}
                    </span>
                  </div>

                  {vacio ? (
                    <>
                      <span className="font-display text-lg font-bold tracking-[0.1em] text-tinta-tenue uppercase">
                        Libre
                      </span>
                      <span className="text-[13px] text-tinta-tenue">
                        {ETIQUETA_TIPO_ESPACIO[espacio.tipo]}
                      </span>
                    </>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {dentro.map((orden) => (
                        <li key={orden.id} className="flex flex-col gap-1">
                          <EnlaceOrden id={orden.id} numero={orden.numero}>
                            <span className="font-mono text-lg font-medium">
                              {orden.vehiculo?.placa}
                            </span>
                          </EnlaceOrden>
                          <Insignia estado={orden.estado} />
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Seccion>

      {/* El encabezado de esta sección lo pone la propia lista: su conteo
          cambia con el filtro, y el filtro vive del lado del cliente. */}
      <ListaOrdenes
        ordenes={activas}
        nombresDeEspacio={nombresDeEspacio}
        ahora={ahora.toISOString()}
      />
    </>
  );
}
