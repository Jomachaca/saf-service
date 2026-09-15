import { Suspense } from "react";

import { cargarCatalogo, cargarConfig } from "@/lib/orden/consultas";
import { CATEGORIAS, type ServicioCatalogo } from "@/lib/orden/presupuesto";
import { requerirStaff } from "@/lib/sesion";

import { Encabezado, Seccion } from "../componentes";
import { AjustesPresupuesto } from "./presupuestos";
import { NuevoServicio, TablaCatalogo } from "./tabla";

export const metadata = {
  title: "Catálogo",
};

export default function PaginaCatalogo() {
  return (
    <Suspense fallback={<p className="text-sm text-tinta-tenue">Cargando catálogo…</p>}>
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
      <Encabezado
        titulo="Catálogo"
        descripcion={
          <>
            Precios de referencia para armar presupuestos más rápido. Al agregar un servicio a un
            presupuesto, el precio se copia a esa línea: cambiarlo acá no altera nada de lo que ya
            se presupuestó.{" "}
            {config.igvIncluido
              ? "Escribe los precios con IGV incluido, como está configurado más abajo."
              : `Escribe los precios sin IGV: el ${(config.igvTasaBp / 100).toFixed(0)} % se suma al armar el presupuesto.`}
          </>
        }
      />

      <Seccion
        titulo="Servicios"
        accion={
          <span className="text-xs text-tinta-tenue">
            {activos} activos de {servicios.length}
          </span>
        }
      >
        <TablaCatalogo servicios={servicios} />

        <p className="max-w-2xl text-xs text-tinta-tenue">
          Para retirar un servicio, desmarca «Activo». Deja de aparecer al armar
          presupuestos y en la web pública, pero los presupuestos donde ya se usó
          lo siguen mostrando tal como estaba.
        </p>
      </Seccion>

      <Seccion titulo="Agregar servicio">
        <NuevoServicio />
      </Seccion>

      <div className="max-w-4xl">
        <AjustesPresupuesto
          igvIncluido={config.igvIncluido}
          igvTasaBp={config.igvTasaBp}
          plantilla={config.plantillas.presupuesto ?? ""}
        />
      </div>
    </div>
  );
}
