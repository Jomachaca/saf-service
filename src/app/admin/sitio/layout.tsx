import { Suspense } from "react";

import { formatearFechaHora } from "@/lib/fecha";
import { cargarPublicacion, haySinPublicar } from "@/lib/sitio/panel";
import { requerirStaff } from "@/lib/sesion";

import { BarraPublicar } from "./publicar";

/**
 * Lo común a las tres partes de «Sitio web»: la barra de publicar. Vive en el
 * layout para que no se desmonte al pasar de una parte a otra, y porque publicar
 * es de todo el sitio, no de la parte que se está mirando (decisión 17).
 */
export default function LayoutSitio({ children }: LayoutProps<"/admin/sitio">) {
  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<div className="h-16" />}>
        <Publicacion />
      </Suspense>

      {children}
    </div>
  );
}

async function Publicacion() {
  await requerirStaff();

  const publicacion = await cargarPublicacion();

  if (!publicacion) {
    return (
      <p className="text-sm text-tinta-suave">
        No hay una fila de configuración en la base. Revisa que las migraciones se hayan
        aplicado.
      </p>
    );
  }

  return (
    <BarraPublicar
      sinPublicar={haySinPublicar(publicacion)}
      ultimaPublicacion={
        publicacion.publicadoEn ? formatearFechaHora(publicacion.publicadoEn) : null
      }
    />
  );
}
