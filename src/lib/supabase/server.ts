import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { claveAnonima, urlSupabase } from "./env";
import type { Database } from "./tipos";

/**
 * Cliente para Server Components, server actions y route handlers.
 *
 * Se crea uno nuevo por request: nunca compartir el cliente entre requests,
 * porque lleva la sesión del usuario adentro.
 */
export async function crearClienteServidor() {
  const almacenCookies = await cookies();

  return createServerClient<Database>(urlSupabase(), claveAnonima(), {
    cookies: {
      getAll() {
        return almacenCookies.getAll();
      },
      setAll(cookiesNuevas) {
        try {
          for (const { name, value, options } of cookiesNuevas) {
            almacenCookies.set(name, value, options);
          }
        } catch {
          // Un Server Component no puede escribir cookies. No es un problema:
          // el refresco de sesión lo hace `src/proxy.ts` antes de renderizar.
        }
      },
    },
  });
}
