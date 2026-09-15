/**
 * El tipo y el valor inicial que comparten los formularios del panel.
 *
 * Vive fuera de `acciones.ts` por una razón concreta: **un archivo `"use server"`
 * solo puede exportar funciones async.** Exportar de ahí una constante hace que
 * el módulo entero falle al evaluarse, así que dejan de funcionar todas las
 * acciones a la vez, no solo la que toca el valor.
 *
 * Y `next build` no lo detecta: el error aparece solo al ejecutar. Si algún día
 * hace falta compartir otra constante entre acciones y formularios, va acá.
 */

export type EstadoFormulario = { error: string | null };

export const SIN_ERROR: EstadoFormulario = { error: null };

/**
 * Alta de catálogo. `creado` lleva el id del servicio recién insertado y se usa
 * como `key` del formulario: cuando cambia, React lo remonta y los campos
 * quedan vacíos para el siguiente. Sin efectos y sin limpiar estado a mano.
 *
 * **Cuando la acción falla, devuelve el `creado` que ya tenía**, no `null`.
 * Después de un alta exitosa la `key` es el id nuevo; si el siguiente intento
 * fallara con `creado: null`, la `key` cambiaría, el remonte vaciaría el
 * formulario y se perdería lo escrito junto con el error.
 */
export type EstadoCatalogo = EstadoFormulario & { creado: string | null };

export const CATALOGO_INICIAL: EstadoCatalogo = { error: null, creado: null };

/**
 * Días cerrados de la agenda. El mismo truco de la `key` con `creado`, más un
 * aviso que no es un error: cerrar un día que ya tenía reservas se puede, pero
 * hay que avisarles a esas personas.
 */
export type EstadoDiaCerrado = EstadoCatalogo & { aviso: string | null };

export const DIA_CERRADO_INICIAL: EstadoDiaCerrado = { error: null, creado: null, aviso: null };
