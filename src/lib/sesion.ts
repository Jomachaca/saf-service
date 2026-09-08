import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { crearClienteServidor } from "./supabase/server";

export type Perfil = {
  id: string;
  nombre: string;
  rol: string;
  activo: boolean;
};

/**
 * Tres desenlaces, y hay que distinguirlos.
 *
 * El del medio parece un detalle y no lo es: alguien puede tener sesión válida
 * de Supabase y no ser staff, porque su cuenta se creó en el panel de Supabase y
 * nadie le insertó la fila en `perfil`, o porque lo desactivaron. Tratar ese caso
 * como "no hay sesión" produce un bucle infinito —/admin manda a /acceso, el
 * proxy ve la sesión y manda de vuelta a /admin— que en pantalla se ve como un
 * parpadeo constante. Por eso tiene su propio estado y su propia página.
 */
export type EstadoSesion =
  | { tipo: "sin-sesion" }
  | { tipo: "sin-perfil"; usuarioId: string; email: string | null }
  | { tipo: "staff"; perfil: Perfil };

export const obtenerSesion = cache(async (): Promise<EstadoSesion> => {
  const supabase = await crearClienteServidor();

  // getUser() valida el token contra Supabase; getSession() se conforma con la
  // cookie, que el navegador puede haber tocado.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { tipo: "sin-sesion" };

  const { data: perfil } = await supabase
    .from("perfil")
    .select("id, nombre, rol, activo")
    .eq("id", user.id)
    .maybeSingle();

  if (!perfil?.activo) {
    return { tipo: "sin-perfil", usuarioId: user.id, email: user.email ?? null };
  }

  return { tipo: "staff", perfil: perfil as Perfil };
});

/**
 * Para todo lo que cuelga de /admin. Esto no es la defensa —la defensa es RLS en
 * la base—, es el guardia de la UI.
 *
 * **No lleva `use cache: private`, y es a propósito.** Lo tuvo, y hacía parpadear
 * el panel: esa directiva exige un `cacheLife` explícito, y sin él el valor
 * expira enseguida, el navegador vuelve a pedir la página y el `<Suspense>` de
 * carga aparece una y otra vez. Cachear la sesión solo sirve para prefetchear UI
 * autenticada; leerla son dos consultas baratas. Si algún día se vuelve a
 * cachear, tiene que ser con `cacheLife({ stale: 300 })` o más.
 */
export async function requerirStaff(): Promise<Perfil> {
  const sesion = await obtenerSesion();

  if (sesion.tipo === "sin-sesion") redirect("/acceso");
  if (sesion.tipo === "sin-perfil") redirect("/sin-perfil");

  return sesion.perfil;
}
