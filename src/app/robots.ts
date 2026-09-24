import type { MetadataRoute } from "next";

import { sitioUrl } from "@/lib/sitio/url";

/**
 * Lo que los buscadores pueden mirar.
 *
 * Las tres rutas cerradas no son secretos —el panel pide sesión y `/o/{token}`
 * necesita el token—, pero no tienen por qué aparecer en Google. La que de
 * verdad importa es `/o/`: ahí hay nombre, placa y teléfono de una persona, y
 * un enlace indexado convierte un enlace privado en una página pública. La
 * página además manda `noindex` por su cuenta, así que son dos candados.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/acceso", "/o/", "/sin-perfil"],
    },
    sitemap: `${sitioUrl()}/sitemap.xml`,
  };
}
