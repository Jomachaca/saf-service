"use server";

import { revalidatePath, updateTag } from "next/cache";

import { TAG_SITIO, mapaPermitido } from "@/lib/sitio/contenido";
import { requerirStaff } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";

import {
  CATALOGO_INICIAL,
  SIN_ERROR,
  type EstadoCatalogo,
  type EstadoFormulario,
} from "../estado-formulario";

/**
 * Guardar escribe en la base y **no cambia el sitio público**; publicar sí
 * (decisión 17). Por eso cada acción de acá toca `actualizado_en` y solo
 * `publicarCambios` llama a `updateTag`.
 */

const CAMPOS_IMAGEN = {
  logo: "logo_url",
  hero: "hero_imagen_url",
  nosotros: "nosotros_imagen_url",
} as const;

type CampoImagen = keyof typeof CAMPOS_IMAGEN;

function texto(datos: FormData, campo: string): string {
  return String(datos.get(campo) ?? "").trim();
}

/** Marca que hay algo nuevo por publicar. */
function conSello<T extends Record<string, unknown>>(cambios: T) {
  return { ...cambios, actualizado_en: new Date().toISOString() };
}

/**
 * De la URL pública al camino dentro del bucket, para poder borrar el archivo
 * viejo al reemplazarlo. Devuelve null si la URL no es de nuestro bucket, así
 * que nunca se intenta borrar algo de fuera.
 */
function rutaEnBucket(url: string | null): string | null {
  if (!url) return null;
  const marca = "/storage/v1/object/public/sitio/";
  const corte = url.indexOf(marca);
  if (corte === -1) return null;

  const ruta = url.slice(corte + marca.length);
  return ruta.length > 0 ? decodeURIComponent(ruta) : null;
}

// ---------------------------------------------------------------------------
// Identidad y contacto
// ---------------------------------------------------------------------------

export async function guardarIdentidad(
  _previo: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  await requerirStaff();

  const nombre = texto(datos, "nombre_taller");
  if (!nombre) return { error: "El nombre del taller no puede quedar vacío." };

  const mapa = texto(datos, "mapa_url");
  if (mapa && !mapaPermitido(mapa)) {
    return {
      error:
        "El mapa tiene que ser el enlace «Insertar un mapa» de Google Maps, el que empieza con https://www.google.com/maps/embed.",
    };
  }

  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("config_sitio")
    .update(
      conSello({
        nombre_taller: nombre,
        slogan: texto(datos, "slogan"),
        descripcion: texto(datos, "descripcion"),
        telefono: texto(datos, "telefono"),
        whatsapp: texto(datos, "whatsapp"),
        email: texto(datos, "email"),
        direccion: texto(datos, "direccion"),
        facebook: texto(datos, "facebook"),
        instagram: texto(datos, "instagram"),
        tiktok: texto(datos, "tiktok"),
        mapa_url: mapa || null,
      }),
    )
    .eq("id", 1);

  if (error) return { error: error.message };

  revalidatePath("/admin/config");
  return SIN_ERROR;
}

// ---------------------------------------------------------------------------
// Portada y presentación
// ---------------------------------------------------------------------------

export async function guardarPortada(
  _previo: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  await requerirStaff();

  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("config_sitio")
    .update(
      conSello({
        hero_titulo: texto(datos, "hero_titulo"),
        hero_subtitulo: texto(datos, "hero_subtitulo"),
      }),
    )
    .eq("id", 1);

  if (error) return { error: error.message };

  revalidatePath("/admin/config");
  return SIN_ERROR;
}

export async function guardarNosotros(
  _previo: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  await requerirStaff();

  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("config_sitio")
    .update(
      conSello({
        nosotros_titulo: texto(datos, "nosotros_titulo"),
        nosotros_texto: texto(datos, "nosotros_texto"),
      }),
    )
    .eq("id", 1);

  if (error) return { error: error.message };

  revalidatePath("/admin/config");
  return SIN_ERROR;
}

// ---------------------------------------------------------------------------
// Horarios
// ---------------------------------------------------------------------------

export async function guardarHorarios(
  _previo: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  await requerirStaff();

  let filas: unknown;
  try {
    filas = JSON.parse(texto(datos, "horarios") || "[]");
  } catch {
    return { error: "No se pudieron leer los horarios." };
  }

  if (!Array.isArray(filas)) return { error: "No se pudieron leer los horarios." };

  // Una fila a medio llenar no se guarda: en el sitio se vería un día sin hora.
  const limpias = filas.flatMap((fila) => {
    if (typeof fila !== "object" || fila === null) return [];
    const { etiqueta, horario } = fila as Record<string, unknown>;
    if (typeof etiqueta !== "string" || typeof horario !== "string") return [];
    if (!etiqueta.trim() || !horario.trim()) return [];
    return [{ etiqueta: etiqueta.trim(), horario: horario.trim() }];
  });

  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("config_sitio")
    .update(conSello({ horarios: limpias }))
    .eq("id", 1);

  if (error) return { error: error.message };

  revalidatePath("/admin/config");
  return SIN_ERROR;
}

// ---------------------------------------------------------------------------
// IGV y plantilla de WhatsApp
// ---------------------------------------------------------------------------

export async function guardarFacturacion(
  _previo: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  await requerirStaff();

  const tasa = Number(texto(datos, "igv_tasa"));
  if (!Number.isFinite(tasa) || tasa < 0 || tasa > 100) {
    return { error: "La tasa de IGV va en porcentaje, entre 0 y 100." };
  }

  const plantilla = texto(datos, "plantilla_presupuesto");
  if (plantilla && !plantilla.includes("{url}")) {
    return {
      error: "La plantilla tiene que incluir {url}: es el enlace que abre el cliente.",
    };
  }

  const supabase = await crearClienteServidor();
  const { data: actual } = await supabase
    .from("config_sitio")
    .select("plantillas_mensaje")
    .eq("id", 1)
    .maybeSingle();

  const plantillas = (actual?.plantillas_mensaje ?? {}) as Record<string, string>;

  const { error } = await supabase
    .from("config_sitio")
    .update(
      conSello({
        igv_incluido: texto(datos, "igv_incluido") === "on",
        // En puntos básicos, enteros, como el resto del dinero (decisión 16).
        igv_tasa_bp: Math.round(tasa * 100),
        plantillas_mensaje: { ...plantillas, presupuesto: plantilla },
      }),
    )
    .eq("id", 1);

  if (error) return { error: error.message };

  revalidatePath("/admin/config");
  revalidatePath("/admin/orden/[id]", "page");
  return SIN_ERROR;
}

// ---------------------------------------------------------------------------
// Imágenes
// ---------------------------------------------------------------------------

/**
 * Guarda la URL de una imagen ya subida y borra la que estaba antes.
 *
 * La subida ocurre en el navegador, contra Storage y con la sesión del staff:
 * así la foto se redimensiona antes de salir del celular y no viaja dos veces.
 * Acá solo se anota dónde quedó.
 */
export async function fijarImagen(campo: CampoImagen, url: string | null): Promise<void> {
  await requerirStaff();

  // El argumento llega del navegador: se comprueba contra las claves propias
  // del objeto, no con un simple acceso por índice.
  if (!Object.hasOwn(CAMPOS_IMAGEN, campo)) throw new Error("Campo de imagen desconocido.");

  const supabase = await crearClienteServidor();

  const { data: actual } = await supabase
    .from("config_sitio")
    .select("logo_url, hero_imagen_url, nosotros_imagen_url")
    .eq("id", 1)
    .maybeSingle();

  const anteriores = {
    logo: actual?.logo_url ?? null,
    hero: actual?.hero_imagen_url ?? null,
    nosotros: actual?.nosotros_imagen_url ?? null,
  };

  // Explícito y no por clave calculada: los tipos generados de la base no
  // aceptan una columna variable, y acá son solo tres.
  const cambios =
    campo === "logo"
      ? { logo_url: url }
      : campo === "hero"
        ? { hero_imagen_url: url }
        : { nosotros_imagen_url: url };

  await supabase.from("config_sitio").update(conSello(cambios)).eq("id", 1);

  // Se borra después de guardar: si falla el borrado queda un archivo huérfano,
  // que es mucho mejor que una fila apuntando a un archivo que ya no está.
  const anterior = rutaEnBucket(anteriores[campo]);
  if (anterior && anterior !== rutaEnBucket(url)) {
    await supabase.storage.from("sitio").remove([anterior]);
  }

  revalidatePath("/admin/config");
}

// ---------------------------------------------------------------------------
// Destacados
// ---------------------------------------------------------------------------

export async function crearDestacado(
  _previo: EstadoCatalogo,
  datos: FormData,
): Promise<EstadoCatalogo> {
  await requerirStaff();

  const titulo = texto(datos, "titulo");
  if (!titulo) return { ...CATALOGO_INICIAL, error: "Falta el título." };

  const supabase = await crearClienteServidor();

  const { data: ultimo } = await supabase
    .from("destacado")
    .select("orden_visual")
    .order("orden_visual", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("destacado")
    .insert({
      icono: texto(datos, "icono") || "llave",
      titulo,
      texto: texto(datos, "texto"),
      orden_visual: (ultimo?.orden_visual ?? 0) + 1,
    })
    .select("id")
    .single();

  if (error) return { ...CATALOGO_INICIAL, error: error.message };

  await marcarActualizado();
  revalidatePath("/admin/config");
  return { error: null, creado: data.id };
}

export async function actualizarDestacado(
  _previo: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  await requerirStaff();

  const id = texto(datos, "id");
  const titulo = texto(datos, "titulo");
  if (!id) return { error: "Falta el destacado." };
  if (!titulo) return { error: "Falta el título." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("destacado")
    .update({
      icono: texto(datos, "icono") || "llave",
      titulo,
      texto: texto(datos, "texto"),
      activo: texto(datos, "activo") === "on",
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await marcarActualizado();
  revalidatePath("/admin/config");
  return SIN_ERROR;
}

export async function borrarDestacado(id: string): Promise<void> {
  await requerirStaff();

  const supabase = await crearClienteServidor();
  await supabase.from("destacado").delete().eq("id", id);

  await marcarActualizado();
  revalidatePath("/admin/config");
}

// ---------------------------------------------------------------------------
// Galería
// ---------------------------------------------------------------------------

export async function agregarFoto(url: string, alt: string): Promise<void> {
  await requerirStaff();

  // Solo se aceptan fotos de nuestro propio bucket: la URL viene del navegador
  // y una de fuera quedaría guardada para siempre apuntando a otro sitio.
  if (!rutaEnBucket(url)) throw new Error("Esa imagen no está en el almacenamiento del sitio.");

  const supabase = await crearClienteServidor();

  const { data: ultima } = await supabase
    .from("galeria_imagen")
    .select("orden_visual")
    .order("orden_visual", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase.from("galeria_imagen").insert({
    url,
    alt: alt.trim() || "Foto del taller",
    orden_visual: (ultima?.orden_visual ?? 0) + 1,
  });

  await marcarActualizado();
  revalidatePath("/admin/config");
}

export async function actualizarFoto(
  _previo: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  await requerirStaff();

  const id = texto(datos, "id");
  const alt = texto(datos, "alt");
  if (!id) return { error: "Falta la foto." };
  if (!alt) return { error: "Escribe qué se ve en la foto: lo lee quien no puede verla." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("galeria_imagen")
    .update({ alt, activo: texto(datos, "activo") === "on" })
    .eq("id", id);

  if (error) return { error: error.message };

  await marcarActualizado();
  revalidatePath("/admin/config");
  return SIN_ERROR;
}

export async function borrarFoto(id: string): Promise<void> {
  await requerirStaff();

  const supabase = await crearClienteServidor();

  const { data: foto } = await supabase
    .from("galeria_imagen")
    .select("url")
    .eq("id", id)
    .maybeSingle();

  await supabase.from("galeria_imagen").delete().eq("id", id);

  const ruta = rutaEnBucket(foto?.url ?? null);
  if (ruta) await supabase.storage.from("sitio").remove([ruta]);

  await marcarActualizado();
  revalidatePath("/admin/config");
}

// ---------------------------------------------------------------------------
// Publicar
// ---------------------------------------------------------------------------

/**
 * El único punto donde el sitio público cambia.
 *
 * `updateTag` tira el caché de `cargarSitio()` y la siguiente visita ve el
 * contenido nuevo. Hasta acá, todo lo guardado estaba solo en la base.
 */
export async function publicarCambios(): Promise<void> {
  await requerirStaff();

  const supabase = await crearClienteServidor();
  await supabase
    .from("config_sitio")
    .update({ publicado_en: new Date().toISOString() })
    .eq("id", 1);

  updateTag(TAG_SITIO);
  revalidatePath("/admin/config");
}

/**
 * Destacados y galería viven en sus propias tablas, pero el aviso de "hay
 * cambios sin publicar" se lee de `config_sitio`. Tocarlo desde acá evita un
 * disparador en la base para algo que solo pasa desde esta pantalla.
 */
async function marcarActualizado(): Promise<void> {
  const supabase = await crearClienteServidor();
  await supabase
    .from("config_sitio")
    .update({ actualizado_en: new Date().toISOString() })
    .eq("id", 1);
}
