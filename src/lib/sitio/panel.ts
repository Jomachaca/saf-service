import "server-only";

import { crearClienteServidor } from "@/lib/supabase/server";

/**
 * Lo mismo que `contenido.ts`, pero para el panel: con la sesión del staff, sin
 * cachear y sin filtrar por `activo`. Acá se ve también lo apagado, que es lo
 * que hace falta para poder encenderlo de nuevo.
 */

export type ConfigCompleta = {
  nombreTaller: string;
  slogan: string;
  descripcion: string;
  logoUrl: string | null;
  telefono: string;
  whatsapp: string;
  email: string;
  direccion: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  mapaUrl: string;
  horarios: { etiqueta: string; horario: string }[];
  heroTitulo: string;
  heroSubtitulo: string;
  heroImagenUrl: string | null;
  nosotrosTitulo: string;
  nosotrosTexto: string;
  nosotrosImagenUrl: string | null;
  igvIncluido: boolean;
  igvTasaBp: number;
  plantillas: Record<string, string>;
  actualizadoEn: string;
  publicadoEn: string | null;
};

export type DestacadoPanel = {
  id: string;
  icono: string;
  titulo: string;
  texto: string;
  orden_visual: number;
  activo: boolean;
};

export type FotoPanel = {
  id: string;
  url: string;
  alt: string;
  orden_visual: number;
  activo: boolean;
};

function horariosDe(valor: unknown): { etiqueta: string; horario: string }[] {
  if (!Array.isArray(valor)) return [];

  return valor.flatMap((fila) => {
    if (typeof fila !== "object" || fila === null) return [];
    const { etiqueta, horario } = fila as Record<string, unknown>;
    if (typeof etiqueta !== "string" || typeof horario !== "string") return [];
    return [{ etiqueta, horario }];
  });
}

export async function cargarConfigCompleta(): Promise<ConfigCompleta | null> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("config_sitio").select("*").eq("id", 1).maybeSingle();
  if (!data) return null;

  return {
    nombreTaller: data.nombre_taller,
    slogan: data.slogan,
    descripcion: data.descripcion,
    logoUrl: data.logo_url,
    telefono: data.telefono,
    whatsapp: data.whatsapp,
    email: data.email,
    direccion: data.direccion,
    facebook: data.facebook,
    instagram: data.instagram,
    tiktok: data.tiktok,
    mapaUrl: data.mapa_url ?? "",
    horarios: horariosDe(data.horarios),
    heroTitulo: data.hero_titulo,
    heroSubtitulo: data.hero_subtitulo,
    heroImagenUrl: data.hero_imagen_url,
    nosotrosTitulo: data.nosotros_titulo,
    nosotrosTexto: data.nosotros_texto,
    nosotrosImagenUrl: data.nosotros_imagen_url,
    igvIncluido: data.igv_incluido,
    igvTasaBp: data.igv_tasa_bp,
    plantillas: (data.plantillas_mensaje ?? {}) as Record<string, string>,
    actualizadoEn: data.actualizado_en,
    publicadoEn: data.publicado_en,
  };
}

export async function cargarDestacadosPanel(): Promise<DestacadoPanel[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("destacado")
    .select("id, icono, titulo, texto, orden_visual, activo")
    .order("orden_visual");

  return data ?? [];
}

export async function cargarGaleriaPanel(): Promise<FotoPanel[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("galeria_imagen")
    .select("id, url, alt, orden_visual, activo")
    .order("orden_visual");

  return data ?? [];
}

/** ¿Hay cambios guardados que todavía no se publicaron? (decisión 17) */
export function haySinPublicar(config: ConfigCompleta): boolean {
  if (!config.publicadoEn) return true;
  return new Date(config.actualizadoEn) > new Date(config.publicadoEn);
}
