"use server";

import { revalidatePath } from "next/cache";

import { instanteEnLima } from "@/lib/fecha";
import { cambiarReserva, esEstadoReserva } from "@/lib/reserva/estados";
import { requerirStaff } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";

import { SIN_ERROR, type EstadoFormulario } from "./estado-formulario";

function texto(datos: FormData, campo: string): string {
  return String(datos.get(campo) ?? "").trim();
}

/**
 * Confirmar, cancelar o marcar que no vino.
 *
 * Igual que con la orden: qué cambio vale lo decide la función pura, y la base
 * solo garantiza que nadie pise el cambio de otro. Recibir el vehículo no pasa
 * por acá, sino por la recepción (decisión 28).
 */
export async function cambiarEstadoReserva(
  _previo: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  await requerirStaff();

  const id = texto(datos, "id");
  const actual = texto(datos, "estado_actual");
  const nuevo = texto(datos, "estado_nuevo");

  if (!esEstadoReserva(actual) || !esEstadoReserva(nuevo)) return { error: "Estado inválido." };

  const supabase = await crearClienteServidor();

  const { data: reserva } = await supabase
    .from("reserva")
    .select("fecha, hora")
    .eq("id", id)
    .maybeSingle();

  if (!reserva) return { error: "No existe esa reserva." };

  const yaPaso = instanteEnLima(reserva.fecha, reserva.hora) <= new Date();
  const resultado = cambiarReserva(actual, nuevo, { yaPaso });
  if (!resultado.ok) return { error: resultado.motivo };

  // El `eq("estado", actual)` es la guarda: si alguien la cambió mientras
  // tanto, no se toca nada y se avisa, en vez de pisar su cambio en silencio.
  const { data, error } = await supabase
    .from("reserva")
    .update({ estado: resultado.estado, actualizado_en: new Date().toISOString() })
    .eq("id", id)
    .eq("estado", actual)
    .select("id");

  if (error) return { error: error.message };
  if (!data?.length) return { error: "La reserva cambió mientras la mirabas. Recarga la agenda." };

  revalidatePath("/admin/agenda");
  return SIN_ERROR;
}
