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
 */
export type EstadoCatalogo = EstadoFormulario & { creado: string | null };

export const CATALOGO_INICIAL: EstadoCatalogo = { error: null, creado: null };
