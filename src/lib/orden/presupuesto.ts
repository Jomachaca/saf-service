/**
 * Modelo del presupuesto: tipos y etiquetas, sin consultas.
 *
 * **Este módulo no puede ser `server-only`** y no debe importar nada que lo sea:
 * los componentes de cliente necesitan estas etiquetas, y un solo `import` de
 * valor —no de tipo— arrastraría el cliente de Supabase del servidor al
 * navegador. Las consultas viven en `consultas.ts`.
 */

import type { ConfigIgv } from "@/lib/dinero";

export type EstadoPresupuesto = "BORRADOR" | "ENVIADO" | "APROBADO" | "RECHAZADO";

export const ETIQUETA_PRESUPUESTO: Record<EstadoPresupuesto, string> = {
  BORRADOR: "Borrador",
  ENVIADO: "Esperando respuesta",
  APROBADO: "Aprobado",
  RECHAZADO: "Rechazado",
};

export type LineaPresupuesto = {
  id: string;
  concepto: string;
  cantidad: number;
  precio_unitario_centimos: number;
  servicio_catalogo_id: string | null;
  orden_visual: number;
};

export type Presupuesto = {
  id: string;
  version: number;
  estado: EstadoPresupuesto;
  subtotal_centimos: number;
  igv_centimos: number;
  total_centimos: number;
  igv_incluido: boolean;
  igv_tasa_bp: number;
  tiempo_estimado_min: number | null;
  enviado_en: string | null;
  respondido_en: string | null;
  respondido_por: string | null;
  creado_en: string;
  lineas: LineaPresupuesto[];
};

export type Diagnostico = {
  id: string;
  hallazgos: string;
  recomendacion: string;
  mecanico: string;
  actualizado_en: string;
};

export type ServicioCatalogo = {
  id: string;
  categoria: string;
  nombre: string;
  precio_base_centimos: number;
  duracion_min: number;
  activo: boolean;
  orden_visual: number;
};

/** Taxonomía de ARQUITECTURA.md §6, con los nombres que ve el cliente. */
export const ETIQUETA_CATEGORIA: Record<string, string> = {
  MANTENIMIENTO: "Mantenimiento programado",
  REPARACION: "Reparaciones y diagnóstico",
  CARROCERIA: "Carrocería y estética",
  ESPECIALIZADO: "Especializados",
};

export type ConfigSitio = ConfigIgv & {
  nombreTaller: string;
  whatsapp: string;
  plantillas: Record<string, string>;
};
