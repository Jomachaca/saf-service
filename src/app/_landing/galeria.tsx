import Image from "next/image";

import type { Foto } from "@/lib/sitio/contenido";

import { Encabezado, Esquinas, Seccion, paso } from "./piezas";

/**
 * Tira que se arrastra de lado, con anclaje.
 *
 * Una retícula obligaría a decidir cuántas fotos entran por fila y dejaría
 * huecos cuando el taller suba tres o cinco. Así entran las que sean, y en el
 * celular se pasan con el dedo, que es como se miran las fotos.
 *
 * Cada foto va enmarcada y teñida de acero como las demás del sitio, para que
 * una tomada a mediodía y otra de tarde se vean de la misma familia.
 */
export function Galeria({ fotos }: { fotos: Foto[] }) {
  if (fotos.length === 0) return null;

  return (
    <Seccion>
      <Encabezado titulo="El taller por dentro" />

      <ul className="-mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pt-1 pb-4 md:-mx-7 md:px-7">
        {fotos.map((foto, indice) => (
          <li
            key={foto.id}
            style={paso(indice)}
            className="al-entrar plano duotono relative aspect-4/3 w-72 shrink-0 snap-start overflow-hidden md:w-96"
          >
            <Image
              src={foto.url}
              alt={foto.alt}
              fill
              sizes="(min-width: 768px) 24rem, 18rem"
              className="object-cover"
            />
            <Esquinas />
          </li>
        ))}
      </ul>
    </Seccion>
  );
}
