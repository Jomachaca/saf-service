import Link from "next/link";
import { Suspense } from "react";

import { cargarCatalogo, cargarConfig } from "@/lib/orden/consultas";
import { CATEGORIAS, type ServicioCatalogo } from "@/lib/orden/presupuesto";
import { requerirStaff } from "@/lib/sesion";

import { Seccion } from "../componentes";
import { NuevoServicio, TablaCatalogo } from "./tabla";

export const metadata = {
  title: "Catálogo · SAF Service",
};

export default function PaginaCatalogo() {
  return (
    <Suspense fallback={<p className="text-sm opacity-40">Cargando catálogo…</p>}>
      <Contenido />
    </Suspense>
  );
}

/** Las desconocidas al final: si algún día entra una categoría nueva en la base
 *  antes que en el código, la fila se ve igual en vez de desaparecer. */
function posicion(categoria: string): number {
  const indice = (CATEGORIAS as readonly string[]).indexOf(categoria);
  return indice === -1 ? CATEGORIAS.length : indice;
}

function ordenar(catalogo: ServicioCatalogo[]): ServicioCatalogo[] {
  return [...catalogo].sort(
    (uno, otro) =>
      posicion(uno.categoria) - posicion(otro.categoria) ||
      uno.orden_visual - otro.orden_visual ||
      uno.nombre.localeCompare(otro.nombre, "es"),
  );
}

async function Contenido() {
  await requerirStaff();

  // `false`: acá sí se ven los desactivados. Es la única pantalla donde importan.
  const [catalogo, config] = await Promise.all([cargarCatalogo(false), cargarConfig()]);

  const servicios = ordenar(catalogo);
  const activos = servicios.filter((servicio) => servicio.activo).length;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link href="/admin" className="text-sm opacity-60 underline-offset-4 hover:underline">
          ← Tablero
        </Link>

        <h1 className="text-xl font-semibold">Catálogo de servicios</h1>

        <p className="max-w-2xl text-sm opacity-70">
          Estos precios son de referencia para armar presupuestos más rápido. Al
          agregar un servicio a un presupuesto el precio se copia a esa línea, así
          que cambiarlo acá no altera nada de lo que ya se presupuestó.
        </p>

        <p className="max-w-2xl text-sm opacity-70">
          {config.igvIncluido
            ? "Escribe los precios con IGV incluido: así están configurados."
            : `Escribe los precios sin IGV: el ${(config.igvTasaBp / 100).toFixed(0)} % se suma al armar el presupuesto.`}
        </p>
      </div>

      <Seccion
        titulo="Servicios"
        accion={
          <span className="text-xs opacity-50">
            {activos} activos de {servicios.length}
          </span>
        }
      >
        <TablaCatalogo servicios={servicios} />

        <p className="max-w-2xl text-xs opacity-50">
          Para retirar un servicio, desmarca «Activo». Deja de aparecer al armar
          presupuestos y en la web pública, pero los presupuestos donde ya se usó
          lo siguen mostrando tal como estaba.
        </p>
      </Seccion>

      <Seccion titulo="Agregar servicio">
        <NuevoServicio />
      </Seccion>
    </div>
  );
}
