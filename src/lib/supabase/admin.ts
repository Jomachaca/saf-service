import "server-only";

import { createClient } from "@supabase/supabase-js";

import { claveServicio, urlSupabase } from "./env";
import type { Database } from "./tipos";

/**
 * Cliente con clave de servicio: se salta RLS por completo.
 *
 * Su única razón de existir es resolver `/o/{token}` en el servidor y devolver
 * solo los campos que el cliente debe ver (decisión 7, ARQUITECTURA.md §12).
 * Cualquier otro uso probablemente sea un error: si el staff necesita leer algo,
 * lo lee con su sesión y RLS decide.
 *
 * No guarda sesión ni refresca tokens: no hay usuario detrás.
 */
export function crearClienteServicio() {
  return createClient<Database>(urlSupabase(), claveServicio(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
