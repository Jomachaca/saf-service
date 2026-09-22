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
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-14">
        <MarcoFoto
          url={nosotros.imagenUrl}
          alt="Interior del taller"
          proporcion="aspect-5/4"
          tamanos="(min-width: 1024px) 45vw, 100vw"
        />

        <div className="al-entrar flex flex-col gap-5" style={{ "--paso": 1 } as React.CSSProperties}>
          <p className="flex items-center gap-3.5 font-display text-xs font-semibold tracking-[0.24em] text-marca uppercase">
            <span aria-hidden className="h-px w-6 bg-marca" />
            03 · Quiénes somos
          </p>

          <h2 className="font-display text-[clamp(2.125rem,4vw,3.25rem)] leading-none font-bold uppercase">
            {nosotros.titulo || "El taller"}
          </h2>

          <p className="text-lg leading-relaxed whitespace-pre-line text-tinta-suave">
            {nosotros.texto}
          </p>

          {/*
            Las marcas que el taller atiende, cada una en su recuadro. Salen del
            panel: qué marcas toca no se deduce desde acá, y una lista inventada
            en un taller es una promesa que alguien va a venir a cobrar.
          */}
          {nosotros.marcas.length > 0 ? (
            <ul className="mt-1 flex flex-wrap gap-2">
              {nosotros.marcas.map((marca) => (
                <li
                  key={marca}
                  className="border border-borde-fuerte px-3.5 py-1.5 font-display text-[13px] font-semibold tracking-[0.11em] text-tinta-suave uppercase"
                >
                  {marca}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </Seccion>
  );
}
