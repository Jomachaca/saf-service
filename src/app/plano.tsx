/**
 * Las cuatro marcas de registro de un marco de plano.
 *
 * Van como hijas directas del elemento con clase `plano`, que es lo que el CSS
 * de `globals.css` espera para colocarlas fuera de la caja. Vive acá arriba, y
 * no dentro del landing o del panel, porque el marco es del sistema visual
 * entero: lo usan las fichas de servicios, las figuras, el botón primario y
 * los bloques de configuración del panel (decisión 33).
 */
export function Esquinas({ className }: { className?: string }) {
  const clase = className ? `esquina ${className}` : "esquina";

  return (
    <>
      <i aria-hidden className={`${clase} si`} />
      <i aria-hidden className={`${clase} sd`} />
      <i aria-hidden className={`${clase} ii`} />
      <i aria-hidden className={`${clase} id`} />
    </>
  );
}
