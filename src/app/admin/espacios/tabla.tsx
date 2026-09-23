"use client";

import { ArrowDown, ArrowUp, Trash } from "@phosphor-icons/react/dist/ssr";
import { useActionState, useState } from "react";

import { ETIQUETA_TIPO_ESPACIO, TIPOS_ESPACIO } from "@/lib/orden/espacio";

import {
  actualizarEspacio,
  borrarEspacio,
  crearEspacio,
  moverEspacio,
} from "../acciones-espacios";
import { Aviso } from "../componentes";
import { CATALOGO_INICIAL, SIN_ERROR } from "../estado-formulario";

/** Un espacio con lo que hay adentro, ya contado en el servidor. */
export type EspacioEnTabla = {
  id: string;
  nombre: string;
  tipo: string;
  capacidad: number;
  activo: boolean;
  /**
   * Vehículos que están ahí ahora mismo. También es lo que impide borrarlo:
   * la orden apunta al espacio con `on delete restrict`, así que mientras haya
   * una adentro la base no deja.
   */
  dentro: number;
  primero: boolean;
  ultimo: boolean;
};

const CLASES_INPUT = "w-full border border-borde bg-fondo-alto px-2.5 py-1.5 text-sm";

const CLASES_BOTON =
  "border border-borde-fuerte px-3 py-1.5 font-display text-xs font-semibold " +
  "tracking-[0.1em] uppercase transition duration-200 ease-salida hover:border-marca " +
  "hover:text-marca active:translate-y-px disabled:opacity-40 disabled:hover:border-borde-fuerte " +
  "disabled:hover:text-tinta";

/** Nombre · admite · cupo · dentro · activo · guardar · orden · borrar. */
const COLUMNAS =
  "grid grid-cols-[minmax(9rem,1fr)_8.5rem_4.5rem_4.5rem_4.5rem_6.5rem_4.5rem_2.5rem] items-center gap-2";

function OpcionesTipo() {
  return (
    <>
      {TIPOS_ESPACIO.map((tipo) => (
        <option key={tipo} value={tipo}>
          {ETIQUETA_TIPO_ESPACIO[tipo]}
        </option>
      ))}
    </>
  );
}

export function TablaEspacios({ espacios }: { espacios: EspacioEnTabla[] }) {
  if (espacios.length === 0) {
    return (
      <p className="border border-dashed border-borde-fuerte px-4 py-6 text-center text-sm text-tinta-suave">
        No hay ningún espacio, y el taller funciona igual: los vehículos figuran «en el taller» sin
        sitio asignado. Crea el primero abajo si quieres saber dónde está cada uno.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-3xl">
        <div className={`${COLUMNAS} border-b border-borde-fuerte pb-2 font-display text-[11px] font-semibold tracking-[0.14em] text-tinta-tenue uppercase`}>
          <span>Espacio</span>
          <span>Admite</span>
          <span>Cupo</span>
          <span>Dentro</span>
          <span className="text-center">Activo</span>
          <span />
          <span className="text-center">Orden</span>
          <span />
        </div>

        {espacios.map((espacio) => (
          <FilaEspacio key={espacio.id} espacio={espacio} />
        ))}
      </div>
    </div>
  );
}

type Campos = { nombre: string; tipo: string; capacidad: string; activo: boolean };

function desdeEspacio(espacio: EspacioEnTabla): Campos {
  return {
    nombre: espacio.nombre,
    tipo: espacio.tipo,
    capacidad: String(espacio.capacidad),
    activo: espacio.activo,
  };
}

/**
 * Una fila es un formulario, como en el catálogo: el botón solo se habilita
 * cuando hay algo cambiado, así que la fila dice por sí sola si está guardada.
 *
 * Borrar y reordenar son formularios aparte porque son otras acciones; van
 * anidados como hermanos, no dentro del de guardar, que en HTML no se puede.
 */
function FilaEspacio({ espacio }: { espacio: EspacioEnTabla }) {
  const [estado, accion, guardando] = useActionState(actualizarEspacio, SIN_ERROR);
  const [borrado, accionBorrar, borrando] = useActionState(borrarEspacio, SIN_ERROR);
  const [, accionMover, moviendo] = useActionState(moverEspacio, SIN_ERROR);
  const [campos, setCampos] = useState<Campos>(() => desdeEspacio(espacio));
  const [confirmando, setConfirmando] = useState(false);

  const original = desdeEspacio(espacio);
  const sucio = (Object.keys(campos) as (keyof Campos)[]).some(
    (campo) => campos[campo] !== original[campo],
  );

  function cambiar<C extends keyof Campos>(campo: C, valor: Campos[C]) {
    setCampos((previos) => ({ ...previos, [campo]: valor }));
  }

  const error = estado.error ?? borrado.error;

  return (
    <div className={`${COLUMNAS} border-b border-borde py-2 ${campos.activo ? "" : "opacity-60"}`}>
      <form action={accion} className="contents">
        <input type="hidden" name="id" value={espacio.id} />

        <input
          name="nombre"
          value={campos.nombre}
          onChange={(evento) => cambiar("nombre", evento.target.value)}
          aria-label="Nombre del espacio"
          className={CLASES_INPUT}
        />

        <select
          name="tipo"
          value={campos.tipo}
          onChange={(evento) => cambiar("tipo", evento.target.value)}
          aria-label="Qué vehículos admite"
          className={CLASES_INPUT}
        >
          <OpcionesTipo />
        </select>

        <input
          name="capacidad"
          value={campos.capacidad}
          onChange={(evento) => cambiar("capacidad", evento.target.value)}
          inputMode="numeric"
          aria-label="Cuántos vehículos entran"
          className={`${CLASES_INPUT} tabular-nums`}
        />

        <span className="px-2.5 font-mono text-sm tabular-nums text-tinta-tenue">
          {espacio.dentro}
        </span>

        {/*
          El valor viaja en un input oculto y el control visible es un botón:
          React no sincroniza `checked`, y el reset previo a la acción dejaba la
          casilla mostrando lo contrario de lo que se enviaba.
        */}
        <input type="hidden" name="activo" value={campos.activo ? "on" : ""} />

        <div className="flex justify-center">
          <button
            type="button"
            role="switch"
            aria-checked={campos.activo}
            aria-label="Espacio activo"
            onClick={() => cambiar("activo", !campos.activo)}
            className={`border px-2.5 py-0.5 font-display text-[11px] font-semibold tracking-[0.1em] uppercase ${
              campos.activo ? "border-marca bg-marca text-white" : "border-borde text-tinta-tenue"
            }`}
          >
            {campos.activo ? "Sí" : "No"}
          </button>
        </div>

        <button type="submit" disabled={!sucio || guardando} className={CLASES_BOTON}>
          {guardando ? "Guardando…" : sucio ? "Guardar" : "Guardado"}
        </button>
      </form>

      <form action={accionMover} className="flex justify-center gap-1">
        <input type="hidden" name="id" value={espacio.id} />
        <button
          type="submit"
          name="paso"
          value="sube"
          disabled={espacio.primero || moviendo}
          aria-label="Subir el espacio"
          className="border border-borde p-1 transition-colors duration-200 hover:border-marca hover:text-marca disabled:opacity-30 disabled:hover:border-borde disabled:hover:text-tinta"
        >
          <ArrowUp size={13} />
        </button>
        <button
          type="submit"
          name="paso"
          value="baja"
          disabled={espacio.ultimo || moviendo}
          aria-label="Bajar el espacio"
          className="border border-borde p-1 transition-colors duration-200 hover:border-marca hover:text-marca disabled:opacity-30 disabled:hover:border-borde disabled:hover:text-tinta"
        >
          <ArrowDown size={13} />
        </button>
      </form>

      {/*
        Borrar solo sale si nunca pasó un vehículo por ahí. Con historia detrás,
        la base lo impide (`on delete restrict`) y lo que corresponde es
        desactivarlo, así que ni se ofrece.
      */}
      <form action={accionBorrar} className="flex justify-center">
        <input type="hidden" name="id" value={espacio.id} />
        {espacio.dentro > 0 ? (
          <span
            title="Hay un vehículo adentro: sácalo antes, o desactiva el espacio."
            className="font-mono text-[11px] text-tinta-tenue"
          >
            —
          </span>
        ) : confirmando ? (
          <button
            type="submit"
            disabled={borrando}
            className="border border-marca bg-marca px-2 py-1 font-display text-[10px] font-bold tracking-[0.1em] text-white uppercase disabled:opacity-50"
          >
            {borrando ? "…" : "Sí"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            aria-label={`Borrar ${espacio.nombre}`}
            className="border border-borde p-1 text-tinta-tenue transition-colors duration-200 hover:border-marca hover:text-marca"
          >
            <Trash size={13} />
          </button>
        )}
      </form>

      {error ? (
        <div className="col-span-full pt-1 pb-1.5">
          <Aviso>{error}</Aviso>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Alta de espacios. El id recién creado cambia la `key` del hijo, React lo
 * remonta vacío y el estado de la acción sobrevive: el mismo truco del catálogo.
 */
export function NuevoEspacio() {
  const [estado, accion, enviando] = useActionState(crearEspacio, CATALOGO_INICIAL);

  return (
    <CamposNuevo
      key={estado.creado ?? "nuevo"}
      accion={accion}
      enviando={enviando}
      error={estado.error}
    />
  );
}

function CamposNuevo({
  accion,
  enviando,
  error,
}: {
  accion: (datos: FormData) => void;
  enviando: boolean;
  error: string | null;
}) {
  // Controlados: React vacía los campos sin controlar en cuanto la acción
  // termina, también cuando devuelve error, y se perdería lo escrito.
  const [campos, setCampos] = useState({ nombre: "", tipo: "AMBOS", capacidad: "1" });

  function cambiar(campo: keyof typeof campos, valor: string) {
    setCampos((previos) => ({ ...previos, [campo]: valor }));
  }

  return (
    <div className="flex flex-col gap-2.5">
      <form action={accion} className="flex flex-col gap-3 @xl:flex-row @xl:items-center">
      <input
        name="nombre"
        value={campos.nombre}
        onChange={(evento) => cambiar("nombre", evento.target.value)}
        placeholder="Patio, Elevador 1, Vereda…"
        required
        aria-label="Nombre del espacio"
        className={`${CLASES_INPUT} @xl:max-w-64`}
      />

      <select
        name="tipo"
        value={campos.tipo}
        onChange={(evento) => cambiar("tipo", evento.target.value)}
        aria-label="Qué vehículos admite"
        className={`${CLASES_INPUT} @xl:max-w-40`}
      >
        <OpcionesTipo />
      </select>

      <input
        name="capacidad"
        value={campos.capacidad}
        onChange={(evento) => cambiar("capacidad", evento.target.value)}
        inputMode="numeric"
        aria-label="Cuántos vehículos entran"
        className={`${CLASES_INPUT} tabular-nums @xl:max-w-24`}
      />

      <button type="submit" disabled={enviando} className={`${CLASES_BOTON} shrink-0 py-2`}>
        {enviando ? "Agregando…" : "Agregar"}
      </button>
      </form>

      {error ? <Aviso>{error}</Aviso> : null}
    </div>
  );
}
