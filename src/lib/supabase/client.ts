"use client";

import { createBrowserClient } from "@supabase/ssr";

import { claveAnonima, urlSupabase } from "./env";
import type { Database } from "./tipos";

/**
 * Cliente para componentes de navegador. Usa la clave pública, así que solo
 * puede hacer lo que RLS permita (ARQUITECTURA.md §12).
 */
export function crearClienteNavegador() {
  return createBrowserClient<Database>(urlSupabase(), claveAnonima());
}
