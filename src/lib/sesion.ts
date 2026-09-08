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
 * Lee el perfil del staff que hace la petición, o null si no hay sesión válida.
 *
 * `cache()` de React lo memoiza dentro del mismo render, para que varios
 * componentes lo pidan sin consultar dos veces.
 */
export const obtenerPerfil = cache(async (): Promise<Perfil | null> => {
  const supabase = await crearClienteServidor();

  // getUser() valida el token contra Supabase; getSession() se conforma con la
  // cookie, que el navegador puede haber tocado.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: perfil } = await supabase
    .from("perfil")
    .select("id, nombre, rol, activo")
    .eq("id", user.id)
    .maybeSingle();

  if (!perfil?.activo) return null;

  return perfil as Perfil;
});

/**
 * Para todo lo que cuelga de /admin. Redirige si no hay staff activo detrás.
 *
 * `use cache: private` guarda el resultado en el navegador de esa persona y
 * nunca en el servidor. Es la única forma de cachear algo que depende de
 * `cookies()` con Cache Components activo (decisión 22). El `redirect()`
 * interrumpe el render lanzando, así que el caso "no hay sesión" nunca se
 * cachea: solo se guarda un perfil resuelto.
 *
 * Esto no es la defensa: la defensa es RLS en la base. Es el guardia de la UI.
 */
export async function requerirStaff(): Promise<Perfil> {
  "use cache: private";

  const perfil = await obtenerPerfil();
  if (!perfil) redirect("/acceso");

  return perfil;
}
