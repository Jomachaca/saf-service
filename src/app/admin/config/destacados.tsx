"use client";

import { Plus, Trash } from "@phosphor-icons/react/dist/ssr";
import { useActionState, useState, useTransition } from "react";

import type { DestacadoPanel } from "@/lib/sitio/panel";
import { CLAVES_ICONO, ICONOS, Icono } from "@/lib/sitio/iconos";

import { Aviso } from "../componentes";
import { CATALOGO_INICIAL, SIN_ERROR } from "../estado-formulario";
import { actualizarDestacado, borrarDestacado, crearDestacado } from "./acciones";
import { CLASES_CAMPO, Interruptor } from "./campos";

/**
 * Los puntos de «Cómo trabajamos».
 *
 * El ícono se elige de una lista cerrada (decisión 11): así la fila siempre se
 * ve igual de bien y nadie pega un emoji que rompa la altura.
 */
export function Destacados({ destacados }: { destacados: DestacadoPanel[] }) {
  return (
    <section className="rounded-2xl border border-borde bg-fondo-alto p-5 md:p-6">
      <div className="mb-5 flex flex-col gap-1">
        <h2 className="font-display text-xl font-semibold uppercase tracking-tight">
          Cómo trabajamos
        </h2>
        <p className="max-w-2xl text-sm text-tinta-suave">
          Las razones para elegir el taller. Van en dos columnas, así que quedan
          mejor de dos en dos.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {destacados.map((destacado) => (
          <Fila key={destacado.id} destacado={destacado} />
        ))}

        {destacados.length === 0 ? (
          <p className="text-sm text-tinta-tenue">
            Sin puntos cargados. La sección no aparece en el sitio.
          </p>
        ) : null}
      </div>

      <Nuevo />
    </section>
  );
}

function Fila({ destacado }: { destacado: DestacadoPanel }) {
  const [estado, accion, guardando] = useActionState(actualizarDestacado, SIN_ERROR);
  const [borrando, empezarBorrado] = useTransition();

  const inicial = {
    icono: destacado.icono,
    titulo: destacado.titulo,
    texto: destacado.texto,
    activo: destacado.activo,
  };
  const [campos, setCampos] = useState(inicial);

  const sucio =
    campos.icono !== inicial.icono ||
    campos.titulo !== inicial.titulo ||
    campos.texto !== inicial.texto ||
    campos.activo !== inicial.activo;

  return (
    <form
      action={accion}
      className={`flex flex-col gap-3 rounded-lg border border-borde p-4 ${
        campos.activo ? "" : "opacity-60"
      }`}
    >
      <input type="hidden" name="id" value={destacado.id} />

      <div className="flex flex-wrap items-start gap-3">
        <span className="mt-1 shrink-0 rounded-lg bg-vino-50 p-2 text-marca dark:bg-vino-900/40">
          <Icono clave={campos.icono} size={22} weight="duotone" />
        </span>

        <select
          name="icono"
          value={campos.icono}
          onChange={(e) => setCampos((p) => ({ ...p, icono: e.target.value }))}
          aria-label="Ícono"
          className={`${CLASES_CAMPO} w-48`}
        >
          {CLAVES_ICONO.map((clave) => (
            <option key={clave} value={clave}>
              {ICONOS[clave].etiqueta}
            </option>
          ))}
        </select>

        <input
          name="titulo"
          value={campos.titulo}
          onChange={(e) => setCampos((p) => ({ ...p, titulo: e.target.value }))}
          aria-label="Título"
          placeholder="Título"
          className={`${CLASES_CAMPO} min-w-40 flex-1`}
        />
      </div>

      <input
        name="texto"
        value={campos.texto}
        onChange={(e) => setCampos((p) => ({ ...p, texto: e.target.value }))}
        aria-label="Texto"
        placeholder="Una línea explicando el punto"
        className={CLASES_CAMPO}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Interruptor
          nombre="activo"
          activo={campos.activo}
          onCambiar={(v) => setCampos((p) => ({ ...p, activo: v }))}
          etiqueta="Visible"
        />

        <button
          type="submit"
          disabled={!sucio || guardando}
          className="ml-auto rounded-lg border border-borde-fuerte px-3 py-2 text-sm font-medium transition duration-200 ease-salida hover:border-marca hover:text-marca disabled:opacity-40"
        >
          {guardando ? "Guardando…" : sucio ? "Guardar" : "Guardado"}
        </button>

        <button
          type="button"
          disabled={borrando}
          onClick={() => empezarBorrado(() => borrarDestacado(destacado.id))}
          aria-label="Borrar punto"
          className="rounded-lg border border-borde p-2 text-tinta-tenue transition-colors duration-200 hover:border-marca hover:text-marca disabled:opacity-40"
        >
          <Trash size={16} />
        </button>
      </div>

      {estado.error ? <Aviso>{estado.error}</Aviso> : null}
    </form>
  );
}

function Nuevo() {
  const [estado, accion, enviando] = useActionState(crearDestacado, CATALOGO_INICIAL);

  return (
    <CamposNuevo
      key={estado.creado ?? "nuevo"}
      accion={accion}
      enviando={enviando}
      error={estado.error}
    />
  );
}

function CamposNuevo({
  accion,
  enviando,
  error,
}: {
  accion: (datos: FormData) => void;
  enviando: boolean;
  error: string | null;
}) {
  const [campos, setCampos] = useState({ icono: "llave", titulo: "", texto: "" });

  return (
    <form action={accion} className="mt-4 flex flex-col gap-3 border-t border-borde pt-4">
      <div className="flex flex-wrap gap-3">
        <select
          name="icono"
          value={campos.icono}
          onChange={(e) => setCampos((p) => ({ ...p, icono: e.target.value }))}
          aria-label="Ícono"
          className={`${CLASES_CAMPO} w-48`}
        >
          {CLAVES_ICONO.map((clave) => (
            <option key={clave} value={clave}>
              {ICONOS[clave].etiqueta}
            </option>
          ))}
        </select>

        <input
          name="titulo"
          value={campos.titulo}
          onChange={(e) => setCampos((p) => ({ ...p, titulo: e.target.value }))}
          required
          aria-label="Título"
          placeholder="Título"
          className={`${CLASES_CAMPO} min-w-40 flex-1`}
        />
      </div>

      <input
        name="texto"
        value={campos.texto}
        onChange={(e) => setCampos((p) => ({ ...p, texto: e.target.value }))}
        aria-label="Texto"
        placeholder="Una línea explicando el punto"
        className={CLASES_CAMPO}
      />

      <button
        type="submit"
        disabled={enviando}
        className="inline-flex w-fit items-center gap-2 rounded-lg border border-borde-fuerte px-3 py-2 text-sm font-medium transition duration-200 ease-salida hover:border-marca hover:text-marca disabled:opacity-40"
      >
        <Plus size={16} />
        {enviando ? "Agregando…" : "Agregar punto"}
      </button>

      {error ? <Aviso>{error}</Aviso> : null}
    </form>
  );
}
