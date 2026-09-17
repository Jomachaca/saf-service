import type { Destacado } from "@/lib/sitio/contenido";
import { Icono } from "@/lib/sitio/iconos";

import { Seccion, paso } from "./piezas";

/**
 * Sin tarjetas: ícono, título y una línea, separados por aire.
 *
 * Encerrar cada punto en una caja con borde y sombra no agrega jerarquía, solo
 * ruido. La retícula ya agrupa.
 */
export function Destacados({ destacados }: { destacados: Destacado[] }) {
  if (destacados.length === 0) return null;

  return (
    <Seccion titulo="Cómo trabajamos">
      <div className="grid gap-x-12 gap-y-10 sm:grid-cols-2">
        {destacados.map((destacado, indice) => (
          <div key={destacado.id} style={paso(indice)} className="al-entrar group flex gap-4">
            <span className="mt-0.5 shrink-0 rounded-lg bg-vino-50 p-2.5 text-marca transition duration-300 ease-salida group-hover:-translate-y-0.5 group-hover:bg-vino-100 dark:bg-vino-900/40 dark:group-hover:bg-vino-900/70">
              <Icono clave={destacado.icono} size={24} weight="duotone" />
            </span>

            <div className="flex flex-col gap-1">
              <h3 className="font-display text-xl font-semibold tracking-tight">
                {destacado.titulo}
              </h3>
              {destacado.texto ? (
                <p className="leading-relaxed text-tinta-suave">{destacado.texto}</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </Seccion>
  );
}
