"use client";

import { Trash } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { useActionState, useState, useTransition } from "react";

import type { FotoPanel } from "@/lib/sitio/panel";

import { Aviso } from "../componentes";
import { SIN_ERROR } from "../estado-formulario";
import { actualizarFoto, agregarFoto, borrarFoto } from "./acciones";
import { CLASES_CAMPO, Interruptor } from "./campos";
import { SubirImagen } from "./subir";

/**
 * Fotos del taller.
 *
 * El texto alternativo es obligatorio y no es burocracia: es lo que lee quien
 * entra con el lector de pantalla y lo que aparece si la foto no carga, que en
 * una conexión móvil pasa.
 */
export function Galeria({ fotos }: { fotos: FotoPanel[] }) {
  return (
    <section className="rounded-2xl border border-borde bg-fondo-alto p-5 md:p-6">
      <div className="mb-5 flex flex-col gap-1">
        <h2 className="font-display text-xl font-semibold uppercase tracking-tight">
          Galería
        </h2>
        <p className="max-w-2xl text-sm text-tinta-suave">
          Se muestran en una tira que se pasa de lado. Las fotos se reducen solas
          antes de subirse, así que se pueden mandar directo del celular.
        </p>
      </div>

      <SubirImagen
        carpeta="galeria"
        alTerminar={(url) => agregarFoto(url, "Foto del taller")}
        texto="Agregar foto"
      />

      {fotos.length === 0 ? (
        <p className="mt-4 text-sm text-tinta-tenue">
          Sin fotos todavía. La sección no aparece en el sitio.
        </p>
      ) : (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fotos.map((foto) => (
            <Tarjeta key={foto.id} foto={foto} />
          ))}
        </ul>
      )}
    </section>
  );
}

function Tarjeta({ foto }: { foto: FotoPanel }) {
  const [estado, accion, guardando] = useActionState(actualizarFoto, SIN_ERROR);
  const [borrando, empezarBorrado] = useTransition();

  const [campos, setCampos] = useState({ alt: foto.alt, activo: foto.activo });
  const sucio = campos.alt !== foto.alt || campos.activo !== foto.activo;

  return (
    <li className={`flex flex-col gap-3 ${campos.activo ? "" : "opacity-60"}`}>
      <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-fondo-hondo">
        <Image
          src={foto.url}
          alt={foto.alt}
          fill
          sizes="(min-width: 1024px) 20rem, (min-width: 640px) 45vw, 90vw"
          className="object-cover"
        />
      </div>

      <form action={accion} className="flex flex-col gap-3">
        <input type="hidden" name="id" value={foto.id} />

        <input
          name="alt"
          value={campos.alt}
          onChange={(e) => setCampos((p) => ({ ...p, alt: e.target.value }))}
          aria-label="Qué se ve en la foto"
          placeholder="Qué se ve en la foto"
          className={CLASES_CAMPO}
        />

        <div className="flex flex-wrap items-center gap-2">
          <Interruptor
            nombre="activo"
            activo={campos.activo}
            onCambiar={(v) => setCampos((p) => ({ ...p, activo: v }))}
            etiqueta="Visible"
          />

          <button
            type="submit"
            disabled={!sucio || guardando}
            className="ml-auto rounded-lg border border-borde-fuerte px-3 py-1.5 text-sm font-medium transition duration-200 ease-salida hover:border-marca hover:text-marca disabled:opacity-40"
          >
            {guardando ? "…" : sucio ? "Guardar" : "Guardado"}
          </button>

          <button
            type="button"
            disabled={borrando}
            onClick={() => empezarBorrado(() => borrarFoto(foto.id))}
            aria-label="Borrar foto"
            className="rounded-lg border border-borde p-2 text-tinta-tenue transition-colors duration-200 hover:border-marca hover:text-marca disabled:opacity-40"
          >
            <Trash size={16} />
          </button>
        </div>

        {estado.error ? <Aviso>{estado.error}</Aviso> : null}
      </form>
    </li>
  );
}
