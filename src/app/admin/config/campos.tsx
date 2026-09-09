"use client";

import { useState } from "react";

import { Aviso } from "../componentes";

/**
 * Piezas de formulario del panel de configuración.
 *
 * Todos los campos son controlados. No es una preferencia de estilo: React
 * vacía los campos no controlados antes de ejecutar la acción, y con un error
 * de validación se perdería lo escrito (ver `CLAUDE.md`, «Los formularios con
 * acción se resetean solos»).
 */

export const CLASES_CAMPO =
  "w-full rounded-lg border border-borde bg-fondo-alto px-3 py-2 text-sm " +
  "text-tinta placeholder:text-tinta-tenue transition-colors duration-200 " +
  "focus:border-marca focus:outline-none";

export function useCampos<T extends Record<string, string | boolean>>(inicial: T) {
  const [campos, setCampos] = useState<T>(inicial);

  function cambiar<C extends keyof T>(campo: C, valor: T[C]) {
    setCampos((previos) => ({ ...previos, [campo]: valor }));
  }

  return [campos, cambiar] as const;
}

export function Campo({
  etiqueta,
  ayuda,
  children,
}: {
  etiqueta: string;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{etiqueta}</span>
      {children}
      {ayuda ? <span className="text-xs text-tinta-tenue">{ayuda}</span> : null}
    </label>
  );
}

export function Entrada({
  nombre,
  valor,
  onCambiar,
  ...resto
}: {
  nombre: string;
  valor: string;
  onCambiar: (valor: string) => void;
} & Omit<React.ComponentProps<"input">, "name" | "value" | "onChange" | "className">) {
  return (
    <input
      {...resto}
      name={nombre}
      value={valor}
      onChange={(evento) => onCambiar(evento.target.value)}
      className={CLASES_CAMPO}
    />
  );
}

export function Area({
  nombre,
  valor,
  onCambiar,
  filas = 4,
  ...resto
}: {
  nombre: string;
  valor: string;
  onCambiar: (valor: string) => void;
  filas?: number;
} & Omit<
  React.ComponentProps<"textarea">,
  "name" | "value" | "onChange" | "className" | "rows"
>) {
  return (
    <textarea
      {...resto}
      name={nombre}
      rows={filas}
      value={valor}
      onChange={(evento) => onCambiar(evento.target.value)}
      className={CLASES_CAMPO}
    />
  );
}

/**
 * Interruptor de encendido y apagado.
 *
 * El valor viaja en un input oculto y el control es un botón: una casilla
 * dentro de un formulario con acción queda desfasada del estado en cuanto React
 * resetea el formulario, y termina enviando lo contrario de lo que se ve.
 */
export function Interruptor({
  nombre,
  activo,
  onCambiar,
  etiqueta,
}: {
  nombre: string;
  activo: boolean;
  onCambiar: (activo: boolean) => void;
  etiqueta: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <input type="hidden" name={nombre} value={activo ? "on" : ""} />

      <button
        type="button"
        role="switch"
        aria-checked={activo}
        aria-label={etiqueta}
        onClick={() => onCambiar(!activo)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
          activo ? "bg-marca" : "bg-borde-fuerte"
        }`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all duration-200 ease-salida ${
            activo ? "left-5.5" : "left-0.5"
          }`}
        />
      </button>

      <span className="text-sm">{etiqueta}</span>
    </div>
  );
}

/**
 * Bloque de configuración: título, explicación, campos y un botón que solo se
 * habilita cuando hay algo cambiado, igual que en el catálogo.
 */
export function Bloque({
  titulo,
  descripcion,
  sucio,
  guardando,
  error,
  children,
}: {
  titulo: string;
  descripcion?: string;
  sucio: boolean;
  guardando: boolean;
  error: string | null;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-borde bg-fondo-alto p-5 md:p-6">
      <div className="mb-5 flex flex-col gap-1">
        <h2 className="font-display text-xl font-semibold uppercase tracking-tight">
          {titulo}
        </h2>
        {descripcion ? (
          <p className="max-w-2xl text-sm text-tinta-suave">{descripcion}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-4">{children}</div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {/*
          Sin cambios el botón no se apaga en granate translúcido, que se lee
          como un rosa raro: pasa a un contorno neutro. El color de marca se
          reserva para cuando de verdad hay algo que guardar.
        */}
        <button
          type="submit"
          disabled={!sucio || guardando}
          className={`rounded-lg px-4 py-2 font-display text-sm font-semibold uppercase tracking-wide transition duration-200 ease-salida active:translate-y-px ${
            sucio || guardando
              ? "bg-marca text-sobre-marca hover:bg-marca-viva"
              : "cursor-not-allowed border border-borde text-tinta-tenue"
          }`}
        >
          {guardando ? "Guardando…" : sucio ? "Guardar" : "Guardado"}
        </button>

        {error ? <Aviso>{error}</Aviso> : null}
      </div>
    </section>
  );
}
