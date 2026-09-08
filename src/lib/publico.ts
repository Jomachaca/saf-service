import "server-only";

import { crearClienteServicio } from "./supabase/admin";

/**
 * Resolución del enlace público `/o/{token}`.
 *
 * Este es el único sitio del proyecto donde se usa la clave de servicio, que se
 * salta RLS por completo (decisión 7, ARQUITECTURA.md §12). Por eso la
 * responsabilidad de decidir qué ve el cliente vive **acá y en un solo lugar**:
 * la consulta nombra los campos uno por uno y arma un objeto nuevo. Nunca se
 * devuelve la fila tal cual.
 *
 * Lo que queda deliberadamente fuera: el estado interno de la orden, el box, la
 * bitácora, los ids, quién del taller hizo qué, y el propio token.
 */

export type LineaPublica = {
  concepto: string;
  cantidad: number;
  importeCentimos: number;
};

export type OrdenPublica = {
  numero: string;
  vehiculo: { placa: string; marca: string; modelo: string; anio: number | null };
  cliente: { nombre: string };
  motivo: string;
  recibidoEn: string;

  diagnostico: { hallazgos: string; recomendacion: string } | null;

  presupuesto: {
    version: number;
    estado: "ENVIADO" | "APROBADO" | "RECHAZADO";
    lineas: LineaPublica[];
    subtotalCentimos: number;
    igvCentimos: number;
    totalCentimos: number;
    igvIncluido: boolean;
    igvTasaBp: number;
    tiempoEstimadoMin: number | null;
    respondidoEn: string | null;
    respondidoPor: string | null;
  } | null;

  taller: { nombre: string; telefono: string; direccion: string };
};

export async function resolverToken(token: string): Promise<OrdenPublica | null> {
  // Un token mal formado no llega a consultar nada.
  if (!token || token.length < 20 || !/^[A-Za-z0-9_-]+$/.test(token)) return null;

  const db = crearClienteServicio();

  const { data: orden } = await db
    .from("orden_servicio")
    .select(
      `
        id, numero, motivo_ingreso, recibido_en,
        vehiculo:vehiculo_id ( placa, marca, modelo, anio ),
        cliente:cliente_id ( nombre )
      `,
    )
    .eq("token_publico", token)
    .maybeSingle();

  if (!orden) return null;

  const [{ data: diagnostico }, { data: presupuestos }, { data: config }] = await Promise.all([
    db
      .from("diagnostico")
      .select("hallazgos, recomendacion")
      .eq("orden_id", orden.id)
      .maybeSingle(),
    db
      .from("presupuesto")
      .select(
        `
          version, estado, subtotal_centimos, igv_centimos, total_centimos,
          igv_incluido, igv_tasa_bp, tiempo_estimado_min, respondido_en, respondido_por,
          lineas:linea_presupuesto ( concepto, cantidad, precio_unitario_centimos, orden_visual )
        `,
      )
      .eq("orden_id", orden.id)
      .neq("estado", "BORRADOR")
      .order("version", { ascending: false })
      .limit(1),
    db
      .from("config_sitio")
      .select("nombre_taller, telefono, direccion")
      .eq("id", 1)
      .maybeSingle(),
  ]);

  const vigente = presupuestos?.[0] ?? null;
  const vehiculo = orden.vehiculo as unknown as OrdenPublica["vehiculo"] | null;
  const cliente = orden.cliente as unknown as { nombre: string } | null;

  return {
    // `numero` es una columna generada: los tipos la dan como anulable.
    numero: orden.numero ?? "",
    vehiculo: {
      placa: vehiculo?.placa ?? "",
      marca: vehiculo?.marca ?? "",
      modelo: vehiculo?.modelo ?? "",
      anio: vehiculo?.anio ?? null,
    },
    cliente: { nombre: cliente?.nombre ?? "" },
    motivo: orden.motivo_ingreso,
    recibidoEn: orden.recibido_en,

    diagnostico: diagnostico
      ? { hallazgos: diagnostico.hallazgos, recomendacion: diagnostico.recomendacion }
      : null,

    presupuesto: vigente
      ? {
          version: vigente.version,
          estado: vigente.estado as "ENVIADO" | "APROBADO" | "RECHAZADO",
          lineas: [...(vigente.lineas ?? [])]
            .sort((a, b) => a.orden_visual - b.orden_visual)
            .map((linea) => ({
              concepto: linea.concepto,
              cantidad: Number(linea.cantidad),
              importeCentimos: Math.round(
                Number(linea.cantidad) * linea.precio_unitario_centimos,
              ),
            })),
          subtotalCentimos: vigente.subtotal_centimos,
          igvCentimos: vigente.igv_centimos,
          totalCentimos: vigente.total_centimos,
          igvIncluido: vigente.igv_incluido,
          igvTasaBp: vigente.igv_tasa_bp,
          tiempoEstimadoMin: vigente.tiempo_estimado_min,
          respondidoEn: vigente.respondido_en,
          respondidoPor: vigente.respondido_por,
        }
      : null,

    taller: {
      nombre: config?.nombre_taller ?? "SAF Service",
      telefono: config?.telefono ?? "",
      direccion: config?.direccion ?? "",
    },
  };
}

/** Respuesta del cliente. También pasa por la clave de servicio: no hay sesión. */
export async function responderComoCliente(
  token: string,
  decision: "APROBADO" | "RECHAZADO",
  nombre: string,
): Promise<{ error: string | null }> {
  const db = crearClienteServicio();

  const { error } = await db.rpc("responder_presupuesto", {
    p_token: token,
    p_decision: decision,
    p_nombre: nombre,
  });

  return { error: error?.message ?? null };
}
