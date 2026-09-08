"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";

import type { Box, VehiculoEncontrado } from "@/lib/orden/consultas";
import { UBICACIONES, ETIQUETA_UBICACION, type Ubicacion } from "@/lib/orden/ubicacion";

import { Aviso } from "../componentes";
import { buscarVehiculos, recepcionarVehiculo } from "../acciones";
import { SIN_ERROR } from "../estado-formulario";

const CLASES_INPUT =
  "w-full rounded-md border border-black/15 px-3 py-2 dark:border-white/20";

/**
 * Recepción en menos de 60 segundos (ARQUITECTURA.md §10). Es un requisito, no
 * una aspiración: si el recepcionista siente que tarda menos anotando en papel,
 * el sistema deja de reflejar la realidad y el tablero miente.
 *
 * Por eso todo va en una pantalla, sin pasos que recarguen. Si el vehículo ya
 * vino antes, quedan cuatro campos por llenar.
 */
export function FormularioIngreso({
  boxes,
  boxesLibres,
}: {
  boxes: Box[];
  boxesLibres: string[];
}) {
  const [estado, accion, enviando] = useActionState(recepcionarVehiculo, SIN_ERROR);
  const [elegido, setElegido] = useState<VehiculoEncontrado | null>(null);
  const [esNuevo, setEsNuevo] = useState(false);
  const [ubicacion, setUbicacion] = useState<Ubicacion>("BOX");
  const [kilometraje, setKilometraje] = useState("");

  return (
    <form action={accion} className="flex max-w-2xl flex-col gap-6">
      {elegido ? (
        <VehiculoElegido vehiculo={elegido} onQuitar={() => setElegido(null)} />
      ) : esNuevo ? (
        <VehiculoNuevo onCancelar={() => setEsNuevo(false)} />
      ) : (
        <Buscador onElegir={setElegido} onNuevo={() => setEsNuevo(true)} />
      )}

      <Campo etiqueta="Motivo de ingreso">
        <MotivoConAtajos />
      </Campo>

      <Campo etiqueta="Kilometraje" opcional>
        <input
          name="kilometraje"
          type="number"
          min={0}
          value={kilometraje}
          onChange={(evento) => setKilometraje(evento.target.value)}
          inputMode="numeric"
          className={CLASES_INPUT}
        />
      </Campo>

      <Campo etiqueta="Dónde queda">
        <div className="flex flex-col gap-2">
          {/*
            Botones y no radios: React no sincroniza el atributo `checked`, y
            el reset que corre antes de cada acción devolvía la selección del
            DOM a la que trajo el HTML. La píldora se veía marcada en un sitio
            y el formulario mandaba otro. El valor va en el input oculto.
          */}
          <input type="hidden" name="ubicacion" value={ubicacion} />

          <div className="flex flex-wrap gap-2">
            {UBICACIONES.map((opcion) => (
              <button
                key={opcion}
                type="button"
                aria-pressed={ubicacion === opcion}
                onClick={() => setUbicacion(opcion)}
                className={`rounded-full border px-3 py-1 text-sm ${
                  ubicacion === opcion
                    ? "border-foreground bg-foreground text-background"
                    : "border-black/15 dark:border-white/20"
                }`}
              >
                {ETIQUETA_UBICACION[opcion]}
              </button>
            ))}
          </div>

          {ubicacion === "BOX" ? (
            <select name="box_id" required defaultValue="" className={CLASES_INPUT}>
              <option value="" disabled>
                Elegir box…
              </option>
              {boxes.map((box) => {
                const libre = boxesLibres.includes(box.id);
                return (
                  <option key={box.id} value={box.id} disabled={!libre}>
                    {box.nombre} · {box.tipo}
                    {libre ? "" : " · ocupado"}
                  </option>
                );
              })}
            </select>
          ) : null}
        </div>
      </Campo>

      {estado.error ? <Aviso>{estado.error}</Aviso> : null}

      <div>
        <button
          type="submit"
          disabled={enviando || (!elegido && !esNuevo)}
          className="rounded-md bg-foreground px-4 py-2 font-medium text-background disabled:opacity-50"
        >
          {enviando ? "Creando orden…" : "Crear orden"}
        </button>
      </div>
    </form>
  );
}

function Campo({
  etiqueta,
  opcional,
  children,
}: {
  etiqueta: string;
  opcional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">
        {etiqueta}
        {opcional ? <span className="ml-1 opacity-50">(opcional)</span> : null}
      </span>
      {children}
    </label>
  );
}

/**
 * "No sé qué tiene / suena raro" va primero y a la vista: es la razón de ingreso
 * más común y el cliente no sabe encasillarla (decisión 15).
 */
const ATAJOS_MOTIVO = [
  "No sé qué tiene / suena raro",
  "Mantenimiento programado",
  "Cambio de aceite y filtros",
  "Revisión de frenos",
];

function MotivoConAtajos() {
  const campo = useRef<HTMLInputElement>(null);
  // En estado y no en el DOM: React vacía los campos no controlados en cuanto
  // se envía el formulario, y una recepción rechazada —placa repetida, box
  // ocupado— borraba todo lo escrito.
  const [motivo, setMotivo] = useState("");

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={campo}
        name="motivo"
        required
        value={motivo}
        onChange={(evento) => setMotivo(evento.target.value)}
        className={CLASES_INPUT}
      />

      <div className="flex flex-wrap gap-2">
        {ATAJOS_MOTIVO.map((atajo) => (
          <button
            key={atajo}
            type="button"
            onClick={() => {
              setMotivo(atajo);
              campo.current?.focus();
            }}
            className="rounded-full border border-black/15 px-3 py-1 text-xs hover:border-black/40 dark:border-white/20 dark:hover:border-white/50"
          >
            {atajo}
          </button>
        ))}
      </div>
    </div>
  );
}

function Buscador({
  onElegir,
  onNuevo,
}: {
  onElegir: (vehiculo: VehiculoEncontrado) => void;
  onNuevo: () => void;
}) {
  const [termino, setTermino] = useState("");
  const [buscando, empezarBusqueda] = useTransition();

  // Se guarda junto al término que lo produjo. Así los resultados de una
  // búsqueda anterior no se quedan en pantalla mientras se escribe la
  // siguiente, sin tener que limpiarlos a mano desde el efecto.
  const [hallazgo, setHallazgo] = useState<{
    termino: string;
    lista: VehiculoEncontrado[];
  }>({ termino: "", lista: [] });

  const limpio = termino.trim();

  useEffect(() => {
    const buscado = termino.trim();
    if (buscado.length < 3) return;

    // Una pausa corta para no lanzar una consulta por cada tecla.
    const temporizador = setTimeout(() => {
      empezarBusqueda(async () => {
        setHallazgo({ termino: buscado, lista: await buscarVehiculos(buscado) });
      });
    }, 250);

    return () => clearTimeout(temporizador);
  }, [termino]);

  const alDia = hallazgo.termino === limpio;
  const resultados = alDia ? hallazgo.lista : [];
  const sinResultados = limpio.length >= 3 && !buscando && alDia && resultados.length === 0;

  return (
    <div className="flex flex-col gap-2">
      <Campo etiqueta="Placa, teléfono o nombre">
        <input
          value={termino}
          onChange={(evento) => setTermino(evento.target.value)}
          autoFocus
          placeholder="ABC123 o 987654321"
          className={CLASES_INPUT}
        />
      </Campo>

      {buscando ? <p className="text-sm opacity-50">Buscando…</p> : null}

      {resultados.length > 0 ? (
        <ul className="flex flex-col divide-y divide-black/10 rounded-md border border-black/10 dark:divide-white/10 dark:border-white/15">
          {resultados.map((vehiculo) => (
            <li key={vehiculo.id}>
              <button
                type="button"
                disabled={Boolean(vehiculo.ordenAbierta)}
                onClick={() => onElegir(vehiculo)}
                className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-left hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/5"
              >
                <span className="font-mono font-medium">{vehiculo.placa}</span>
                <span className="text-sm opacity-80">
                  {vehiculo.marca} {vehiculo.modelo}
                </span>
                <span className="text-sm opacity-60">{vehiculo.cliente.nombre}</span>
                {vehiculo.ordenAbierta ? (
                  <span className="ml-auto text-xs opacity-70">
                    ya tiene abierta la {vehiculo.ordenAbierta.numero}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {sinResultados ? <p className="text-sm opacity-60">Sin resultados.</p> : null}

      <div>
        <button
          type="button"
          onClick={onNuevo}
          className="text-sm underline underline-offset-4"
        >
          Es un vehículo nuevo
        </button>
      </div>
    </div>
  );
}

function VehiculoElegido({
  vehiculo,
  onQuitar,
}: {
  vehiculo: VehiculoEncontrado;
  onQuitar: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-black/15 px-3 py-2.5 dark:border-white/20">
      <input type="hidden" name="vehiculo_id" value={vehiculo.id} />
      <input type="hidden" name="cliente_id" value={vehiculo.cliente.id} />

      <span className="font-mono font-medium">{vehiculo.placa}</span>
      <span className="text-sm opacity-80">
        {vehiculo.marca} {vehiculo.modelo}
      </span>
      <span className="text-sm opacity-60">
        {vehiculo.cliente.nombre} · {vehiculo.cliente.telefono}
      </span>

      <button
        type="button"
        onClick={onQuitar}
        className="ml-auto text-sm underline underline-offset-4"
      >
        Cambiar
      </button>
    </div>
  );
}

function VehiculoNuevo({ onCancelar }: { onCancelar: () => void }) {
  // El estado vive acá dentro y sobrevive al error porque el componente no se
  // desmonta. Con la placa repetida —el error más probable— se perdían los
  // siete campos del vehículo y del cliente, justo lo caro de volver a tipear.
  const [campos, setCampos] = useState({
    placa: "",
    tipo: "SEDAN",
    marca: "",
    modelo: "",
    anio: "",
    cliente_nombre: "",
    cliente_telefono: "",
  });

  function cambiar(campo: keyof typeof campos, valor: string) {
    setCampos((previos) => ({ ...previos, [campo]: valor }));
  }

  return (
    <div className="flex flex-col gap-4 rounded-md border border-black/15 p-4 dark:border-white/20">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">Vehículo nuevo</h2>
        <button
          type="button"
          onClick={onCancelar}
          className="text-sm underline underline-offset-4"
        >
          Buscar uno existente
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Placa">
          <input
            name="placa"
            required
            autoFocus
            value={campos.placa}
            onChange={(evento) => cambiar("placa", evento.target.value)}
            className={`${CLASES_INPUT} font-mono uppercase`}
          />
        </Campo>

        <Campo etiqueta="Tipo">
          <select
            name="tipo"
            required
            value={campos.tipo}
            onChange={(evento) => cambiar("tipo", evento.target.value)}
            className={CLASES_INPUT}
          >
            <option value="SEDAN">Sedán</option>
            <option value="GRANDE">Grande / camioneta</option>
          </select>
        </Campo>

        <Campo etiqueta="Marca">
          <input
            name="marca"
            required
            value={campos.marca}
            onChange={(evento) => cambiar("marca", evento.target.value)}
            className={CLASES_INPUT}
          />
        </Campo>

        <Campo etiqueta="Modelo">
          <input
            name="modelo"
            required
            value={campos.modelo}
            onChange={(evento) => cambiar("modelo", evento.target.value)}
            className={CLASES_INPUT}
          />
        </Campo>

        <Campo etiqueta="Año" opcional>
          <input
            name="anio"
            type="number"
            min={1900}
            max={2100}
            value={campos.anio}
            onChange={(evento) => cambiar("anio", evento.target.value)}
            className={CLASES_INPUT}
          />
        </Campo>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre del cliente">
          <input
            name="cliente_nombre"
            required
            value={campos.cliente_nombre}
            onChange={(evento) => cambiar("cliente_nombre", evento.target.value)}
            className={CLASES_INPUT}
          />
        </Campo>

        <Campo etiqueta="Teléfono">
          <input
            name="cliente_telefono"
            required
            inputMode="tel"
            value={campos.cliente_telefono}
            onChange={(evento) => cambiar("cliente_telefono", evento.target.value)}
            className={CLASES_INPUT}
          />
        </Campo>
      </div>
    </div>
  );
}
