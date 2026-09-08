"use client";

import { useActionState, useMemo, useState } from "react";

import {
  centimosDesdeTexto,
  desglosar,
  formatearSoles,
  importeLinea,
  sumar,
  type ConfigIgv,
} from "@/lib/dinero";
import { formatearFechaHora } from "@/lib/fecha";
import {
  ETIQUETA_CATEGORIA,
  ETIQUETA_PRESUPUESTO,
  type Presupuesto,
  type ServicioCatalogo,
} from "@/lib/orden/presupuesto";

import { Aviso } from "../../componentes";
import { SIN_ERROR } from "../../estado-formulario";
import { enviarPresupuesto, guardarPresupuesto } from "../../acciones-presupuesto";

type LineaEditable = {
  clave: number;
  concepto: string;
  cantidad: string;
  precio: string;
  servicioCatalogoId: string | null;
};

let siguienteClave = 1;

function lineaVacia(): LineaEditable {
  return {
    clave: siguienteClave++,
    concepto: "",
    cantidad: "1",
    precio: "",
    servicioCatalogoId: null,
  };
}

const CLASES_INPUT =
  "w-full rounded-md border border-black/15 px-2.5 py-1.5 text-sm dark:border-white/20";

/**
 * Un solo flujo de presupuesto (decisión 12 y regla 10).
 *
 * No hay "modo automático" y "modo manual": una sola tabla de líneas y un solo
 * formulario. Elegir del catálogo es un atajo de llenado que copia el precio a
 * la línea, y a partir de ahí la línea es tan editable como una escrita a mano.
 */
export function EditorPresupuesto({
  ordenId,
  catalogo,
  config,
  borrador,
}: {
  ordenId: string;
  catalogo: ServicioCatalogo[];
  config: ConfigIgv;
  borrador: Presupuesto | null;
}) {
  const [guardado, guardar, guardando] = useActionState(guardarPresupuesto, SIN_ERROR);
  const [enviado, enviar, enviando] = useActionState(enviarPresupuesto, SIN_ERROR);

  const [lineas, setLineas] = useState<LineaEditable[]>(() =>
    borrador?.lineas.length
      ? borrador.lineas.map((linea) => ({
          clave: siguienteClave++,
          concepto: linea.concepto,
          cantidad: String(linea.cantidad),
          precio: (linea.precio_unitario_centimos / 100).toFixed(2),
          servicioCatalogoId: linea.servicio_catalogo_id,
        }))
      : [lineaVacia()],
  );

  const [tiempo, setTiempo] = useState(
    borrador?.tiempo_estimado_min ? String(borrador.tiempo_estimado_min) : "",
  );

  const montos = useMemo(() => {
    const importes = lineas.map((linea) => {
      const centimos = centimosDesdeTexto(linea.precio) ?? 0;
      const cantidad = Number(linea.cantidad.replace(",", ".")) || 0;
      return importeLinea(cantidad, centimos);
    });
    return desglosar(sumar(importes), config);
  }, [lineas, config]);

  const paraEnviar = lineas
    .filter((linea) => linea.concepto.trim() && centimosDesdeTexto(linea.precio) !== null)
    .map((linea) => ({
      concepto: linea.concepto.trim(),
      cantidad: Number(linea.cantidad.replace(",", ".")) || 1,
      precio_unitario_centimos: centimosDesdeTexto(linea.precio) ?? 0,
      servicio_catalogo_id: linea.servicioCatalogoId,
    }));

  function agregarDelCatalogo(servicioId: string) {
    const servicio = catalogo.find((s) => s.id === servicioId);
    if (!servicio) return;

    setLineas((previas) => [
      ...previas.filter((linea) => linea.concepto.trim() || linea.precio.trim()),
      {
        clave: siguienteClave++,
        concepto: servicio.nombre,
        cantidad: "1",
        // Decisión 5: el precio se COPIA acá. A partir de este momento la línea
        // ya no depende del catálogo, aunque mañana suba.
        precio: (servicio.precio_base_centimos / 100).toFixed(2),
        servicioCatalogoId: servicio.id,
      },
    ]);

    if (!tiempo) setTiempo(String(servicio.duracion_min));
  }

  function actualizar(clave: number, campo: keyof LineaEditable, valor: string) {
    setLineas((previas) =>
      previas.map((linea) =>
        linea.clave === clave
          ? {
              ...linea,
              [campo]: valor,
              // Si se edita el concepto, deja de ser trazable al catálogo.
              servicioCatalogoId: campo === "concepto" ? null : linea.servicioCatalogoId,
            }
          : linea,
      ),
    );
  }

  const porCategoria = useMemo(() => {
    const grupos = new Map<string, ServicioCatalogo[]>();
    for (const servicio of catalogo) {
      const lista = grupos.get(servicio.categoria) ?? [];
      lista.push(servicio);
      grupos.set(servicio.categoria, lista);
    }
    return [...grupos.entries()];
  }, [catalogo]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value=""
          onChange={(evento) => agregarDelCatalogo(evento.target.value)}
          className={`${CLASES_INPUT} max-w-xs`}
        >
          <option value="">Agregar del catálogo…</option>
          {porCategoria.map(([categoria, servicios]) => (
            <optgroup key={categoria} label={ETIQUETA_CATEGORIA[categoria] ?? categoria}>
              {servicios.map((servicio) => (
                <option key={servicio.id} value={servicio.id}>
                  {servicio.nombre} — {formatearSoles(servicio.precio_base_centimos)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setLineas((previas) => [...previas, lineaVacia()])}
          className="rounded-md border border-black/20 px-3 py-1.5 text-sm dark:border-white/25"
        >
          Línea libre
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-lg text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-xs opacity-60 dark:border-white/15">
              <th className="pb-2 font-medium">Concepto</th>
              <th className="w-20 pb-2 font-medium">Cant.</th>
              <th className="w-28 pb-2 font-medium">Precio S/</th>
              <th className="w-28 pb-2 text-right font-medium">Importe</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {lineas.map((linea) => {
              const centimos = centimosDesdeTexto(linea.precio);
              const cantidad = Number(linea.cantidad.replace(",", ".")) || 0;
              const importe = centimos === null ? null : importeLinea(cantidad, centimos);

              return (
                <tr key={linea.clave} className="border-b border-black/5 dark:border-white/10">
                  <td className="py-1.5 pr-2">
                    <input
                      value={linea.concepto}
                      onChange={(e) => actualizar(linea.clave, "concepto", e.target.value)}
                      placeholder="Qué se va a hacer"
                      className={CLASES_INPUT}
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      value={linea.cantidad}
                      onChange={(e) => actualizar(linea.clave, "cantidad", e.target.value)}
                      inputMode="decimal"
                      className={CLASES_INPUT}
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      value={linea.precio}
                      onChange={(e) => actualizar(linea.clave, "precio", e.target.value)}
                      inputMode="decimal"
                      placeholder="0.00"
                      className={CLASES_INPUT}
                    />
                  </td>
                  <td className="py-1.5 pr-2 text-right tabular-nums">
                    {importe === null ? (
                      <span className="opacity-30">—</span>
                    ) : (
                      formatearSoles(importe)
                    )}
                  </td>
                  <td className="py-1.5 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        setLineas((previas) =>
                          previas.length === 1
                            ? [lineaVacia()]
                            : previas.filter((otra) => otra.clave !== linea.clave),
                        )
                      }
                      aria-label="Quitar línea"
                      className="px-1 opacity-40 hover:opacity-100"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Totales montos={montos} config={config} />

      <label className="flex items-center gap-2 text-sm">
        <span className="opacity-70">Tiempo estimado (min)</span>
        <input
          value={tiempo}
          onChange={(evento) => setTiempo(evento.target.value)}
          inputMode="numeric"
          className={`${CLASES_INPUT} w-24`}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <form action={guardar}>
          <input type="hidden" name="orden_id" value={ordenId} />
          <input type="hidden" name="tiempo_estimado_min" value={tiempo} />
          <input type="hidden" name="lineas" value={JSON.stringify(paraEnviar)} />
          <button
            type="submit"
            disabled={guardando || paraEnviar.length === 0}
            className="rounded-md border border-black/20 px-3 py-1.5 text-sm font-medium disabled:opacity-50 dark:border-white/25"
          >
            {guardando ? "Guardando…" : "Guardar borrador"}
          </button>
        </form>

        {borrador ? (
          <form action={enviar}>
            <input type="hidden" name="orden_id" value={ordenId} />
            <input type="hidden" name="presupuesto_id" value={borrador.id} />
            <button
              type="submit"
              disabled={enviando}
              className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background disabled:opacity-50"
            >
              {enviando ? "Emitiendo…" : "Emitir presupuesto"}
            </button>
          </form>
        ) : (
          <span className="text-sm opacity-50">Guarda el borrador para poder emitirlo.</span>
        )}
      </div>

      {guardado.error ? <Aviso>{guardado.error}</Aviso> : null}
      {enviado.error ? <Aviso>{enviado.error}</Aviso> : null}
    </div>
  );
}

function Totales({
  montos,
  config,
}: {
  montos: { subtotalCentimos: number; igvCentimos: number; totalCentimos: number };
  config: ConfigIgv;
}) {
  return (
    <dl className="ml-auto flex w-full max-w-xs flex-col gap-1 text-sm">
      <div className="flex justify-between opacity-70">
        <dt>Subtotal</dt>
        <dd className="tabular-nums">{formatearSoles(montos.subtotalCentimos)}</dd>
      </div>
      <div className="flex justify-between opacity-70">
        <dt>IGV ({(config.igvTasaBp / 100).toFixed(0)} %)</dt>
        <dd className="tabular-nums">{formatearSoles(montos.igvCentimos)}</dd>
      </div>
      <div className="flex justify-between border-t border-black/10 pt-1 font-semibold dark:border-white/15">
        <dt>Total</dt>
        <dd className="tabular-nums">{formatearSoles(montos.totalCentimos)}</dd>
      </div>
      <p className="text-xs opacity-50">
        {config.igvIncluido
          ? "Los precios del catálogo ya incluyen IGV."
          : "El IGV se suma a los precios del catálogo."}
      </p>
    </dl>
  );
}

/**
 * Un presupuesto ya emitido no se edita: es lo que el cliente vio (decisión 5).
 * Si hace falta cambiarlo, se arma una versión nueva.
 */
export function PresupuestoEmitido({ presupuesto }: { presupuesto: Presupuesto }) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-black/10 p-4 dark:border-white/15">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-sm font-medium">Versión {presupuesto.version}</span>
        <span className="text-xs opacity-60">
          {ETIQUETA_PRESUPUESTO[presupuesto.estado]}
        </span>
        {presupuesto.enviado_en ? (
          <span className="text-xs opacity-50">
            enviado {formatearFechaHora(presupuesto.enviado_en)}
          </span>
        ) : null}
      </div>

      <ul className="flex flex-col gap-1 text-sm">
        {presupuesto.lineas.map((linea) => (
          <li key={linea.id} className="flex justify-between gap-3">
            <span className="opacity-80">
              {linea.cantidad > 1 ? `${linea.cantidad} × ` : ""}
              {linea.concepto}
            </span>
            <span className="shrink-0 tabular-nums">
              {formatearSoles(importeLinea(linea.cantidad, linea.precio_unitario_centimos))}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex justify-between border-t border-black/10 pt-2 text-sm font-semibold dark:border-white/15">
        <span>Total</span>
        <span className="tabular-nums">{formatearSoles(presupuesto.total_centimos)}</span>
      </div>

      {presupuesto.respondido_en ? (
        <p className="text-xs opacity-60">
          {presupuesto.estado === "APROBADO" ? "Aprobado" : "Rechazado"} el{" "}
          {formatearFechaHora(presupuesto.respondido_en)}
          {presupuesto.respondido_por ? ` por ${presupuesto.respondido_por}` : ""}
        </p>
      ) : null}
    </div>
  );
}
