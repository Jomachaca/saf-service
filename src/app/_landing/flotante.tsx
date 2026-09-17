import { WhatsappLogo } from "@phosphor-icons/react/dist/ssr";

/**
 * La burbuja de WhatsApp del celular.
 *
 * En pantalla grande la barra de arriba lleva siempre un botón a la vista, así
 * que la burbuja sobra; en el celular esa barra solo tiene el logo y el menú, y
 * quien entró desde un estado de WhatsApp se queda sin a dónde tocar. Por eso
 * `md:hidden`.
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
      aria-label="Escribir por WhatsApp"
      className="pulso fixed right-4 bottom-4 z-30 grid size-14 place-items-center rounded-full bg-marca text-sobre-marca shadow-lg shadow-marino-900/30 transition duration-200 ease-salida hover:bg-marca-viva active:translate-y-px md:hidden"
    >
      <WhatsappLogo size={28} weight="fill" />
    </a>
  );
}
