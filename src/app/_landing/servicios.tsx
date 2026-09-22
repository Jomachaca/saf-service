import { Engine, Gauge, PaintRoller, Wrench } from "@phosphor-icons/react/dist/ssr";

import type { ServicioPublico } from "@/lib/sitio/contenido";
import { CATEGORIAS, ETIQUETA_CATEGORIA } from "@/lib/orden/presupuesto";

import { Encabezado, Esquinas, Seccion, paso } from "./piezas";

const ICONO_CATEGORIA = {
  MANTENIMIENTO: Wrench,
  REPARACION: Engine,
  CARROCERIA: PaintRoller,
  ESPECIALIZADO: Gauge,
} as const;

/**
 * Las cuatro categorías del catálogo, cada una como una ficha de plano: filete,
 * marcas de registro, el número de la ficha y la lista de servicios separada
 * por filetes. Sin relleno de color y sin sombra: son dibujos de línea.
 *
 * Una categoría sin servicios activos no se pinta, así que la retícula se
 * recompone sola cuando el taller apaga una entera desde el catálogo.
 */
export function Servicios({ servicios }: { servicios: ServicioPublico[] }) {
  const grupos = CATEGORIAS.map((categoria) => ({
    categoria,
    servicios: servicios.filter((servicio) => servicio.categoria === categoria),
  })).filter((grupo) => grupo.servicios.length > 0);

  if (grupos.length === 0) return null;

  return (
    <Seccion id="servicios">
      <Encabezado
        numero="01"
        tema="Qué hacemos"
        titulo="Servicios"
        bajada="Trabajamos unidades livianas y pesadas. Si no sabes qué tiene, lo diagnosticamos primero."
        conReglilla
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {grupos.map((grupo, indice) => {
          const Icono = ICONO_CATEGORIA[grupo.categoria];

          return (
            <article
              key={grupo.categoria}
              style={paso(indice)}
              className="al-entrar plano group flex min-h-68 flex-col gap-4 bg-fondo p-6 transition duration-300 ease-salida hover:-translate-y-1 hover:border-borde-fuerte"
            >
              <div className="flex items-start justify-between gap-4">
                <Icono size={34} className="text-marca" />
                <span className="font-mono text-[13px] tracking-[0.16em] text-tinta-tenue transition-colors duration-300 group-hover:text-marca">
                  {`0${indice + 1}`}
                </span>
              </div>

              <h3 className="font-display text-2xl leading-tight font-bold uppercase">
                {ETIQUETA_CATEGORIA[grupo.categoria]}
              </h3>

              <ul className="mt-auto flex flex-col">
                {grupo.servicios.map((servicio) => (
                  <li
                    key={servicio.id}
                    className="flex items-baseline gap-2.5 border-t border-borde py-2.5 text-[15px] text-tinta-suave"
                  >
                    <span aria-hidden className="size-1 shrink-0 -translate-y-0.5 bg-marca" />
                    {servicio.nombre}
                  </li>
                ))}
              </ul>

              <Esquinas />
            </article>
          );
        })}
      </div>
    </Seccion>
  );
}
