"use client";

import { useActionState, useState } from "react";

import { iniciarSesion, type EstadoAcceso } from "./acciones";

const ESTADO_INICIAL: EstadoAcceso = { error: null };

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
          required
          className="rounded-lg border border-borde px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Contraseña</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-lg border border-borde px-3 py-2"
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
        className="rounded-lg bg-marca px-4 py-2 font-medium text-sobre-marca disabled:opacity-60"
      >
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
