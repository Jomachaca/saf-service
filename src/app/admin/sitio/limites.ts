/**
 * Límites que comparten el formulario y su acción.
 *
 * Van en su propio módulo porque `acciones.ts` es un archivo `"use server"` y
 * esos solo pueden exportar funciones async: una constante exportada desde ahí
 * rompe el módulo entero al evaluarse y se caen todas las acciones a la vez.
 */

/** La banda de la portada son cuatro celdas; con más, la fila se parte feo. */
export const MAXIMO_DATOS_PORTADA = 4;
