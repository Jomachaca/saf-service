import { CalendarCheck, ClipboardText, Wrench } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { supabaseConfigurado } from "@/lib/supabase/env";

import { FormularioAcceso } from "./formulario";

export const metadata = {
  title: "Acceso",
};

export default function PaginaAcceso() {
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <PanelMarca />

      <main className="flex flex-1 items-center justify-center px-6 py-12 sm:py-16">
        <div className="al-montar w-full max-w-sm rounded-2xl border border-borde bg-fondo-alto p-6 sm:p-8">
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Ingresar</h1>
          <p className="mt-1 text-sm text-tinta-suave">
            Las cuentas las crea el administrador desde Supabase.
          </p>

          <div className="mt-6">
            {supabaseConfigurado() ? <FormularioAcceso /> : <FaltaSupabase />}
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * El bloque marino de la puerta de entrada al panel: mismo lockup que
 * `MarcaPanel`, la textura de neumático que ya se usa como marco cuando no hay
 * foto, y los tres frentes del sistema para quien todavía no lo conoce.
 */
function PanelMarca() {
  return (
    <div className="huella flex shrink-0 flex-col justify-between gap-10 bg-estructura px-8 py-10 text-sobre-estructura sm:px-12 lg:w-[26rem] lg:px-14 lg:py-14">
      <Link
        href="/"
        className="subrayado self-start text-sm text-white/70 transition-colors duration-200 hover:text-white"
      >
        ← Volver al sitio
      </Link>

      <div className="flex flex-col gap-4">
        <span className="font-display text-4xl font-bold uppercase italic tracking-tight">
          <span className="text-vino-300">SAF</span> Service
        </span>
        <p className="max-w-xs text-lg text-white/80">
          Lo que está pasando ahora mismo, taller adentro.
        </p>
      </div>

      <ul className="flex flex-col gap-3 text-sm text-white/70">
        <li className="flex items-center gap-2.5">
          <Wrench size={18} weight="duotone" className="shrink-0 text-vino-300" />
          Recepción de vehículos
        </li>
        <li className="flex items-center gap-2.5">
          <ClipboardText size={18} weight="duotone" className="shrink-0 text-vino-300" />
          Presupuestos y aprobación
        </li>
        <li className="flex items-center gap-2.5">
          <CalendarCheck size={18} weight="duotone" className="shrink-0 text-vino-300" />
          Reservas y agenda
        </li>
      </ul>
    </div>
  );
}

function FaltaSupabase() {
  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
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
