import Image from "next/image";

import type { Foto } from "@/lib/sitio/contenido";

import { Seccion } from "./piezas";

/**
 * Tira que se arrastra de lado, con anclaje.
 *
 * Una retícula obligaría a decidir cuántas fotos entran por fila y dejaría
 * huecos cuando el taller suba tres o cinco. Así entran las que sean, y en el
 * celular se pasan con el dedo, que es como se miran las fotos.
 */
export function Galeria({ fotos }: { fotos: Foto[] }) {
  if (fotos.length === 0) return null;

  return (
    <Seccion titulo="El taller por dentro">
      <ul className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 md:-mx-8 md:px-8">
        {fotos.map((foto) => (
          <li
            key={foto.id}
            className="relative aspect-4/3 w-72 shrink-0 snap-start overflow-hidden rounded-2xl bg-fondo-hondo md:w-96"
          >
            <Image
              src={foto.url}
              alt={foto.alt}
              fill
              sizes="(min-width: 768px) 24rem, 18rem"
              className="object-cover"
            />
          </li>
        ))}
      </ul>
    </Seccion>
  );
}
