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

  // El indicador de Next en desarrollo, abajo a la derecha: en su lugar de
  // siempre tapaba el nombre y el botón «Salir» de la barra lateral del panel.
  devIndicators: { position: "bottom-right" },

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
