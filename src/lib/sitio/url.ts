/**
 * La dirección pública del sitio, en un solo lugar.
 *
 * Sale de `NEXT_PUBLIC_SITE_URL` y de ella dependen tres cosas que tienen que
 * coincidir: el enlace que el cliente recibe por WhatsApp (decisión 7), la base
 * con la que Next resuelve la imagen de vista previa, y el `sitemap.xml`. Si
 * cada una improvisa su propio valor por defecto, un despliegue mal configurado
 * manda a la gente a `localhost` sin que nadie se entere.
 *
 * El respaldo es `localhost` a propósito: en desarrollo tiene que funcionar sin
 * configurar nada, y en producción la variable está puesta.
 */
export function sitioUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}
