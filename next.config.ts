import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Decisión 22: los datos son dinámicos por defecto y se cachea explícitamente
  // con `use cache` + `cacheTag`. El botón "Publicar cambios" (decisión 17)
  // invalida por tag, no por ruta.
  cacheComponents: true,
};

export default nextConfig;
