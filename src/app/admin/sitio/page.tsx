import { Suspense } from "react";

import { cargarConfigCompleta } from "@/lib/sitio/panel";
import { requerirStaff } from "@/lib/sesion";

import { Encabezado } from "../componentes";
import { HorarioAtencion, Identidad } from "./formularios";

export const metadata = {
  title: "Datos y contacto",
};

/**
 * La primera de las tres partes de «Sitio web»; las otras son `portada/` y
 * `taller/`. Antes era una sola pantalla con ocho formularios apilados
 * (decisión 31).
 */
export default function PaginaDatos() {
  return (
    <>
      <Encabezado
        seccion="Sitio web"
        titulo="Datos y contacto"
        descripcion="Cómo se llama el taller y cómo encontrarlo. Guardar deja el cambio anotado; el sitio recién cambia cuando pulsas «Publicar cambios»."
      />

      <Suspense fallback={<p className="text-sm text-tinta-tenue">Cargando…</p>}>
        <Contenido />
      </Suspense>
    </>
  );
}

async function Contenido() {
  await requerirStaff();

  // Sin fila de configuración no hay nada que editar; el aviso lo da el layout.
  const config = await cargarConfigCompleta();
  if (!config) return null;

  return (
    <div className="flex max-w-4xl flex-col gap-5">
      <Identidad config={config} />
      <HorarioAtencion config={config} />
    </div>
  );
}
