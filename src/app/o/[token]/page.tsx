import { notFound } from "next/navigation";
import { Suspense } from "react";

import { formatearSoles } from "@/lib/dinero";
import { formatearFecha, formatearFechaHora } from "@/lib/fecha";
import { resolverToken } from "@/lib/publico";

import { FormularioRespuesta } from "./respuesta";

export const metadata = {
  title: "Tu vehículo · SAF Service",
  // Detrás de este enlace hay placa, nombre y el detalle del trabajo. No tiene
  // por qué acabar en un buscador (decisión 7).
  robots: { index: false, follow: false },
};

type Parametros = PageProps<"/o/[token]">["params"];

export default function PaginaPublica({ params }: PageProps<"/o/[token]">) {
  return (
    <Suspense fallback={<p className="p-8 text-sm opacity-40">Cargando…</p>}>
      <Contenido params={params} />
    </Suspense>
  );
}

async function Contenido({ params }: { params: Parametros }) {
  const { token } = await params;
  const orden = await resolverToken(token);

  if (!orden) notFound();

  const { presupuesto } = orden;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-1">
        <p className="text-sm opacity-60">{orden.taller.nombre}</p>
        <h1 className="text-2xl font-semibold">
          {orden.vehiculo.marca} {orden.vehiculo.modelo}
        </h1>
        <p className="text-sm opacity-70">
          <span className="font-mono">{orden.vehiculo.placa}</span>
          {orden.vehiculo.anio ? ` · ${orden.vehiculo.anio}` : ""} · ingresó el{" "}
          {formatearFecha(orden.recibidoEn)}
        </p>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide opacity-60">
          Por qué ingresó
        </h2>
        <p>{orden.motivo}</p>
      </section>

      {orden.diagnostico ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide opacity-60">
            Qué encontramos
          </h2>
          <p className="whitespace-pre-line">{orden.diagnostico.hallazgos}</p>

          {orden.diagnostico.recomendacion ? (
            <>
              <h3 className="text-sm font-medium">Qué recomendamos</h3>
              <p className="whitespace-pre-line opacity-80">
                {orden.diagnostico.recomendacion}
              </p>
            </>
          ) : null}
        </section>
      ) : null}

      {presupuesto ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide opacity-60">
            Presupuesto
          </h2>

          <ul className="flex flex-col divide-y divide-black/10 dark:divide-white/10">
            {presupuesto.lineas.map((linea, indice) => (
              <li key={indice} className="flex justify-between gap-4 py-2">
                <span>
                  {linea.cantidad > 1 ? `${linea.cantidad} × ` : ""}
                  {linea.concepto}
                </span>
                <span className="shrink-0 tabular-nums">
                  {formatearSoles(linea.importeCentimos)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="ml-auto flex w-full max-w-xs flex-col gap-1 text-sm">
            <div className="flex justify-between opacity-70">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{formatearSoles(presupuesto.subtotalCentimos)}</dd>
            </div>
            <div className="flex justify-between opacity-70">
              <dt>IGV ({(presupuesto.igvTasaBp / 100).toFixed(0)} %)</dt>
              <dd className="tabular-nums">{formatearSoles(presupuesto.igvCentimos)}</dd>
            </div>
            <div className="flex justify-between border-t border-black/10 pt-1 text-base font-semibold dark:border-white/15">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatearSoles(presupuesto.totalCentimos)}</dd>
            </div>
          </dl>

          {presupuesto.tiempoEstimadoMin ? (
            <p className="text-sm opacity-70">
              Tiempo estimado de trabajo: {presupuesto.tiempoEstimadoMin} minutos.
            </p>
          ) : null}

          {/*
            Nunca "boleta" (regla 8): en Perú eso es un comprobante SUNAT y esto
            no lo es.
          */}
          <p className="text-xs opacity-50">
            Este documento es un presupuesto (proforma), no un comprobante de pago.
          </p>

          {presupuesto.estado === "ENVIADO" ? (
            <div className="mt-2 flex flex-col gap-3 rounded-lg border border-black/10 p-4 dark:border-white/15">
              <p className="text-sm">
                ¿Autorizas que hagamos este trabajo? Tu respuesta queda registrada
                con la fecha y la versión del presupuesto.
              </p>
              <FormularioRespuesta token={token} />
            </div>
          ) : (
            <div className="mt-2 rounded-lg border border-black/10 p-4 text-sm dark:border-white/15">
              <p className="font-medium">
                {presupuesto.estado === "APROBADO"
                  ? "Aprobaste este presupuesto."
                  : "Rechazaste este presupuesto."}
              </p>
              {presupuesto.respondidoEn ? (
                <p className="mt-1 opacity-70">
                  {formatearFechaHora(presupuesto.respondidoEn)}
                  {presupuesto.respondidoPor ? ` · ${presupuesto.respondidoPor}` : ""}
                </p>
              ) : null}
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-lg border border-black/10 p-4 text-sm dark:border-white/15">
          <p>
            Todavía estamos revisando tu vehículo. Cuando tengamos el diagnóstico
            y el presupuesto, aparecerán acá mismo.
          </p>
        </section>
      )}

      <footer className="border-t border-black/10 pt-4 text-sm opacity-60 dark:border-white/15">
        <p>{orden.taller.nombre}</p>
        {orden.taller.direccion ? <p>{orden.taller.direccion}</p> : null}
        {orden.taller.telefono ? <p>{orden.taller.telefono}</p> : null}
        <p className="mt-2 font-mono text-xs">Orden {orden.numero}</p>
      </footer>
    </main>
  );
}
