import { Suspense } from "react";

import { cargarTablero } from "@/lib/orden/consultas";
import { requerirStaff } from "@/lib/sesion";

import { Encabezado, Seccion } from "../componentes";
import { NuevoEspacio, TablaEspacios, type EspacioEnTabla } from "./tabla";

export const metadata = {
  title: "Espacios",
};

/**
 * Los lugares del taller: un patio, dos elevadores, lo que sea que tenga cada
 * taller (decisión 35). Antes eran «boxes» y venían fijos de la migración
 * inicial; acá se crean, se renombran, se reordenan y se les dice cuántos
 * vehículos les caben.
 *
 * No hay un mínimo de espacios y no hace falta: un vehículo puede estar en el
 * taller sin sitio asignado, que es lo que antes se llamaba «patio». Con la
 * lista vacía el sistema funciona igual; lo único que se pierde es saber dónde
 * está cada auto.
 */
export default function PaginaEspacios() {
  return (
    <div className="flex flex-col gap-8">
      <Encabezado
        seccion="Panel · cómo es el taller"
        titulo="Espacios"
        descripcion="Los lugares donde puede estar un vehículo mientras está acá, y cuántos entran en cada uno."
      />

      <Suspense fallback={<p className="text-sm text-tinta-tenue">Cargando los espacios…</p>}>
        <Contenido />
      </Suspense>
    </div>
  );
}

async function Contenido() {
  await requerirStaff();

  const { espacios, ocupacion } = await cargarTablero();

  const enTabla: EspacioEnTabla[] = espacios.map((espacio, indice) => ({
    id: espacio.id,
    nombre: espacio.nombre,
    tipo: espacio.tipo,
    capacidad: espacio.capacidad,
    activo: espacio.activo,
    dentro: ocupacion.get(espacio.id)?.length ?? 0,
    primero: indice === 0,
    ultimo: indice === espacios.length - 1,
  }));

  const activos = enTabla.filter((espacio) => espacio.activo).length;

  return (
    <div className="flex flex-col gap-8">
      <Seccion
        titulo="Los espacios"
        conteo={enTabla.length > 0 ? `${activos} activos de ${enTabla.length}` : undefined}
      >
        <TablaEspacios espacios={enTabla} />

        <div className="flex max-w-3xl flex-col gap-1.5 text-xs text-tinta-tenue">
          <p>
            <strong className="font-semibold text-tinta-suave">Cupo</strong> es cuántos vehículos
            entran a la vez. Un elevador vale 1; un patio, los que quepan. Al recibir no se ofrece
            un espacio lleno, y la base tampoco deja meterlo a la fuerza.
          </p>
          <p>
            <strong className="font-semibold text-tinta-suave">Desactivar</strong> saca el espacio
            de la recepción y del tablero sin borrar nada de lo que pasó por ahí. Borrar solo se
            puede mientras no tenga ningún vehículo adentro.
          </p>
          <p>
            <strong className="font-semibold text-tinta-suave">Admite</strong> es informativo: se
            ve al elegir, pero no impide nada. El taller sabe mejor que el sistema si esa camioneta
            entra.
          </p>
        </div>
      </Seccion>

      <Seccion titulo="Agregar espacio">
        <NuevoEspacio />
      </Seccion>
    </div>
  );
}
