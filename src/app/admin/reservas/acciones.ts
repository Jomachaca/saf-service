"use server";

import { revalidatePath } from "next/cache";

import { fechaISOLima } from "@/lib/fecha";
import { requerirStaff } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";

import {
  SIN_ERROR,
  type EstadoDiaCerrado,
  type EstadoFormulario,
} from "../estado-formulario";

function texto(datos: FormData, campo: string): string {
  return String(datos.get(campo) ?? "").trim();
}

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/*
 * Lo que configura las reservas por la web, todo en «Reservas»
 * (decisión 31). Confirmar o cancelar una reserva es de la agenda y sigue en
 * `acciones-agenda.ts`.
 */

/**
 * El interruptor, el horizonte y el mensaje para confirmar.
 *
 * El interruptor se lee en vivo: guardarlo apagado corta las reservas en ese
 * momento, sin publicar. Lo único que espera a «Publicar cambios» es el botón
 * de la portada, porque eso sí es contenido del sitio (decisión 29). Por eso
 * solo mover el interruptor marca que hay algo sin publicar.
 */
export async function guardarReservas(
  _previo: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  await requerirStaff();

  const activas = texto(datos, "reservas_activas") === "on";
  const dias = Number(texto(datos, "reservas_dias"));

  if (!Number.isInteger(dias) || dias < 1 || dias > 60) {
    return { error: "Los días hacia adelante van de 1 a 60." };
  }

  const supabase = await crearClienteServidor();

  const [{ data: actual }, { count: franjas }] = await Promise.all([
    supabase
      .from("config_sitio")
      .select("reservas_activas, plantillas_mensaje")
      .eq("id", 1)
      .maybeSingle(),
    supabase.from("franja").select("dia_semana", { count: "exact", head: true }),
  ]);

  if (activas && !franjas) {
    return {
      error: "Primero arma los cupos por hora, más abajo. Sin horario no hay nada que reservar.",
    };
  }

  const plantillas = (actual?.plantillas_mensaje ?? {}) as Record<string, string>;

  const cambios = {
    reservas_activas: activas,
    reservas_dias: dias,
    plantillas_mensaje: { ...plantillas, reserva: texto(datos, "plantilla_reserva") },
  };

  const { error } = await supabase
    .from("config_sitio")
    .update(
      activas === actual?.reservas_activas
        ? cambios
        : { ...cambios, actualizado_en: new Date().toISOString() },
    )
    .eq("id", 1);

  if (error) return { error: error.message };

  // Todo el panel y no solo esta página: mover el interruptor enciende el aviso
  // «Sin publicar» de la barra lateral y cambia la nota de la agenda.
  revalidatePath("/admin", "layout");
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
          "Las reservas por la web están encendidas. Apágalas arriba, en «Reservas en línea», antes de dejar el horario vacío.",
      };
    }
  }

  const { error } = await supabase.rpc("guardar_franjas", { p_franjas: franjas });
  if (error) return { error: error.message };

  revalidatePath("/admin/agenda");
  revalidatePath("/admin/reservas");
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
  revalidatePath("/admin/reservas");

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
  revalidatePath("/admin/reservas");
}
