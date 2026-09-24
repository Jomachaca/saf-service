import type { NextConfig } from "next";

/**
 * Las fotos del landing viven en Supabase Storage, así que `next/image`
 * necesita tener permitido ese origen. Se saca de la variable de entorno en vez
 * de escribir el identificador del proyecto acá: si mañana se apunta a otro
 * Supabase, no hay que acordarse de este archivo.
 */
function origenDeSupabase(): NextConfig["images"] {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || url.includes("xxxx")) return {};

  try {
    return {
      remotePatterns: [
        {
          protocol: "https",
          hostname: new URL(url).hostname,
          pathname: "/storage/v1/object/public/**",
        },
      ],
    };
  } catch {
    return {};
  }
}

const nextConfig: NextConfig = {
  // Decisión 22: los datos son dinámicos por defecto y se cachea explícitamente
  // con `use cache` + `cacheTag`. El botón "Publicar cambios" (decisión 17)
  // invalida por tag, no por ruta.
  cacheComponents: true,
  images: origenDeSupabase(),

  // El indicador de Next en desarrollo, apagado. Abajo a la izquierda tapaba
  // el nombre y el botón «Salir» de la barra lateral del panel, y abajo a la
  // derecha tapa la burbuja de WhatsApp del landing. Apagarlo no esconde nada
  // importante: los errores de compilación y de ejecución se siguen mostrando.
  devIndicators: false,

  /**
   * Cabeceras de seguridad. No había ninguna (decisión 36).
   *
   * `frame-ancestors: none` es la que importa: sin ella, una página cualquiera
   * puede meter el panel en un iframe invisible y hacer que alguien con sesión
   * abierta pulse botones sin verlos. Va como CSP y también como
   * `X-Frame-Options`, porque los navegadores viejos solo entienden la segunda.
   *
   * La CSP se queda en `frame-ancestors` a propósito. Una CSP completa para
   * Next.js necesita nonces por petición en el proxy, y una mal puesta rompe la
   * página entera en silencio: es un trabajo aparte, con su propia prueba.
   */
  async headers() {
    return [
      {
        source: "/:ruta*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
        ],
      },
    ];
  },

  // Rutas que cambiaron al ordenar el panel en una barra lateral (decisión 31).
  // Temporales: una pestaña vieja o un marcador siguen llegando a su pantalla.
  async redirects() {
    return [
      { source: "/admin/config", destination: "/admin/sitio", permanent: false },
      { source: "/admin/agenda/horario", destination: "/admin/reservas", permanent: false },
    ];
  },
};

export default nextConfig;
