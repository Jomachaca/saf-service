/**
 * Dinero. Todo en céntimos, enteros. Nunca float (decisión 6).
 *
 * El IGV es configurable: `config_sitio` decide si los precios guardados ya lo
 * incluyen o si es una base a la que hay que sumárselo (decisión 16). El
 * cálculo vive acá y en ningún otro lado; ninguna vista recalcula por su cuenta.
 */

export type ConfigIgv = {
  /** true: los precios guardados ya incluyen IGV. false: son base imponible. */
  igvIncluido: boolean;
  /** Tasa en basis points. 1800 = 18 %. Se guarda para no reescribir historia. */
  igvTasaBp: number;
};

export const IGV_PERU_BP = 1800;

export type Desglose = {
  subtotalCentimos: number;
  igvCentimos: number;
  totalCentimos: number;
};

/** Importe de una línea. `cantidad` puede ser fraccionaria (0.5 h de mano de obra). */
export function importeLinea(cantidad: number, precioUnitarioCentimos: number): number {
  return Math.round(cantidad * precioUnitarioCentimos);
}

export function sumar(importesCentimos: readonly number[]): number {
  return importesCentimos.reduce((total, importe) => total + importe, 0);
}

/**
 * Desglosa la suma de las líneas según cómo esté configurado el IGV.
 *
 * En ambos casos el IGV se calcula como diferencia contra el otro extremo, así
 * `subtotal + igv === total` siempre, sin que sobre o falte un céntimo.
 */
export function desglosar(sumaLineasCentimos: number, config: ConfigIgv): Desglose {
  const { igvIncluido, igvTasaBp } = config;

  if (igvIncluido) {
    const totalCentimos = sumaLineasCentimos;
    const subtotalCentimos = Math.round(
      (totalCentimos * 10_000) / (10_000 + igvTasaBp),
    );
    return { subtotalCentimos, igvCentimos: totalCentimos - subtotalCentimos, totalCentimos };
  }

  const subtotalCentimos = sumaLineasCentimos;
  const totalCentimos = subtotalCentimos + Math.round((subtotalCentimos * igvTasaBp) / 10_000);
  return { subtotalCentimos, igvCentimos: totalCentimos - subtotalCentimos, totalCentimos };
}

const FORMATO_SOLES = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

export function formatearSoles(centimos: number): string {
  return FORMATO_SOLES.format(centimos / 100);
}

/**
 * Lee un monto tecleado por una persona ("1234.5", "1 234,50", "S/ 80") y lo
 * convierte a céntimos sin pasar por float. Devuelve null si no se entiende.
 */
export function centimosDesdeTexto(texto: string): number | null {
  const limpio = texto.replace(/[^\d.,-]/g, "").replace(",", ".");
  if (limpio === "" || !/^-?\d*\.?\d*$/.test(limpio)) return null;

  const negativo = limpio.startsWith("-");
  const [enteros = "0", decimales = ""] = limpio.replace("-", "").split(".");
  if (decimales.length > 2) return null;

  const centimos = Number(enteros || "0") * 100 + Number(decimales.padEnd(2, "0") || "0");
  if (!Number.isSafeInteger(centimos)) return null;

  return negativo ? -centimos : centimos;
}
