"use server";

import { revalidatePath } from "next/cache";

import { centimosDesdeTexto } from "@/lib/dinero";
import { esCategoria, type Categoria } from "@/lib/orden/presupuesto";
import { requerirStaff } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";

import {
  SIN_ERROR,
  type EstadoCatalogo,
  type EstadoFormulario,
} from "./estado-formulario";

// El catálogo no pasa por funciones de Postgres como las órdenes: no hay evento
// que registrar junto al cambio, así que una escritura directa bajo RLS alcanza.
// La política `staff opera catalogo` es la que decide quién puede tocarlo.

type CamposServicio = {
  nombre: string;
  categoria: Categoria;
  precio_base_centimos: number;
  duracion_min: number;
};

type Lectura = { ok: true; campos: CamposServicio } | { ok: false; motivo: string };

function texto(datos: FormData, campo: string): string {
  return String(datos.get(campo) ?? "").trim();
}

/**
 * Valida lo mismo que los `check` de la tabla, pero antes de llegar a ella: un
 * error de Postgres en la cara no le dice nada a quien está escribiendo precios.
 *
 * `activo` no se lee acá a propósito: en el alta el campo no existe y leerlo
 * crearía todos los servicios desactivados. Cada acción decide qué hacer con
 * él. Llega como "on" o vacío desde un input oculto, no desde una casilla
 * (ver el comentario en `catalogo/tabla.tsx`).
 */
function leerCampos(datos: FormData): Lectura {
  const nombre = texto(datos, "nombre");
  if (!nombre) return { ok: false, motivo: "Falta el nombre del servicio." };

  const categoria = texto(datos, "categoria");
  if (!esCategoria(categoria)) return { ok: false, motivo: "Categoría inválida." };

  const precio = centimosDesdeTexto(texto(datos, "precio"));
  if (precio === null) {
    return { ok: false, motivo: "El precio no se entiende. Escríbelo como 180 o 180.50." };
  }
  if (precio < 0) return { ok: false, motivo: "El precio no puede ser negativo." };

  const duracion = Number(texto(datos, "duracion"));
  if (!Number.isInteger(duracion) || duracion <= 0) {
    return { ok: false, motivo: "La duración va en minutos y tiene que ser mayor que cero." };
  }

  return {
    ok: true,
    campos: {
      nombre,
      categoria,
      precio_base_centimos: precio,
      duracion_min: duracion,
    },
  };
}

/**
 * Edita un servicio del catálogo.
 *
 * Cambiar un precio acá **no toca ningún presupuesto ya armado**: el precio se
 * copió a la línea cuando se agregó (regla 3, decisión 5). Esto solo afecta a
 * los presupuestos que se armen desde ahora.
 */
export async function actualizarServicio(
  _previo: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  await requerirStaff();

  const id = texto(datos, "id");
  if (!id) return { error: "Falta el servicio que se quiere editar." };

  const lectura = leerCampos(datos);
  if (!lectura.ok) return { error: lectura.motivo };

  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("servicio_catalogo")
    .update({ ...lectura.campos, activo: texto(datos, "activo") === "on" })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/catalogo");
  return SIN_ERROR;
}

/**
 * Da de alta un servicio. Entra activo y al final de su categoría; el orden
 * fino se ajusta editando, no adivinando dónde quería ponerlo el taller.
 */
export async function crearServicio(
  _previo: EstadoCatalogo,
  datos: FormData,
): Promise<EstadoCatalogo> {
  await requerirStaff();

  const lectura = leerCampos(datos);
  if (!lectura.ok) return { error: lectura.motivo, creado: _previo.creado };

  const supabase = await crearClienteServidor();

  const { data: ultimo } = await supabase
    .from("servicio_catalogo")
    .select("orden_visual")
    .eq("categoria", lectura.campos.categoria)
    .order("orden_visual", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("servicio_catalogo")
    .insert({
      ...lectura.campos,
      activo: true,
      orden_visual: (ultimo?.orden_visual ?? 0) + 1,
    })
    .select("id")
    .single();

  if (error) return { error: error.message, creado: _previo.creado };

  revalidatePath("/admin/catalogo");
  return { error: null, creado: data.id };
}

/**
 * El IGV y el mensaje con el que sale el presupuesto por WhatsApp.
 *
 * Vivía en la pantalla del sitio, pero nada de esto se publica: afecta a los
 * presupuestos que se armen desde ahora (decisión 31). Por eso no marca
 * «cambios sin publicar».
 */
export async function guardarAjustesPresupuesto(
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
    .update({
      igv_incluido: texto(datos, "igv_incluido") === "on",
      // En puntos básicos, enteros, como el resto del dinero (decisión 16).
      igv_tasa_bp: Math.round(tasa * 100),
      plantillas_mensaje: { ...plantillas, presupuesto: plantilla },
    })
    .eq("id", 1);

  if (error) return { error: error.message };

  revalidatePath("/admin/catalogo");
  revalidatePath("/admin/orden/[id]", "page");
  return SIN_ERROR;
}
