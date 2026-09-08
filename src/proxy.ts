import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { claveAnonima, supabaseConfigurado, urlSupabase } from "@/lib/supabase/env";

/**
 * En Next.js 16 esto se llama `proxy`; hasta la 15 era `middleware`. Mismo
 * comportamiento, otro nombre y otro archivo.
 *
 * Hace dos cosas:
 *
 * 1. Refresca la sesión de Supabase y reescribe las cookies. Sin esto la sesión
 *    del staff se cae sola, porque un Server Component no puede escribir cookies.
 * 2. Un chequeo **optimista** de sesión para /admin: evita renderizar el panel a
 *    quien no tiene sesión. No es la defensa real —eso es RLS más la
 *    verificación en el layout de /admin—, solo evita el viaje de ida y vuelta.
 */
export async function proxy(request: NextRequest) {
  const ruta = request.nextUrl.pathname;

  // Sin proyecto de Supabase todavía no hay sesión que refrescar. El landing
  // tiene que seguir viéndose; el panel manda a /acceso, que explica qué falta.
  if (!supabaseConfigurado()) {
    if (ruta.startsWith("/admin")) {
      const destino = request.nextUrl.clone();
      destino.pathname = "/acceso";
      destino.search = "";
      return NextResponse.redirect(destino);
    }
    return NextResponse.next({ request });
  }

  let respuesta = NextResponse.next({ request });

  const supabase = createServerClient(urlSupabase(), claveAnonima(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesNuevas) {
        for (const { name, value } of cookiesNuevas) {
          request.cookies.set(name, value);
        }
        respuesta = NextResponse.next({ request });
        for (const { name, value, options } of cookiesNuevas) {
          respuesta.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser() y no getSession(): valida el token contra Supabase en vez de
  // confiar en lo que traiga la cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && ruta.startsWith("/admin")) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/acceso";
    destino.search = "";
    return NextResponse.redirect(destino);
  }

  if (user && ruta === "/acceso") {
    const destino = request.nextUrl.clone();
    destino.pathname = "/admin";
    destino.search = "";
    return NextResponse.redirect(destino);
  }

  return respuesta;
}

export const config = {
  matcher: [
    /*
     * Todo salvo estáticos e imágenes. `/o/{token}` sí pasa por acá —no le hace
     * daño— pero se resuelve en servidor con clave de servicio, sin sesión.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
