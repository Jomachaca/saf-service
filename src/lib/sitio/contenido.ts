import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { crearClientePublico } from "@/lib/supabase/publico";
import { supabaseConfigurado } from "@/lib/supabase/env";

/**
 * El contenido del landing, cacheado hasta que alguien publique.
 *
 * `cacheLife("max")` más `cacheTag` implementan la decisión 17: guardar en
 * `/admin/config` escribe en la base y no cambia nada de lo que se ve; el botón
 * "Publicar cambios" llama a `updateTag(TAG_SITIO)` y recién ahí el sitio
 * público se rearma. Editar horarios y galería son varios guardados seguidos, y
 * con revalidación automática el visitante vería la página a medio hacer.
 *
 * Se lee con la clave pública (`crearClientePublico`) porque dentro de un
 * `use cache` no se pueden leer cookies. Es también el cliente correcto: acá no
 * hay nada que no sea público.
 */

export const TAG_SITIO = "sitio";

export type Horario = { etiqueta: string; horario: string };

export type Taller = {
  nombre: string;
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
  mapaUrl: string | null;
  horarios: Horario[];
};

export type Hero = {
  titulo: string;
  subtitulo: string;
  imagenUrl: string | null;
};

export type Nosotros = {
  titulo: string;
  texto: string;
  imagenUrl: string | null;
};

export type Destacado = {
  id: string;
  icono: string;
  titulo: string;
  texto: string;
};

export type Foto = {
  id: string;
  url: string;
  alt: string;
};

export type ServicioPublico = {
  id: string;
  nombre: string;
  categoria: string;
};

export type ContenidoSitio = {
  taller: Taller;
  hero: Hero;
  nosotros: Nosotros;
  destacados: Destacado[];
  galeria: Foto[];
  servicios: ServicioPublico[];
};

/** Lo que se ve sin Supabase configurado: la marca, y nada inventado. */
const VACIO: ContenidoSitio = {
  taller: {
    nombre: "SAF Service",
    slogan: "Taller automotriz",
    descripcion: "",
    logoUrl: null,
    telefono: "",
    whatsapp: "",
    email: "",
    direccion: "",
    facebook: "",
    instagram: "",
    tiktok: "",
    mapaUrl: null,
    horarios: [],
  },
  hero: { titulo: "", subtitulo: "", imagenUrl: null },
  nosotros: { titulo: "", texto: "", imagenUrl: null },
  destacados: [],
  galeria: [],
  servicios: [],
};

/**
 * El mapa va dentro de un `iframe`, así que la URL no se pinta tal cual venga:
 * se acepta únicamente el incrustado de Google Maps. El panel es solo para
 * staff, pero un campo de texto que termina en un iframe merece una lista
 * blanca igual, aunque sea contra un pegado equivocado.
 */
export function mapaPermitido(url: string | null): string | null {
  if (!url) return null;

  try {
    const direccion = new URL(url);
    if (direccion.protocol !== "https:") return null;
    if (!["www.google.com", "maps.google.com"].includes(direccion.hostname)) return null;
    if (!direccion.pathname.startsWith("/maps/embed")) return null;
    return direccion.toString();
  } catch {
    return null;
  }
}

/** El jsonb lo escribe una persona desde el panel: se valida antes de pintarlo. */
function leerHorarios(valor: unknown): Horario[] {
  if (!Array.isArray(valor)) return [];

  return valor.flatMap((fila) => {
    if (typeof fila !== "object" || fila === null) return [];
    const { etiqueta, horario } = fila as Record<string, unknown>;
    if (typeof etiqueta !== "string" || typeof horario !== "string") return [];
    if (!etiqueta.trim() || !horario.trim()) return [];
    return [{ etiqueta: etiqueta.trim(), horario: horario.trim() }];
  });
}

export async function cargarSitio(): Promise<ContenidoSitio> {
  "use cache";
  cacheLife("max");
  cacheTag(TAG_SITIO);

  if (!supabaseConfigurado()) return VACIO;

  const supabase = crearClientePublico();

  const [config, destacados, galeria, servicios] = await Promise.all([
    supabase.from("config_sitio").select("*").eq("id", 1).maybeSingle(),
    supabase
      .from("destacado")
      .select("id, icono, titulo, texto")
      .eq("activo", true)
      .order("orden_visual"),
    supabase
      .from("galeria_imagen")
      .select("id, url, alt")
      .eq("activo", true)
      .order("orden_visual"),
    supabase
      .from("servicio_catalogo")
      .select("id, nombre, categoria")
      .eq("activo", true)
      .order("orden_visual"),
  ]);

  const fila = config.data;
  if (!fila) return VACIO;

  return {
    taller: {
      nombre: fila.nombre_taller,
      slogan: fila.slogan,
      descripcion: fila.descripcion,
      logoUrl: fila.logo_url,
      telefono: fila.telefono,
      whatsapp: fila.whatsapp,
      email: fila.email,
      direccion: fila.direccion,
      facebook: fila.facebook,
      instagram: fila.instagram,
      tiktok: fila.tiktok,
      mapaUrl: mapaPermitido(fila.mapa_url),
      horarios: leerHorarios(fila.horarios),
    },
    hero: {
      titulo: fila.hero_titulo,
      subtitulo: fila.hero_subtitulo,
      imagenUrl: fila.hero_imagen_url,
    },
    nosotros: {
      titulo: fila.nosotros_titulo,
      texto: fila.nosotros_texto,
      imagenUrl: fila.nosotros_imagen_url,
    },
    destacados: destacados.data ?? [],
    galeria: galeria.data ?? [],
    servicios: servicios.data ?? [],
  };
}
