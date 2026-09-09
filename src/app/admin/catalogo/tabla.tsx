"use client";

import { useActionState, useState } from "react";

import {
  CATEGORIAS,
  ETIQUETA_CATEGORIA,
  type ServicioCatalogo,
} from "@/lib/orden/presupuesto";

import { actualizarServicio, crearServicio } from "../acciones-catalogo";
import { Aviso } from "../componentes";
import { CATALOGO_INICIAL, SIN_ERROR } from "../estado-formulario";

const CLASES_INPUT =
  "w-full rounded-lg border border-borde bg-fondo-alto px-2.5 py-1.5 text-sm";

const CLASES_BOTON =
  "rounded-lg border border-borde-fuerte px-3 py-1.5 text-sm font-medium disabled:opacity-40";

/** Nombre · categoría · precio · minutos · activo · botón. */
const COLUMNAS =
  "grid grid-cols-[minmax(10rem,1fr)_12.5rem_6.5rem_5.5rem_4rem_6rem] items-center gap-2";

function enSoles(centimos: number): string {
  return (centimos / 100).toFixed(2);
}

type Campos = {
  nombre: string;
  categoria: string;
  precio: string;
  duracion: string;
  activo: boolean;
};

function desdeServicio(servicio: ServicioCatalogo): Campos {
  return {
    nombre: servicio.nombre,
    categoria: servicio.categoria,
    precio: enSoles(servicio.precio_base_centimos),
    duracion: String(servicio.duracion_min),
    activo: servicio.activo,
  };
}

function OpcionesCategoria() {
  return (
    <>
      {CATEGORIAS.map((categoria) => (
        <option key={categoria} value={categoria}>
          {ETIQUETA_CATEGORIA[categoria]}
        </option>
      ))}
    </>
  );
}

export function TablaCatalogo({ servicios }: { servicios: ServicioCatalogo[] }) {
  if (servicios.length === 0) {
    return (
      <p className="text-sm text-tinta-suave">
        El catálogo está vacío. Agrega el primer servicio abajo.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-3xl">
        <div className={`${COLUMNAS} pb-1 text-xs text-tinta-tenue`}>
          <span>Servicio</span>
          <span>Categoría</span>
          <span>Precio S/</span>
          <span>Minutos</span>
          <span className="text-center">Activo</span>
          <span />
        </div>

        {servicios.map((servicio) => (
          <FilaServicio key={servicio.id} servicio={servicio} />
        ))}
      </div>
    </div>
  );
}

/**
 * Una fila es un formulario. El botón solo se habilita cuando hay algo
 * cambiado, así que la fila dice por sí sola si está guardada o no.
 *
 * El estado local no se sincroniza con el prop a propósito: si otra pestaña
 * cambia un precio mientras alguien está escribiendo, gana lo que se está
 * escribiendo. Lo otro se ve al recargar.
 */
function FilaServicio({ servicio }: { servicio: ServicioCatalogo }) {
  const [estado, accion, guardando] = useActionState(actualizarServicio, SIN_ERROR);
  const [campos, setCampos] = useState<Campos>(() => desdeServicio(servicio));

  const original = desdeServicio(servicio);
  const sucio = (Object.keys(campos) as (keyof Campos)[]).some(
    (campo) => campos[campo] !== original[campo],
  );

  function cambiar<C extends keyof Campos>(campo: C, valor: Campos[C]) {
    setCampos((previos) => ({ ...previos, [campo]: valor }));
  }

  return (
    <form
      action={accion}
      className={`${COLUMNAS} border-t border-borde py-1.5 ${
        campos.activo ? "" : "opacity-60"
      }`}
    >
      <input type="hidden" name="id" value={servicio.id} />

      <input
        name="nombre"
        value={campos.nombre}
        onChange={(evento) => cambiar("nombre", evento.target.value)}
        aria-label="Nombre del servicio"
        className={CLASES_INPUT}
      />

      <select
        name="categoria"
        value={campos.categoria}
        onChange={(evento) => cambiar("categoria", evento.target.value)}
        aria-label="Categoría"
        className={CLASES_INPUT}
      >
        <OpcionesCategoria />
      </select>

      <input
        name="precio"
        value={campos.precio}
        onChange={(evento) => cambiar("precio", evento.target.value)}
        inputMode="decimal"
        aria-label="Precio en soles"
        className={`${CLASES_INPUT} tabular-nums`}
      />

      <input
        name="duracion"
        value={campos.duracion}
        onChange={(evento) => cambiar("duracion", evento.target.value)}
        inputMode="numeric"
        aria-label="Duración en minutos"
        className={`${CLASES_INPUT} tabular-nums`}
      />

      {/*
        El valor viaja en un input oculto y el control visible es un botón.
        React mantiene sincronizado el atributo `value` de los inputs
        controlados, así que el reset que corre antes de cada acción lo
        restaura bien. Con una casilla no lo hace —solo toca `checked` cuando
        cambia la prop— y la fila acababa mostrando marcado lo que el estado
        daba por desmarcado, enviando lo contrario de lo que se veía.
      */}
      <input type="hidden" name="activo" value={campos.activo ? "on" : ""} />

      <div className="flex justify-center">
        <button
          type="button"
          role="switch"
          aria-checked={campos.activo}
          aria-label="Servicio activo"
          onClick={() => cambiar("activo", !campos.activo)}
          className={`rounded-full border px-2.5 py-0.5 text-xs ${
            campos.activo
              ? "border-emerald-600/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              : "border-borde"
          }`}
        >
          {campos.activo ? "Sí" : "No"}
        </button>
      </div>

      <button type="submit" disabled={!sucio || guardando} className={CLASES_BOTON}>
        {guardando ? "Guardando…" : sucio ? "Guardar" : "Guardado"}
      </button>

      {estado.error ? (
        <div className="col-span-full pb-1">
          <Aviso>{estado.error}</Aviso>
        </div>
      ) : null}
    </form>
  );
}

/**
 * Alta de servicios.
 *
 * `useActionState` vive acá y los campos en el hijo: al crear uno, el id nuevo
 * cambia la `key`, React remonta los campos vacíos y el estado de la acción
 * sobrevive. Si la `key` colgara del mismo componente que guarda el estado, el
 * remonte lo borraría y volvería a montar en bucle.
 */
export function NuevoServicio() {
  const [estado, accion, enviando] = useActionState(crearServicio, CATALOGO_INICIAL);

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
  // Controlados a propósito. React vacía los campos NO controlados en cuanto la
  // acción termina, también cuando devuelve error: quien escribía mal el precio
  // perdía además el nombre y los minutos. Con el valor en estado el formulario
  // sobrevive al error, y en el alta lo vacía el remonte por `key`.
  const [campos, setCampos] = useState({
    nombre: "",
    categoria: "MANTENIMIENTO",
    precio: "",
    duracion: "",
  });

  function cambiar(campo: keyof typeof campos, valor: string) {
    setCampos((previos) => ({ ...previos, [campo]: valor }));
  }

  return (
    <div className="overflow-x-auto">
      <form action={accion} className={`${COLUMNAS} min-w-3xl`}>
        <input
          name="nombre"
          value={campos.nombre}
          onChange={(evento) => cambiar("nombre", evento.target.value)}
          placeholder="Nombre del servicio"
          required
          aria-label="Nombre del servicio"
          className={CLASES_INPUT}
        />

        <select
          name="categoria"
          value={campos.categoria}
          onChange={(evento) => cambiar("categoria", evento.target.value)}
          aria-label="Categoría"
          className={CLASES_INPUT}
        >
          <OpcionesCategoria />
        </select>

        <input
          name="precio"
          value={campos.precio}
          onChange={(evento) => cambiar("precio", evento.target.value)}
          placeholder="0.00"
          inputMode="decimal"
          aria-label="Precio en soles"
          className={`${CLASES_INPUT} tabular-nums`}
        />

        <input
          name="duracion"
          value={campos.duracion}
          onChange={(evento) => cambiar("duracion", evento.target.value)}
          placeholder="60"
          inputMode="numeric"
          aria-label="Duración en minutos"
          className={`${CLASES_INPUT} tabular-nums`}
        />

        <span />

        <button type="submit" disabled={enviando} className={CLASES_BOTON}>
          {enviando ? "Agregando…" : "Agregar"}
        </button>

        {error ? (
          <div className="col-span-full pt-2">
            <Aviso>{error}</Aviso>
          </div>
        ) : null}
      </form>
    </div>
  );
}
