"use server";

import { redirect } from "next/navigation";

import { supabaseConfigurado } from "@/lib/supabase/env";
import { crearClienteServidor } from "@/lib/supabase/server";

export type EstadoAcceso = { error: string | null };

export async function iniciarSesion(
  _estadoPrevio: EstadoAcceso,
  datos: FormData,
): Promise<EstadoAcceso> {
  const email = String(datos.get("email") ?? "").trim();
  const password = String(datos.get("password") ?? "");

  if (!supabaseConfigurado()) {
    return { error: "Falta conectar el proyecto de Supabase. Ver docs/PUESTA_EN_MARCHA.md." };
  }

  if (!email || !password) {
    return { error: "Completa el correo y la contraseña." };
  }

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Sin detalle de si falló el correo o la contraseña: decirlo permite
    // averiguar qué correos existen.
    return { error: "Correo o contraseña incorrectos." };
  }

  redirect("/admin");
}

export async function cerrarSesion(): Promise<void> {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect("/acceso");
}
