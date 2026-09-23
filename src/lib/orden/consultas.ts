import "server-only";

import { crearClienteServidor } from "@/lib/supabase/server";

import type {
  ConfigSitio,
  Diagnostico,
  Presupuesto,
  ServicioCatalogo,
} from "./presupuesto";
import type { Espacio, EspacioConCupo } from "./espacio";
import type { Estado } from "./estados";
import type { Ubicacion } from "./ubicacion";

export type OrdenEnTablero = {
  id: string;
  numero: string;
  estado: Estado;
  ubicacion: Ubicacion;
  espacio_id: string | null;
  motivo_ingreso: string;
  recibido_en: string;
  vehiculo: { placa: string; marca: string; modelo: string; tipo: string } | null;
  cliente: { nombre: string; telefono: string } | null;
};

export type Tablero = {
  espacios: Espacio[];
  /** Órdenes sin cerrar. Es la respuesta a "qué está pasando ahora en el taller". */
  activas: OrdenEnTablero[];
  /**
   * espacio_id → las órdenes que están ahí. Es una lista y no una orden
   * suelta porque un espacio puede tener cupo para varios (decisión 35), y
   * puede incluir una orden LISTO que nadie pasó a recoger.
   */
  ocupacion: Map<string, OrdenEnTablero[]>;
  contadores: Record<Estado, number>;
};

const CAMPOS_TABLERO = `
  id, numero, estado, ubicacion, espacio_id, motivo_ingreso, recibido_en,
  vehiculo ( placa, marca, modelo, tipo ),
  cliente ( nombre, telefono )
`;

export async function cargarTablero(): Promise<Tablero> {
  const supabase = await crearClienteServidor();

  const [{ data: espacios }, { data: ordenes }] = await Promise.all([
    supabase.from("espacio").select("*").order("orden_visual"),
    // Una orden LISTO que todavía ocupa un espacio tiene que salir en la
    // grilla aunque no esté activa: el sitio sigue ocupado (decisión 2).
    supabase
      .from("orden_servicio")
      .select(CAMPOS_TABLERO)
      .or("estado.neq.LISTO,espacio_id.not.is.null")
      .order("recibido_en", { ascending: false })
      .overrideTypes<OrdenEnTablero[]>(),
  ]);

  const todas = ordenes ?? [];
  const activas = todas.filter((orden) => orden.estado !== "LISTO");

  const ocupacion = new Map<string, OrdenEnTablero[]>();
  for (const orden of todas) {
    if (!orden.espacio_id) continue;
    ocupacion.set(orden.espacio_id, [...(ocupacion.get(orden.espacio_id) ?? []), orden]);
  }

  const contadores = {
    RECIBIDO: 0,
    DIAGNOSTICO: 0,
    ESPERANDO_APROBACION: 0,
    EN_TRABAJO: 0,
    LISTO: 0,
  } satisfies Record<Estado, number>;

  for (const orden of activas) contadores[orden.estado] += 1;

  return { espacios: (espacios ?? []) as Espacio[], activas, ocupacion, contadores };
}

/**
 * Cruza los espacios con la ocupación del tablero. Lo usan la recepción y el
 * detalle de la orden para no ofrecer un sitio donde ya no entra nadie; quien
 * lo impide de verdad es el disparador `espacio_con_cupo` de la base.
 */
export function conCupo(
  espacios: Espacio[],
  ocupacion: Map<string, OrdenEnTablero[]>,
): EspacioConCupo[] {
  return espacios.map((espacio) => ({
    ...espacio,
    ocupados: ocupacion.get(espacio.id)?.length ?? 0,
  }));
}

export type EventoOrden = {
  id: string;
  tipo: string;
  payload: unknown;
  creado_en: string;
  actor: string | null;
  actor_descripcion: string | null;
};

export type DetalleOrden = {
  id: string;
  numero: string;
  estado: Estado;
  ubicacion: Ubicacion;
  espacio_id: string | null;
  motivo_ingreso: string;
  kilometraje: number | null;
  token_publico: string;
  recibido_en: string;
  cerrado_en: string | null;
  vehiculo: {
    id: string;
    placa: string;
    marca: string;
    modelo: string;
    anio: number | null;
    tipo: string;
  } | null;
  cliente: { id: string; nombre: string; telefono: string; email: string | null } | null;
};

export async function cargarOrden(id: string): Promise<DetalleOrden | null> {
  const supabase = await crearClienteServidor();

  const { data } = await supabase
    .from("orden_servicio")
    .select(
      `
        id, numero, estado, ubicacion, espacio_id, motivo_ingreso, kilometraje,
        token_publico, recibido_en, cerrado_en,
        vehiculo ( id, placa, marca, modelo, anio, tipo ),
        cliente ( id, nombre, telefono, email )
      `,
    )
    .eq("id", id)
    .maybeSingle()
    .overrideTypes<DetalleOrden>();

  return data ?? null;
}

export async function cargarEventos(ordenId: string): Promise<EventoOrden[]> {
  const supabase = await crearClienteServidor();

  const { data } = await supabase
    .from("evento_orden")
    .select("id, tipo, payload, creado_en, actor, actor_descripcion")
    .eq("orden_id", ordenId)
    .order("creado_en", { ascending: false });

  return (data ?? []) as EventoOrden[];
}

/**
 * Los espacios que se pueden elegir al recibir o al mover. Solo los activos:
 * desactivar un espacio es justamente decir «no lo ofrezcas más», sin borrar
 * el historial de lo que pasó por ahí.
 */
export async function cargarEspacios(): Promise<Espacio[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("espacio")
    .select("*")
    .eq("activo", true)
    .order("orden_visual");

  return (data ?? []) as Espacio[];
}

export type VehiculoEncontrado = {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  anio: number | null;
  tipo: string;
  cliente: { id: string; nombre: string; telefono: string };
  /** Si tiene una orden abierta no se puede recepcionar otra vez. */
  ordenAbierta: { id: string; numero: string } | null;
};

/**
 * Búsqueda de la recepción rápida: una sola caja donde se escribe la placa, el
 * teléfono o el nombre, que es lo que el recepcionista tiene a mano con el auto
 * enfrente (ARQUITECTURA.md §10).
 *
 * La consulta vive en la base (`buscar_vehiculo`) porque PostgREST no deja
 * combinar en un `or` una columna propia con una de tabla embebida.
 */
export async function buscarVehiculo(termino: string): Promise<VehiculoEncontrado[]> {
  const limpio = termino.trim();
  if (limpio.length < 3) return [];

  const supabase = await crearClienteServidor();
  const { data } = await supabase.rpc("buscar_vehiculo", { p_termino: limpio });

  return (data ?? []).map((fila) => ({
    id: fila.id,
    placa: fila.placa,
    marca: fila.marca,
    modelo: fila.modelo,
    anio: fila.anio,
    tipo: fila.tipo,
    cliente: {
      id: fila.cliente_id,
      nombre: fila.cliente_nombre,
      telefono: fila.cliente_telefono,
    },
    ordenAbierta: fila.orden_abierta_id
      ? { id: fila.orden_abierta_id, numero: fila.orden_abierta_numero }
      : null,
  }));
}

// ---------------------------------------------------------------------------
// Fase 2: diagnóstico, presupuesto y configuración
// ---------------------------------------------------------------------------

const CAMPOS_PRESUPUESTO = `
  id, version, estado, subtotal_centimos, igv_centimos, total_centimos,
  igv_incluido, igv_tasa_bp, tiempo_estimado_min,
  enviado_en, respondido_en, respondido_por, creado_en,
  lineas:linea_presupuesto (
    id, concepto, cantidad, precio_unitario_centimos, servicio_catalogo_id, orden_visual
  )
`;

export async function cargarDiagnostico(ordenId: string): Promise<Diagnostico | null> {
  const supabase = await crearClienteServidor();

  const { data } = await supabase
    .from("diagnostico")
    .select("id, hallazgos, recomendacion, mecanico, actualizado_en")
    .eq("orden_id", ordenId)
    .maybeSingle();

  return data ?? null;
}

/**
 * Todos los presupuestos de la orden, del más nuevo al más viejo.
 *
 * Se devuelven todos y no solo el vigente: la decisión 5 tiene poco sentido si
 * el historial no se puede ver. Un presupuesto rechazado en enero debe seguir
 * mostrando lo que decía en enero.
 */
export async function cargarPresupuestos(ordenId: string): Promise<Presupuesto[]> {
  const supabase = await crearClienteServidor();

  const { data } = await supabase
    .from("presupuesto")
    .select(CAMPOS_PRESUPUESTO)
    .eq("orden_id", ordenId)
    .order("version", { ascending: false })
    .overrideTypes<Presupuesto[]>();

  return (data ?? []).map((presupuesto) => ({
    ...presupuesto,
    lineas: [...presupuesto.lineas].sort((a, b) => a.orden_visual - b.orden_visual),
  }));
}

export async function cargarCatalogo(soloActivos = true): Promise<ServicioCatalogo[]> {
  const supabase = await crearClienteServidor();

  let consulta = supabase
    .from("servicio_catalogo")
    .select("id, categoria, nombre, precio_base_centimos, duracion_min, activo, orden_visual")
    .order("orden_visual");

  if (soloActivos) consulta = consulta.eq("activo", true);

  const { data } = await consulta;
  return (data ?? []) as ServicioCatalogo[];
}

/**
 * La fila única de configuración. Hoy solo se usan el IGV y las plantillas de
 * mensaje; el resto de campos son de la Fase 3.
 */
export async function cargarConfig(): Promise<ConfigSitio> {
  const supabase = await crearClienteServidor();

  const { data } = await supabase
    .from("config_sitio")
    .select("nombre_taller, whatsapp, plantillas_mensaje, igv_incluido, igv_tasa_bp")
    .eq("id", 1)
    .maybeSingle();

  return {
    nombreTaller: data?.nombre_taller ?? "SAF Service",
    whatsapp: data?.whatsapp ?? "",
    plantillas: (data?.plantillas_mensaje ?? {}) as Record<string, string>,
    igvIncluido: data?.igv_incluido ?? true,
    igvTasaBp: data?.igv_tasa_bp ?? 1800,
  };
}
