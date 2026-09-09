import Link from "next/link";
import { Suspense } from "react";

import { formatearFechaHora } from "@/lib/fecha";
import {
  cargarConfigCompleta,
  cargarDestacadosPanel,
  cargarGaleriaPanel,
  haySinPublicar,
} from "@/lib/sitio/panel";
import { requerirStaff } from "@/lib/sesion";

import { Destacados } from "./destacados";
import { Facturacion, ElTaller, Horarios, Identidad, Portada } from "./formularios";
import { Galeria } from "./galeria";
import { BarraPublicar } from "./publicar";

export const metadata = {
  title: "Configuración del sitio",
};

export default function PaginaConfig() {
  return (
    <Suspense fallback={<p className="text-sm text-tinta-tenue">Cargando configuración…</p>}>
      <Contenido />
    </Suspense>
  );
}

async function Contenido() {
  await requerirStaff();

  const [config, destacados, fotos] = await Promise.all([
    cargarConfigCompleta(),
    cargarDestacadosPanel(),
    cargarGaleriaPanel(),
  ]);

  if (!config) {
    return (
      <p className="text-sm text-tinta-suave">
        No hay una fila de configuración en la base. Revisa que las migraciones se
        hayan aplicado.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <BarraPublicar
        sinPublicar={haySinPublicar(config)}
        ultimaPublicacion={config.publicadoEn ? formatearFechaHora(config.publicadoEn) : null}
      />

      <div className="flex flex-col gap-2">
        <Link href="/admin" className="text-sm text-tinta-tenue underline-offset-4 hover:underline">
          ← Tablero
        </Link>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight">
          Configuración del sitio
        </h1>
        <p className="max-w-2xl text-sm text-tinta-suave">
          Todo lo que se ve en la página pública se edita acá. Guardar deja el
          cambio anotado; el sitio recién cambia cuando pulsas «Publicar cambios».
        </p>
      </div>

      <div className="flex max-w-4xl flex-col gap-5">
        <Identidad config={config} />
        <Portada config={config} />
        <ElTaller config={config} />
        <Horarios config={config} />
        <Destacados destacados={destacados} />
        <Galeria fotos={fotos} />
        <Facturacion config={config} />
      </div>
    </div>
  );
}
