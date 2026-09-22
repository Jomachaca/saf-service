import type { Destacado } from "@/lib/sitio/contenido";
import { Icono } from "@/lib/sitio/iconos";

import { Encabezado, Seccion, paso } from "./piezas";

/**
 * El método del taller, como una hoja de especificación: una fila por punto,
 * separadas por filetes, con el número a la izquierda. Sin tarjetas: encerrar
 * cada punto en una caja no agrega jerarquía, y la retícula ya agrupa.
 */
export function Destacados({ destacados }: { destacados: Destacado[] }) {
  if (destacados.length === 0) return null;

  return (
    <Seccion fondo="hondo">
      <Encabezado numero="02" tema="El método" titulo="Cómo trabajamos" />

      <div className="border-t border-borde-fuerte">
        {destacados.map((destacado, indice) => (
          <div
            key={destacado.id}
            style={paso(indice)}
            className="al-entrar group grid grid-cols-[2.5rem_2rem_minmax(0,1fr)] items-start gap-x-4 gap-y-2 border-b border-borde-fuerte px-2 py-6 md:grid-cols-[3rem_2.4rem_minmax(0,15rem)_minmax(0,1fr)] md:gap-x-6"
          >
            <span className="pt-1 font-mono text-sm tracking-[0.16em] text-tinta-tenue transition-colors duration-300 group-hover:text-marca">
              {`0${indice + 1}`}
            </span>

            <span className="mt-0.5 text-marca">
              <Icono clave={destacado.icono} size={26} />
            </span>

            <h3 className="font-display text-[23px] leading-tight font-bold uppercase">
              {destacado.titulo}
            </h3>

            {destacado.texto ? (
              <p className="col-span-3 leading-relaxed text-tinta-suave md:col-span-1 md:col-start-4">
                {destacado.texto}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </Seccion>
  );
}
