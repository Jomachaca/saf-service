import { supabaseConfigurado } from "@/lib/supabase/env";

import { FormularioAcceso } from "./formulario";

export const metadata = {
  title: "Acceso · SAF Service",
};

export default function PaginaAcceso() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div>
        <h1 className="text-xl font-semibold">Panel del taller</h1>
        <p className="mt-1 text-sm opacity-70">
          Las cuentas las crea el administrador desde Supabase.
        </p>
      </div>

      {supabaseConfigurado() ? <FormularioAcceso /> : <FaltaSupabase />}
    </main>
  );
}

function FaltaSupabase() {
  return (
    <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
      <p className="font-medium">Todavía no hay proyecto de Supabase conectado.</p>
      <p className="mt-2 opacity-80">
        Llena <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
        <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> en{" "}
        <code className="font-mono">.env.local</code> y reinicia el servidor. Los
        pasos están en <code className="font-mono">docs/PUESTA_EN_MARCHA.md</code>.
      </p>
    </div>
  );
}
