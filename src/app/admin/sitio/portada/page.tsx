import Link from "next/link";
import { Suspense } from "react";

import { cargarConfigCompleta, cargarDestacadosPanel } from "@/lib/sitio/panel";
import { requerirStaff } from "@/lib/sesion";

import { Encabezado } from "../../componentes";
import { Destacados } from "../destacados";
import { Titular } from "../formularios";

export const metadata = {
  title: "Portada",
};

export default function PaginaPortada() {
  return (
    <>
      <Encabezado
        seccion="Sitio web"
        titulo="Portada"
        descripcion={
          <>
            Lo primero que ve quien abre el sitio. La lista de servicios que sigue a la portada
            sale del{" "}
            <Link
              href="/admin/catalogo"
              className="font-medium text-marca underline underline-offset-4"
            >
              catálogo
            </Link>
            .
          </>
        }
      />

      <Suspense fallback={<p className="text-sm text-tinta-tenue">Cargando…</p>}>
        <Contenido />
      </Suspense>
    </>
  );
}

async function Contenido() {
  await requerirStaff();

  const [config, destacados] = await Promise.all([
    cargarConfigCompleta(),
    cargarDestacadosPanel(),
  ]);
  if (!config) return null;

  return (
    <div className="flex max-w-4xl flex-col gap-5">
      <Titular config={config} />
      <Destacados destacados={destacados} />
    </div>
  );
}
