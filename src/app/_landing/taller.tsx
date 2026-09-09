import type { Nosotros } from "@/lib/sitio/contenido";

import { MarcoFoto, Seccion } from "./piezas";

/**
 * Quiénes son, con la foto del taller al lado. El texto sale del panel y puede
 * tener varios párrafos, por eso `whitespace-pre-line`: los saltos que escriba
 * el taller se respetan sin darle un editor con formato.
 */
export function Taller({ nosotros }: { nosotros: Nosotros }) {
  if (!nosotros.texto.trim() && !nosotros.imagenUrl) return null;

  return (
    <Seccion id="taller">
      <div className="grid items-center gap-10 md:grid-cols-2 md:gap-14">
        <div className="al-entrar order-2 md:order-1">
          <MarcoFoto
            url={nosotros.imagenUrl}
            alt="Interior del taller"
            proporcion="aspect-5/4"
            tamanos="(min-width: 768px) 45vw, 100vw"
          />
        </div>

        <div className="al-entrar order-1 flex flex-col gap-5 md:order-2">
          <h2 className="font-display text-3xl font-bold uppercase tracking-tight md:text-4xl">
            {nosotros.titulo || "El taller"}
          </h2>

          <p className="text-lg leading-relaxed whitespace-pre-line text-tinta-suave">
            {nosotros.texto}
          </p>
        </div>
      </div>
    </Seccion>
  );
}
