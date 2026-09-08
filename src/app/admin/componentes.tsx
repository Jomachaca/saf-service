import Link from "next/link";

import { ETIQUETA_ESTADO, type Estado } from "@/lib/orden/estados";
import { ETIQUETA_UBICACION, type Ubicacion } from "@/lib/orden/ubicacion";

/**
 * Los colores son los de ARQUITECTURA.md §3. Se escriben completos y no
 * armados por concatenación: Tailwind no ve las clases construidas en runtime.
 */
const CLASES_ESTADO: Record<Estado, string> = {
  RECIBIDO: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  DIAGNOSTICO: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  ESPERANDO_APROBACION: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  EN_TRABAJO: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  LISTO: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
};

export function Insignia({ estado }: { estado: Estado }) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${CLASES_ESTADO[estado]}`}
    >
      {ETIQUETA_ESTADO[estado]}
    </span>
  );
}

export function Ubicada({
  ubicacion,
  box,
}: {
  ubicacion: Ubicacion;
  box?: string | null;
}) {
  return (
    <span className="text-xs opacity-60">
      {ubicacion === "BOX" && box ? box : ETIQUETA_UBICACION[ubicacion]}
    </span>
  );
}

export function Seccion({
  titulo,
  accion,
  children,
}: {
  titulo: string;
  accion?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide opacity-60">
          {titulo}
        </h2>
        {accion}
      </div>
      {children}
    </section>
  );
}

export function EnlaceOrden({
  id,
  numero,
  children,
}: {
  id: string;
  numero: string;
  children?: React.ReactNode;
}) {
  return (
    <Link
      href={`/admin/orden/${id}`}
      className="underline-offset-4 hover:underline"
      title={numero}
    >
      {children ?? numero}
    </Link>
  );
}

export function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="text-sm text-red-600 dark:text-red-400">
      {children}
    </p>
  );
}
