import { Engine, Gauge, PaintRoller, Wrench } from "@phosphor-icons/react/dist/ssr";

import type { ServicioPublico } from "@/lib/sitio/contenido";
import { CATEGORIAS, ETIQUETA_CATEGORIA } from "@/lib/orden/presupuesto";

import { Seccion } from "./piezas";

const ICONO_CATEGORIA = {
  MANTENIMIENTO: Wrench,
  REPARACION: Engine,
  CARROCERIA: PaintRoller,
  ESPECIALIZADO: Gauge,
} as const;

/**
 * Cuatro tonos, dos de marca y dos neutros, para que la retícula tenga peso
 * visual distinto sin usar cuatro colores distintos.
 */
const TONOS = [
  {
    caja: "bg-marino-800 text-white dark:bg-marino-600",
    pildora: "border-white/25 text-white/85",
    icono: "text-marino-200",
  },
  {
    caja: "bg-fondo-alto border border-borde",
    pildora: "border-borde text-tinta-suave",
    icono: "text-marca",
  },
  {
    caja: "bg-fondo-alto border border-borde",
    pildora: "border-borde text-tinta-suave",
    icono: "text-marca",
  },
  {
    caja: "bg-vino-700 text-white dark:bg-vino-600",
    pildora: "border-white/25 text-white/85",
    icono: "text-vino-200",
  },
] as const;

/**
 * Anchos por cantidad de categorías con servicios activos.
 *
 * La retícula es de cinco columnas y cada fila tiene que sumar cinco: si el
 * taller apaga una categoría entera desde el catálogo, la fila se recompone en
 * vez de dejar un hueco.
 */
const ANCHOS: Record<number, string[]> = {
  1: ["md:col-span-5"],
  2: ["md:col-span-3", "md:col-span-2"],
  3: ["md:col-span-3", "md:col-span-2", "md:col-span-5"],
  4: ["md:col-span-3", "md:col-span-2", "md:col-span-2", "md:col-span-3"],
};

export function Servicios({ servicios }: { servicios: ServicioPublico[] }) {
  const grupos = CATEGORIAS.map((categoria) => ({
    categoria,
    servicios: servicios.filter((servicio) => servicio.categoria === categoria),
  })).filter((grupo) => grupo.servicios.length > 0);

  if (grupos.length === 0) return null;

  const anchos = ANCHOS[grupos.length] ?? grupos.map(() => "md:col-span-5");

  return (
    <Seccion
      id="servicios"
      titulo="Servicios"
      bajada="Trabajamos unidades livianas y pesadas. Si no sabes qué tiene, lo diagnosticamos primero."
    >
      <div className="grid gap-4 md:grid-cols-5">
        {grupos.map((grupo, indice) => {
          const Icono = ICONO_CATEGORIA[grupo.categoria];
          const tono = TONOS[indice % TONOS.length];

          return (
            <article
              key={grupo.categoria}
              className={`al-entrar flex flex-col gap-5 rounded-2xl p-6 md:p-8 ${anchos[indice]} ${tono.caja}`}
            >
              <Icono size={32} weight="duotone" className={tono.icono} />

              <h3 className="font-display text-2xl font-bold uppercase tracking-tight">
                {ETIQUETA_CATEGORIA[grupo.categoria]}
              </h3>

              <ul className="mt-auto flex flex-wrap gap-2">
                {grupo.servicios.map((servicio) => (
                  <li
                    key={servicio.id}
                    className={`rounded-full border px-3 py-1 text-sm ${tono.pildora}`}
                  >
                    {servicio.nombre}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </Seccion>
  );
}
