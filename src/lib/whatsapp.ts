/**
 * Enlaces `wa.me` con texto prellenado (decisión 9).
 *
 * No es la Cloud API y no pretende serlo: se abre WhatsApp con el mensaje
 * escrito y **es una persona la que aprieta enviar**. Por eso el evento que se
 * registra es `LINK_GENERADO` y nunca "cliente notificado" — `wa.me` no
 * devuelve ninguna confirmación de entrega (regla 7).
 */

import { sitioUrl } from "./sitio/url";

/** Perú. Se antepone cuando el número viene sin código de país. */
const CODIGO_PAIS = "51";

/**
 * Deja el número como lo quiere `wa.me`: solo dígitos, con código de país.
 * Acepta lo que el taller tenga guardado — "987 654 321", "+51 987654321".
 */
export function normalizarTelefono(telefono: string): string | null {
  const digitos = telefono.replace(/\D/g, "");
  if (digitos.length < 9) return null;

  // Un móvil peruano son 9 dígitos; si ya trae el 51 delante, no se duplica.
  if (digitos.length === 9) return `${CODIGO_PAIS}${digitos}`;
  return digitos;
}

/**
 * Reemplaza los `{marcadores}` de una plantilla editable desde el panel.
 * Un marcador sin valor se deja tal cual, para que se note que falta y no
 * desaparezca silenciosamente del mensaje.
 */
export function aplicarPlantilla(
  plantilla: string,
  valores: Record<string, string | null | undefined>,
): string {
  return plantilla.replace(/\{(\w+)\}/g, (original, clave: string) => {
    const valor = valores[clave];
    return valor ? String(valor) : original;
  });
}

/** "987654321" → "987 654 321", como se dicta un celular en Perú. */
export function formatearCelular(telefono: string): string {
  const digitos = telefono.replace(/\D/g, "").replace(/^51(?=9\d{8}$)/, "");
  if (digitos.length !== 9) return telefono;
  return `${digitos.slice(0, 3)} ${digitos.slice(3, 6)} ${digitos.slice(6)}`;
}

export function enlaceWhatsApp(telefono: string, mensaje: string): string | null {
  const numero = normalizarTelefono(telefono);
  if (!numero) return null;

  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

/** La URL que ve el cliente. Sale de `NEXT_PUBLIC_SITE_URL` (decisión 7). */
export function enlacePublico(token: string): string {
  return `${sitioUrl()}/o/${token}`;
}
