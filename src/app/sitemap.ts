import type { MetadataRoute } from "next";

import { sitioUrl } from "@/lib/sitio/url";

/**
 * Las cuatro páginas públicas del sitio.
 *
 * `/reservar` entra aunque las reservas estén apagadas: el interruptor cambia
 * de un día para otro y un sitemap que aparece y desaparece confunde más de lo
 * que ayuda. La página, apagada, explica que se reserva por WhatsApp.
 *
 * El panel, el acceso y `/o/{token}` no están acá y además los bloquea
 * `robots.ts`.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = sitioUrl();

  return [
    { url: base, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/reservar`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/privacidad`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terminos`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
