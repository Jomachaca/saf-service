import { WhatsappLogo } from "@phosphor-icons/react/dist/ssr";

/**
 * La burbuja de WhatsApp del celular.
 *
 * Desde `lg` la barra de arriba lleva siempre los dos botones a la vista, así
 * que la burbuja sobra; por debajo esa barra solo tiene el logo y el menú, y
 * quien entró desde un estado de WhatsApp se queda sin a dónde tocar.
 *
 * Va en granate y no en el verde de WhatsApp: el ícono ya dice cuál es la app,
 * y la página tiene un solo color de acción.
 */
export function BurbujaWhatsApp({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="llama fixed right-5 bottom-5 z-40 inline-flex items-center gap-2.5 border border-marca bg-marca px-5 py-3.5 font-display font-bold tracking-[0.09em] text-white uppercase shadow-lg shadow-marino-900/25 transition duration-200 ease-salida hover:bg-marca-viva active:translate-y-px lg:hidden"
    >
      <WhatsappLogo size={21} />
      WhatsApp
    </a>
  );
}
