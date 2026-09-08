"use client";

import { useActionState } from "react";

import { iniciarSesion, type EstadoAcceso } from "./acciones";

const ESTADO_INICIAL: EstadoAcceso = { error: null };

export function FormularioAcceso() {
  const [estado, accion, enviando] = useActionState(iniciarSesion, ESTADO_INICIAL);

  return (
    <form action={accion} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Correo</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Contraseña</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
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
        className="rounded-md bg-foreground px-4 py-2 font-medium text-background disabled:opacity-60"
      >
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
