import "server-only";

import { createClient } from "@supabase/supabase-js";

import { claveAnonima, urlSupabase } from "./env";
import type { Database } from "./tipos";

/**
 * Cliente anónimo sin cookies, para lo que se cachea del sitio público.
 *
 * Es el cuarto cliente y hace falta por una razón concreta: dentro de un
 * `use cache` no se puede leer `cookies()`, y `server.ts` las lee siempre para
 * recuperar la sesión. El landing no tiene sesión que recuperar —lo ve
 * cualquiera— así que se lee con la clave pública y RLS decide, igual que si la
 * consulta viniera del navegador.
 *
 * Es el cliente con menos privilegios de los cuatro. Si una consulta suya
 * devuelve algo que no debería ser público, el problema está en RLS, no acá.
 */
export function crearClientePublico() {
  return createClient<Database>(urlSupabase(), claveAnonima(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
