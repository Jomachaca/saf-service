import type { ServicioPublico } from "@/lib/sitio/contenido";

/**
 * Cinta de servicios en movimiento, entre la portada y el detalle de cada
 * categoría.
 *
 * Son dos copias idénticas de la misma lista corriendo hacia la izquierda:
 * cuando el riel llegó a la mitad vuelve a empezar y, como las copias son
 * iguales, el salto no se ve. El CSS está en `globals.css` (`.cinta`).
 *
 * La banda repite nombres que también salen en «Servicios», así que para un
 * lector de pantalla es ruido: va entera con `aria-hidden`. Lo que aporta es
 * visual, que es exactamente lo que un lector de pantalla no necesita.
 */
export function Cinta({ servicios }: { servicios: ServicioPublico[] }) {
  // Con cuatro o cinco servicios el riel es más corto que la pantalla y la
  // vuelta al inicio se ve. Por debajo de eso, mejor no poner cinta.
  if (servicios.length < 6) return null;

  const nombres = servicios.map((servicio) => servicio.nombre);

  // Velocidad pareja: más servicios, riel más largo, vuelta más lenta. Con una
  // duración fija, un catálogo grande pasaría volando.
  const duracion = `${Math.round(nombres.length * 3.8)}s`;

  return (
    <div
      aria-hidden
      className="cinta border-b border-borde bg-fondo py-4"
      style={{ "--duracion": duracion } as React.CSSProperties}
    >
      <div className="marquesina">
        <Tira nombres={nombres} />
        <Tira nombres={nombres} />
      </div>
    </div>
  );
}

function Tira({ nombres }: { nombres: string[] }) {
  return (
    <ul className="flex shrink-0">
      {nombres.map((nombre, indice) => (
        <li
          key={`${nombre}-${indice}`}
          className="flex shrink-0 items-center gap-6 pe-6 font-display text-lg font-semibold tracking-[0.09em] text-marino-400 uppercase md:text-xl"
        >
          {nombre}
          <span className="size-[5px] shrink-0 bg-marca" />
        </li>
      ))}
    </ul>
  );
}
