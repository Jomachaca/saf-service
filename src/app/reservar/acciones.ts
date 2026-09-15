"use server";

import { esTipoVehiculo } from "@/lib/reserva/modelo";
import { supabaseConfigurado } from "@/lib/supabase/env";
import { crearClientePublico } from "@/lib/supabase/publico";

import type { EstadoEnvioReserva } from "./estado";

function texto(datos: FormData, campo: string): string {
  return String(datos.get(campo) ?? "").trim();
}

function fallo(error: string): EstadoEnvioReserva {
  return { error, reservada: false };
}

/**
 * Reserva desde el sitio público. No hay sesión detrás.
 *
 * Las reglas que importan (cupos, anticipación, días cerrados, el tope por
 * celular) viven en `crear_reserva()` y no acá. La función se puede llamar con
 * la clave pública desde cualquier lado, así que validar solo en esta acción
 * sería poner candado a la puerta y dejar abierta la pared de al lado
 * (decisión 26). Lo de acá sirve para contestar rápido lo evidente.
 */
export async function crearReserva(
  _previo: EstadoEnvioReserva,
  datos: FormData,
): Promise<EstadoEnvioReserva> {
  const fecha = texto(datos, "fecha");
  const hora = texto(datos, "hora");
  const modo = texto(datos, "modo");
  const servicioId = modo === "servicio" ? texto(datos, "servicio_id") : "";
  const tipo = texto(datos, "tipo_vehiculo");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !/^\d{2}:\d{2}(:\d{2})?$/.test(hora)) {
    return fallo("Elige el día y la hora.");
  }
  if (modo === "servicio" && !servicioId) {
    return fallo("Elige el servicio, o marca que no sabes qué tiene.");
  }
  if (!texto(datos, "nombre")) return fallo("Escribe tu nombre.");
  if (!texto(datos, "telefono")) return fallo("Escribe tu celular.");
  if (!esTipoVehiculo(tipo)) return fallo("Elige si es un auto o una camioneta.");

  if (!supabaseConfigurado()) {
    return fallo("Las reservas no están disponibles en este momento.");
  }

  const { error } = await crearClientePublico().rpc("crear_reserva", {
    p_nombre: texto(datos, "nombre"),
    p_telefono: texto(datos, "telefono"),
    p_tipo_vehiculo: tipo,
    p_fecha: fecha,
    p_hora: hora,
    p_servicio_id: servicioId || undefined,
    p_detalle: texto(datos, "detalle") || undefined,
    p_vehiculo: texto(datos, "vehiculo") || undefined,
    p_placa: texto(datos, "placa") || undefined,
  });

  if (error) {
    // P0001 son los mensajes que escribe la propia función, pensados para quien
    // llena el formulario. Cualquier otro error es nuestro y no se le muestra.
    if (error.code === "P0001") return fallo(error.message);

    console.error("crear_reserva falló", error);
    return fallo("No pudimos registrar la reserva. Intenta de nuevo o escríbenos por WhatsApp.");
  }

  return { error: null, reservada: true };
}
