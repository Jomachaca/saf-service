"use server";

import { revalidatePath } from "next/cache";

import { fechaISOLima, instanteEnLima } from "@/lib/fecha";
import { cambiarReserva, esEstadoReserva } from "@/lib/reserva/estados";
import { requerirStaff } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";

import {
  SIN_ERROR,
  type EstadoDiaCerrado,
  type EstadoFormulario,
} from "./estado-formulario";

function texto(datos: FormData, campo: string): string {
  return String(datos.get(campo) ?? "").trim();
}

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

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

/** La semana entera de cupos, de una vez (`guardar_franjas`). */
export async function guardarFranjas(
  _previo: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  await requerirStaff();

  let celdas: unknown;
  try {
    celdas = JSON.parse(texto(datos, "franjas") || "[]");
  } catch {
    return { error: "No se pudo leer el horario." };
  }

  if (!Array.isArray(celdas)) return { error: "No se pudo leer el horario." };

  const vistas = new Set<string>();
  const franjas: { dia_semana: number; hora: string; cupos: number }[] = [];

  for (const celda of celdas) {
    if (typeof celda !== "object" || celda === null) {
      return { error: "No se pudo leer el horario." };
    }

    const { dia_semana: dia, hora, cupos } = celda as Record<string, unknown>;

    if (typeof dia !== "number" || !Number.isInteger(dia) || dia < 1 || dia > 7) {
      return { error: "Hay un día de la semana que no existe." };
    }
    if (typeof hora !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) {
      return { error: `«${String(hora)}» no es una hora válida.` };
    }
    if (typeof cupos !== "number" || !Number.isInteger(cupos) || cupos < 0 || cupos > 50) {
      return { error: `Los cupos van de 0 a 50. Revisa la fila de las ${hora}.` };
    }

    const clave = `${dia}-${hora}`;
    if (cupos === 0 || vistas.has(clave)) continue;

    vistas.add(clave);
    franjas.push({ dia_semana: dia, hora, cupos });
  }

  const supabase = await crearClienteServidor();

  // Un horario vacío con las reservas encendidas deja el formulario abierto y
  // sin ninguna hora que ofrecer.
  if (franjas.length === 0) {
    const { data: config } = await supabase
      .from("config_sitio")
      .select("reservas_activas")
      .eq("id", 1)
      .maybeSingle();

    if (config?.reservas_activas) {
      return {
        error:
          "Las reservas por la web están encendidas. Apágalas en Sitio antes de dejar el horario vacío.",
      };
    }
  }

  const { error } = await supabase.rpc("guardar_franjas", { p_franjas: franjas });
  if (error) return { error: error.message };

  revalidatePath("/admin/agenda");
  revalidatePath("/admin/agenda/horario");
  return SIN_ERROR;
}

/**
 * Cierra un día a las reservas. Lo que ya estaba reservado ese día no se toca:
 * se cuenta y se avisa, para que alguien les escriba.
 */
export async function cerrarDia(
  previo: EstadoDiaCerrado,
  datos: FormData,
): Promise<EstadoDiaCerrado> {
  await requerirStaff();

  const fecha = texto(datos, "fecha");
  const motivo = texto(datos, "motivo");

  // En un error se devuelve el `creado` anterior (ver EstadoCatalogo): si
  // cambiara, el formulario se remontaría y se perdería lo escrito.
  const fallo = (error: string): EstadoDiaCerrado => ({ ...previo, error, aviso: null });

  if (!FECHA.test(fecha)) return fallo("Elige la fecha.");
  if (fecha < fechaISOLima(new Date())) return fallo("Esa fecha ya pasó.");
  if (motivo.length > 80) return fallo("El motivo no puede pasar de 80 letras.");

  const supabase = await crearClienteServidor();

  const { error } = await supabase.from("dia_cerrado").insert({ fecha, motivo });
  if (error) return fallo(error.code === "23505" ? "Ese día ya está cerrado." : error.message);

  const { count } = await supabase
    .from("reserva")
    .select("id", { count: "exact", head: true })
    .eq("fecha", fecha)
    .in("estado", ["PENDIENTE", "CONFIRMADA"]);

  revalidatePath("/admin/agenda");
  revalidatePath("/admin/agenda/horario");

  return {
    error: null,
    // La hora entra en la `key` para que cerrar dos veces la misma fecha,
    // abriéndola entre medio, también limpie el formulario.
    creado: `${fecha}-${Date.now()}`,
    aviso: count
      ? `Ese día ya ${count === 1 ? "había una reserva" : `había ${count} reservas`}. Siguen en la agenda: avísales por WhatsApp.`
      : null,
  };
}

export async function abrirDia(fecha: string): Promise<void> {
  await requerirStaff();
  if (!FECHA.test(fecha)) return;

  const supabase = await crearClienteServidor();
  await supabase.from("dia_cerrado").delete().eq("fecha", fecha);

  revalidatePath("/admin/agenda");
  revalidatePath("/admin/agenda/horario");
}
