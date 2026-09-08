"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { buscarVehiculo, type VehiculoEncontrado } from "@/lib/orden/consultas";
import { esEstado, transicionar, type Estado } from "@/lib/orden/estados";
import { esUbicacion, ubicar, type Ubicacion } from "@/lib/orden/ubicacion";
import { requerirStaff } from "@/lib/sesion";

import { SIN_ERROR, type EstadoFormulario } from "./estado-formulario";
import { crearClienteServidor } from "@/lib/supabase/server";

// El tipo y SIN_ERROR viven en estado-formulario.ts: un archivo "use server"
// solo puede exportar funciones async.

/**
 * Búsqueda para la recepción rápida. Va como acción del servidor y no como
 * route handler para no inventar una API: la pantalla es la única que la usa.
 */
export async function buscarVehiculos(termino: string): Promise<VehiculoEncontrado[]> {
  await requerirStaff();
  return buscarVehiculo(termino);
}

function texto(datos: FormData, campo: string): string {
  return String(datos.get(campo) ?? "").trim();
}

function entero(datos: FormData, campo: string): number | null {
  const valor = texto(datos, campo);
  if (!valor) return null;
  const numero = Number(valor);
  return Number.isInteger(numero) ? numero : null;
}

/**
 * Recepción rápida. Cliente, vehículo, orden y evento se crean en una sola
 * transacción en la base (`recepcionar_vehiculo`): media recepción guardada es
 * peor que ninguna.
 */
export async function recepcionarVehiculo(
  _previo: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  await requerirStaff();

  const motivo = texto(datos, "motivo");
  if (!motivo) return { error: "Falta el motivo de ingreso." };

  const ubicacion = texto(datos, "ubicacion");
  if (!esUbicacion(ubicacion)) return { error: "Ubicación inválida." };

  const boxId = texto(datos, "box_id") || null;
  const destino = ubicar(ubicacion, boxId);
  if (!destino.ok) return { error: destino.motivo };

  const vehiculoId = texto(datos, "vehiculo_id") || null;

  // Vehículo nuevo: hacen falta sus datos y los del cliente.
  let placa = "";
  if (!vehiculoId) {
    placa = texto(datos, "placa").toUpperCase().replace(/\s/g, "");
    if (!placa) return { error: "Falta la placa." };
    if (!texto(datos, "marca")) return { error: "Falta la marca." };
    if (!texto(datos, "modelo")) return { error: "Falta el modelo." };
    if (!texto(datos, "cliente_id")) {
      if (!texto(datos, "cliente_nombre")) return { error: "Falta el nombre del cliente." };
      if (!texto(datos, "cliente_telefono")) return { error: "Falta el teléfono del cliente." };
    }
  }

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("recepcionar_vehiculo", {
    p_motivo: motivo,
    p_ubicacion: destino.ubicacion,
    p_box_id: destino.boxId ?? undefined,
    p_vehiculo_id: vehiculoId ?? undefined,
    p_cliente_id: texto(datos, "cliente_id") || undefined,
    p_cliente_nombre: texto(datos, "cliente_nombre") || undefined,
    p_cliente_telefono: texto(datos, "cliente_telefono") || undefined,
    p_placa: placa || undefined,
    p_marca: texto(datos, "marca") || undefined,
    p_modelo: texto(datos, "modelo") || undefined,
    p_anio: entero(datos, "anio") ?? undefined,
    p_tipo: texto(datos, "tipo") || undefined,
    p_kilometraje: entero(datos, "kilometraje") ?? undefined,
  });

  if (error) return { error: mensajeDeError(error.message) };

  revalidatePath("/admin");
  redirect(`/admin/orden/${data}`);
}

/**
 * Cambio de estado. La regla de qué transición es válida se decide acá arriba,
 * con la función pura; la base solo garantiza que el cambio y su evento entren
 * juntos y que nadie pise el cambio de otro.
 */
export async function cambiarEstado(
  _previo: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  await requerirStaff();

  const ordenId = texto(datos, "orden_id");
  const actual = texto(datos, "estado_actual");
  const nuevo = texto(datos, "estado_nuevo");

  if (!esEstado(actual) || !esEstado(nuevo)) return { error: "Estado inválido." };

  const resultado = transicionar(actual as Estado, nuevo as Estado);
  if (!resultado.ok) return { error: resultado.motivo };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("cambiar_estado_orden", {
    p_orden_id: ordenId,
    p_estado_esperado: actual,
    p_estado_nuevo: resultado.estado,
    p_nota: texto(datos, "nota") || undefined,
  });

  if (error) return { error: mensajeDeError(error.message) };

  revalidatePath("/admin");
  revalidatePath(`/admin/orden/${ordenId}`);
  return SIN_ERROR;
}

/** Mover el vehículo de sitio. No toca el estado (decisión 2). */
export async function moverOrden(
  _previo: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  await requerirStaff();

  const ordenId = texto(datos, "orden_id");
  const ubicacion = texto(datos, "ubicacion");
  if (!esUbicacion(ubicacion)) return { error: "Ubicación inválida." };

  const destino = ubicar(ubicacion as Ubicacion, texto(datos, "box_id") || null);
  if (!destino.ok) return { error: destino.motivo };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("mover_orden", {
    p_orden_id: ordenId,
    p_ubicacion: destino.ubicacion,
    p_box_id: destino.boxId ?? undefined,
  });

  if (error) return { error: mensajeDeError(error.message) };

  revalidatePath("/admin");
  revalidatePath(`/admin/orden/${ordenId}`);
  return SIN_ERROR;
}

/**
 * Traduce los errores de Postgres que el taller puede provocar. El resto se
 * devuelve tal cual: inventar un mensaje amable para algo inesperado esconde el
 * problema.
 */
function mensajeDeError(mensaje: string): string {
  if (mensaje.includes("orden_box_ocupado_idx")) {
    return "Ese box ya está ocupado por otro vehículo.";
  }
  if (mensaje.includes("vehiculo_placa_key")) {
    return "Ya existe un vehículo con esa placa.";
  }
  if (mensaje.includes("orden_box_coherente")) {
    return "Si el vehículo va a un box hay que indicar cuál.";
  }
  return mensaje;
}
