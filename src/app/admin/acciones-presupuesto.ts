"use server";

import { revalidatePath } from "next/cache";

import { desglosar, importeLinea, sumar } from "@/lib/dinero";
import { cargarConfig } from "@/lib/orden/consultas";
import { requerirStaff } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";

import { SIN_ERROR, type EstadoFormulario } from "./estado-formulario";

type LineaEntrante = {
  concepto: string;
  cantidad: number;
  precio_unitario_centimos: number;
  servicio_catalogo_id: string | null;
};

function texto(datos: FormData, campo: string): string {
  return String(datos.get(campo) ?? "").trim();
}

export async function guardarDiagnostico(
  _previo: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  await requerirStaff();

  const ordenId = texto(datos, "orden_id");
  const hallazgos = texto(datos, "hallazgos");

  if (!hallazgos) return { error: "Escribe al menos los hallazgos." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("guardar_diagnostico", {
    p_orden_id: ordenId,
    p_hallazgos: hallazgos,
    p_recomendacion: texto(datos, "recomendacion"),
    p_mecanico: texto(datos, "mecanico"),
  });

  if (error) return { error: error.message };

  revalidatePath(`/admin/orden/${ordenId}`);
  return SIN_ERROR;
}

/**
 * Guarda el borrador del presupuesto.
 *
 * Los montos se calculan **acá**, con `desglosar()`, y viajan ya resueltos a la
 * base. El IGV no se recalcula en SQL: una sola fuente de verdad para esa
 * aritmética (decisión 16).
 */
export async function guardarPresupuesto(
  _previo: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  await requerirStaff();

  const ordenId = texto(datos, "orden_id");

  let lineas: LineaEntrante[];
  try {
    lineas = JSON.parse(texto(datos, "lineas") || "[]") as LineaEntrante[];
  } catch {
    return { error: "No se pudieron leer las líneas del presupuesto." };
  }

  const limpias = lineas.filter(
    (linea) => linea.concepto?.trim() && Number.isFinite(linea.precio_unitario_centimos),
  );

  if (limpias.length === 0) {
    return { error: "Agrega al menos una línea al presupuesto." };
  }

  const config = await cargarConfig();
  const montos = desglosar(
    sumar(limpias.map((l) => importeLinea(l.cantidad, l.precio_unitario_centimos))),
    config,
  );

  const tiempo = Number(texto(datos, "tiempo_estimado_min"));

  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("guardar_presupuesto", {
    p_orden_id: ordenId,
    p_lineas: limpias.map((linea) => ({
      concepto: linea.concepto.trim(),
      cantidad: linea.cantidad,
      precio_unitario_centimos: Math.round(linea.precio_unitario_centimos),
      servicio_catalogo_id: linea.servicio_catalogo_id,
    })),
    p_subtotal_centimos: montos.subtotalCentimos,
    p_igv_centimos: montos.igvCentimos,
    p_total_centimos: montos.totalCentimos,
    p_igv_incluido: config.igvIncluido,
    p_igv_tasa_bp: config.igvTasaBp,
    p_tiempo_estimado_min: Number.isFinite(tiempo) && tiempo > 0 ? tiempo : undefined,
  });

  if (error) return { error: error.message };

  revalidatePath(`/admin/orden/${ordenId}`);
  return SIN_ERROR;
}

/**
 * Emite el presupuesto. A partir de acá deja de poder editarse: es lo que el
 * cliente va a ver y aprobar, y tiene que quedar congelado (decisión 5).
 */
export async function enviarPresupuesto(
  _previo: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  await requerirStaff();

  const ordenId = texto(datos, "orden_id");
  const presupuestoId = texto(datos, "presupuesto_id");

  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("enviar_presupuesto", {
    p_presupuesto_id: presupuestoId,
  });

  if (error) return { error: error.message };

  revalidatePath(`/admin/orden/${ordenId}`);
  revalidatePath("/admin");
  return SIN_ERROR;
}

/**
 * Se llama al abrir WhatsApp. Registra `LINK_GENERADO` y no "cliente
 * notificado": `wa.me` no devuelve confirmación de entrega, y a la base no se le
 * miente (decisión 9, regla 7).
 */
export async function registrarLinkGenerado(ordenId: string): Promise<void> {
  await requerirStaff();

  const supabase = await crearClienteServidor();
  await supabase.rpc("registrar_evento", {
    p_orden_id: ordenId,
    p_tipo: "LINK_GENERADO",
    p_payload: { canal: "whatsapp" },
  });

  revalidatePath(`/admin/orden/${ordenId}`);
}
