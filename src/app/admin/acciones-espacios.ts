"use server";

import { revalidatePath } from "next/cache";

import { esTipoEspacio } from "@/lib/orden/espacio";
import { requerirStaff } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";

import { SIN_ERROR, type EstadoCatalogo, type EstadoFormulario } from "./estado-formulario";

// Los espacios no pasan por funciones de Postgres como las órdenes: no hay
// evento que registrar junto al cambio, así que una escritura directa bajo RLS
// alcanza. La política `staff opera espacios` decide quién puede tocarlos.

function texto(datos: FormData, campo: string): string {
  return String(datos.get(campo) ?? "").trim();
}

type Campos = { nombre: string; tipo: string; capacidad: number };

type Lectura = { ok: true; campos: Campos } | { ok: false; motivo: string };

function leerCampos(datos: FormData): Lectura {
  const nombre = texto(datos, "nombre");
  if (!nombre) return { ok: false, motivo: "Falta el nombre del espacio." };

  const tipo = texto(datos, "tipo");
  if (!esTipoEspacio(tipo)) return { ok: false, motivo: "Tipo de espacio inválido." };

  const capacidad = Number(texto(datos, "capacidad"));
  if (!Number.isInteger(capacidad) || capacidad < 1) {
    return { ok: false, motivo: "Cuántos vehículos entran tiene que ser un número de 1 para arriba." };
  }

  return { ok: true, campos: { nombre, tipo, capacidad } };
}

/** Cuántos vehículos hay ahora mismo en ese espacio. */
async function ocupantes(id: string): Promise<number> {
  const supabase = await crearClienteServidor();
  const { count } = await supabase
    .from("orden_servicio")
    .select("id", { count: "exact", head: true })
    .eq("espacio_id", id);

  return count ?? 0;
}

/**
 * Edita un espacio.
 *
 * Bajar la capacidad por debajo de lo que ya hay adentro se rechaza acá: el
 * disparador de la base solo mira cuando entra un vehículo, así que si no, el
 * espacio quedaría con más autos de los que dice que le caben y el tablero
 * mostraría un número imposible.
 */
export async function actualizarEspacio(
  _previo: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  await requerirStaff();

  const id = texto(datos, "id");
  if (!id) return { error: "Falta el espacio que se quiere editar." };

  const lectura = leerCampos(datos);
  if (!lectura.ok) return { error: lectura.motivo };

  const dentro = await ocupantes(id);
  if (lectura.campos.capacidad < dentro) {
    return {
      error: `Ahí hay ${dentro} ${dentro === 1 ? "vehículo" : "vehículos"} ahora mismo. Sácalos antes de bajar el cupo a ${lectura.campos.capacidad}.`,
    };
  }

  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("espacio")
    .update({ ...lectura.campos, activo: texto(datos, "activo") === "on" })
    .eq("id", id);

  if (error) return { error: mensajeDeError(error.message) };

  revalidatePath("/admin/espacios");
  revalidatePath("/admin");
  return SIN_ERROR;
}

/** Da de alta un espacio. Entra activo y al final de la lista. */
export async function crearEspacio(
  _previo: EstadoCatalogo,
  datos: FormData,
): Promise<EstadoCatalogo> {
  await requerirStaff();

  const lectura = leerCampos(datos);
  if (!lectura.ok) return { error: lectura.motivo, creado: _previo.creado };

  const supabase = await crearClienteServidor();

  const { data: ultimo } = await supabase
    .from("espacio")
    .select("orden_visual")
    .order("orden_visual", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("espacio")
    .insert({ ...lectura.campos, activo: true, orden_visual: (ultimo?.orden_visual ?? 0) + 1 })
    .select("id")
    .single();

  if (error) return { error: mensajeDeError(error.message), creado: _previo.creado };

  revalidatePath("/admin/espacios");
  revalidatePath("/admin");
  return { error: null, creado: data.id };
}

/**
 * Borra un espacio.
 *
 * Solo sale si nunca pasó un vehículo por ahí: la orden lo referencia con
 * `on delete restrict` para no romper la trazabilidad (decisión 14). El que ya
 * tiene historia se desactiva, que es lo mismo de cara al día a día.
 */
export async function borrarEspacio(
  _previo: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  await requerirStaff();

  const id = texto(datos, "id");
  if (!id) return { error: "Falta el espacio que se quiere borrar." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("espacio").delete().eq("id", id);

  if (error) return { error: mensajeDeError(error.message) };

  revalidatePath("/admin/espacios");
  revalidatePath("/admin");
  return SIN_ERROR;
}

/**
 * Sube o baja un espacio en la lista.
 *
 * Renumera todo en vez de intercambiar dos valores: los espacios que vienen de
 * antes de esta pantalla comparten `orden_visual`, y ahí un intercambio no
 * movería nada.
 */
export async function moverEspacio(
  _previo: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  await requerirStaff();

  const id = texto(datos, "id");
  const paso = texto(datos, "paso") === "sube" ? -1 : 1;

  const supabase = await crearClienteServidor();
  const { data: espacios, error: fallo } = await supabase
    .from("espacio")
    .select("id, orden_visual")
    .order("orden_visual")
    .order("nombre");

  if (fallo) return { error: fallo.message };

  const orden = (espacios ?? []).map((espacio) => espacio.id);
  const desde = orden.indexOf(id);
  const hasta = desde + paso;

  if (desde === -1) return { error: "No existe ese espacio." };
  if (hasta < 0 || hasta >= orden.length) return SIN_ERROR;

  [orden[desde], orden[hasta]] = [orden[hasta], orden[desde]];

  for (const [posicion, espacioId] of orden.entries()) {
    const { error } = await supabase
      .from("espacio")
      .update({ orden_visual: posicion })
      .eq("id", espacioId);

    if (error) return { error: error.message };
  }

  revalidatePath("/admin/espacios");
  revalidatePath("/admin");
  return SIN_ERROR;
}

function mensajeDeError(mensaje: string): string {
  if (mensaje.includes("espacio_nombre_key")) {
    return "Ya hay un espacio con ese nombre.";
  }
  if (mensaje.includes("orden_servicio_espacio_id_fkey") || mensaje.includes("violates foreign key")) {
    return "Por ese espacio ya pasaron vehículos, así que no se puede borrar sin perder el historial. Desactívalo: deja de ofrecerse al recibir y no se ve en el tablero.";
  }
  return mensaje;
}
