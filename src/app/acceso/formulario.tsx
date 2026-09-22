"use client";

import { useActionState, useState } from "react";

import { iniciarSesion, type EstadoAcceso } from "./acciones";

const ESTADO_INICIAL: EstadoAcceso = { error: null };

const CLASES_INPUT = "w-full rounded-lg border border-borde bg-fondo-alto px-3 py-2";

export function FormularioAcceso() {
  const [estado, accion, enviando] = useActionState(iniciarSesion, ESTADO_INICIAL);

  // Controlado a propósito: React vacía los campos no controlados apenas se
  // envía el formulario, así que una contraseña mal escrita se llevaba también
  // el correo. La contraseña sí conviene que se borre.
  const [email, setEmail] = useState("");

  return (
    <form action={accion} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Correo</span>
        <input
          name="email"
          type="email"
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
          autoComplete="username"
          autoFocus
          required
          className={CLASES_INPUT}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Contraseña</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={CLASES_INPUT}
        />
      </label>

      {estado.error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {estado.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={enviando}
        className="mt-1 rounded-lg bg-marca px-4 py-2.5 font-display text-sm font-semibold uppercase tracking-wide text-sobre-marca transition duration-200 ease-salida hover:bg-marca-viva active:translate-y-px disabled:opacity-60"
      >
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
