/**
 * Lectura de variables de entorno con un error entendible si falta alguna.
 * Sin esto, una variable ausente aparece como un 500 sin explicación.
 */

/**
 * ¿Hay un proyecto de Supabase detrás?
 *
 * Existe para que la aplicación arranque sin configurar: el landing público se
 * puede ver y trabajar antes de crear el proyecto, y una variable ausente en
 * producción no tumba la web entera, solo deja el panel fuera de servicio.
 *
 * El valor de ejemplo cuenta como "sin configurar": `.env.local` casi siempre
 * nace de copiar `.env.example`.
 */
export function supabaseConfigurado(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return Boolean(url && clave && !url.includes("xxxx"));
}

function requerida(nombre: string, valor: string | undefined): string {
  if (!valor) {
    throw new Error(
      `Falta la variable de entorno ${nombre}. Copia .env.example a .env.local y llénala.`,
    );
  }
  return valor;
}

export function urlSupabase(): string {
  return requerida("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function claveAnonima(): string {
  return requerida("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function claveServicio(): string {
  return requerida("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
}
