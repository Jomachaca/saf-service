import { FacebookLogo, InstagramLogo, TiktokLogo } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import type { Taller } from "@/lib/sitio/contenido";

import { Marca } from "./piezas";

const REDES = [
  { clave: "facebook", etiqueta: "Facebook", Icono: FacebookLogo },
  { clave: "instagram", etiqueta: "Instagram", Icono: InstagramLogo },
  { clave: "tiktok", etiqueta: "TikTok", Icono: TiktokLogo },
] as const;

export function Pie({ taller }: { taller: Taller }) {
  // Sin año: leer la fecha actual acá obligaría a renderizar el pie en cada
  // visita, y un landing que se publica a mano no tiene por qué ser dinámico
  // para pintar un número que nadie mira.
  const redes = REDES.filter((red) => taller[red.clave].trim());

  return (
    <footer className="mt-auto bg-estructura text-white/70">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-12 md:px-8">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="flex flex-col gap-3">
            <Marca tono="claro" url={taller.logoUrl} nombre={taller.nombre} alto="h-16" />
            <p className="max-w-xs text-sm leading-relaxed">
              {taller.direccion}
              {taller.telefono ? (
                <>
                  <br />
                  {taller.telefono}
                </>
              ) : null}
            </p>
          </div>

          {redes.length > 0 ? (
            <div className="flex gap-2">
              {redes.map((red) => (
                <a
                  key={red.clave}
                  href={taller[red.clave]}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={red.etiqueta}
                  className="rounded-lg border border-white/20 p-2.5 transition duration-200 ease-salida hover:border-white/50 hover:text-white active:translate-y-px"
                >
                  <red.Icono size={20} />
                </a>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm">
          <p>{taller.nombre}</p>
          <Link
            href="/admin"
            className="transition-colors duration-200 hover:text-white"
          >
            Acceso del personal
          </Link>
        </div>
      </div>
    </footer>
  );
}
