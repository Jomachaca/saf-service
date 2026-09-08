"use server";

import { revalidatePath } from "next/cache";

import { responderComoCliente } from "@/lib/publico";

export type EstadoRespuesta = { error: string | null };

export async function responderPresupuesto(
  _previo: EstadoRespuesta,
  datos: FormData,
): Promise<EstadoRespuesta> {
  const token = String(datos.get("token") ?? "");
  const decision = String(datos.get("decision") ?? "");
  const nombre = String(datos.get("nombre") ?? "").trim();

  if (decision !== "APROBADO" && decision !== "RECHAZADO") {
    return { error: "Elige aprobar o rechazar." };
  }

  if (!nombre) {
    // No es una identidad verificada y no se presenta como tal, pero sin ningún
    // nombre la constancia de la decisión 8 no dice nada.
    return { error: "Escribe tu nombre para dejar constancia de la decisión." };
  }

  const { error } = await responderComoCliente(token, decision, nombre);
  if (error) return { error };

  revalidatePath(`/o/${token}`);
  return { error: null };
}
