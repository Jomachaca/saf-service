import { Suspense } from "react";

import { cargarConfigCompleta, cargarGaleriaPanel } from "@/lib/sitio/panel";
import { requerirStaff } from "@/lib/sesion";

import { Encabezado } from "../../componentes";
import { Presentacion } from "../formularios";
import { Galeria } from "../galeria";

export const metadata = {
  title: "El taller",
};

export default function PaginaTaller() {
  return (
    <>
      <Encabezado
        seccion="Sitio web"
        titulo="El taller"
        descripcion="Quiénes son, qué hacen y cómo se ve el taller por dentro."
      />

      <Suspense fallback={<p className="text-sm text-tinta-tenue">Cargando…</p>}>
        <Contenido />
      </Suspense>
    </>
  );
}

async function Contenido() {
  await requerirStaff();

  const [config, fotos] = await Promise.all([cargarConfigCompleta(), cargarGaleriaPanel()]);
  if (!config) return null;

  return (
    <div className="flex max-w-4xl flex-col gap-5">
      <Presentacion config={config} />
      <Galeria fotos={fotos} />
    </div>
  );
}
