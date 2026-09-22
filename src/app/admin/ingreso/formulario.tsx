"use client";

import { CalendarCheck } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";

import type { Box, VehiculoEncontrado } from "@/lib/orden/consultas";
import { UBICACIONES, ETIQUETA_UBICACION, type Ubicacion } from "@/lib/orden/ubicacion";

import { Aviso } from "../componentes";
import { buscarVehiculos, recepcionarVehiculo } from "../acciones";
import { SIN_ERROR } from "../estado-formulario";

const CLASES_INPUT =
  "w-full rounded-lg border border-borde bg-fondo-alto px-3 py-2";

/** La reserva con la que llega el vehículo, con su texto ya armado en el servidor. */
export type ReservaEnRecepcion = {
  id: string;
  nombre: string;
  telefono: string;
  placa: string | null;
  vehiculo: string;
  tipo: "SEDAN" | "GRANDE";
  motivo: string;
  cuando: string;
};

/**
 * Recepción en menos de 60 segundos (ARQUITECTURA.md §10). Es un requisito, no
 * una aspiración: si el recepcionista siente que tarda menos anotando en papel,
 * el sistema deja de reflejar la realidad y el tablero miente.
 *
 * Por eso todo va en una pantalla, sin pasos que recarguen. Si el vehículo ya
 * vino antes, quedan cuatro campos por llenar.
 *
 * Cuando llega desde la agenda con una reserva, la búsqueda arranca sola con la
 * placa o el celular, y el motivo y los datos del cliente ya vienen puestos. Es
 * la misma pantalla con menos que escribir, no un flujo aparte (decisión 28).
 */
export function FormularioIngreso({
  boxes,
  boxesLibres,
  reserva,
}: {
  boxes: Box[];
  boxesLibres: string[];
  reserva: ReservaEnRecepcion | null;
}) {
  const [estado, accion, enviando] = useActionState(recepcionarVehiculo, SIN_ERROR);
  const [elegido, setElegido] = useState<VehiculoEncontrado | null>(null);
  const [esNuevo, setEsNuevo] = useState(false);
  const [ubicacion, setUbicacion] = useState<Ubicacion>("BOX");
  const [kilometraje, setKilometraje] = useState("");

  return (
    <form action={accion} className="flex max-w-2xl flex-col gap-6">
      {reserva ? <ConReserva reserva={reserva} /> : null}

      {elegido ? (
        <VehiculoElegido vehiculo={elegido} onQuitar={() => setElegido(null)} />
      ) : esNuevo ? (
        <VehiculoNuevo
          onCancelar={() => setEsNuevo(false)}
          inicial={
            reserva
              ? {
                  placa: reserva.placa ?? "",
                  tipo: reserva.tipo,
                  cliente_nombre: reserva.nombre,
                  cliente_telefono: reserva.telefono,
                }
              : undefined
          }
          escribio={reserva?.vehiculo || null}
        />
      ) : (
        <Buscador
          onElegir={setElegido}
          onNuevo={() => setEsNuevo(true)}
          terminoInicial={reserva ? (reserva.placa ?? reserva.telefono.replace(/\s/g, "")) : ""}
        />
      )}

      <Campo etiqueta="Motivo de ingreso">
        <MotivoConAtajos inicial={reserva?.motivo ?? ""} />
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
                className={`border px-3 py-1.5 text-sm ${
                  ubicacion === opcion
                    ? "border-marca bg-marca text-sobre-marca"
                    : "border-borde"
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
          className="border border-marca bg-marca px-4 py-2.5 font-display text-sm font-semibold tracking-[0.09em] text-white uppercase transition duration-200 ease-salida hover:bg-marca-viva active:translate-y-px disabled:opacity-50"
        >
          {enviando ? "Creando orden…" : "Crear orden"}
        </button>
      </div>
    </form>
  );
}

/**
 * La reserva viaja en un input oculto, y la base la cierra en la misma
 * transacción que abre la orden (decisión 28). Si alguien la canceló mientras
 * tanto, no se crea nada.
 */
function ConReserva({ reserva }: { reserva: ReservaEnRecepcion }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-marca/30 bg-vino-50 px-3 py-2.5 text-sm dark:bg-vino-900/30">
      <input type="hidden" name="reserva_id" value={reserva.id} />
      <CalendarCheck size={18} weight="duotone" className="text-marca" />
      <span className="font-medium">Reserva de {reserva.nombre}</span>
      <span className="text-tinta-suave">{reserva.cuando}</span>
      <Link href="/admin/ingreso" className="ml-auto underline underline-offset-4">
        Recibir sin reserva
      </Link>
    </div>
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

function MotivoConAtajos({ inicial }: { inicial: string }) {
  const campo = useRef<HTMLInputElement>(null);
  // En estado y no en el DOM: React vacía los campos no controlados en cuanto
  // se envía el formulario, y una recepción rechazada —placa repetida, box
  // ocupado— borraba todo lo escrito.
  const [motivo, setMotivo] = useState(inicial);

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
            className="border border-borde px-3 py-1.5 text-xs transition-colors duration-200 hover:border-borde-fuerte"
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
  terminoInicial,
}: {
  onElegir: (vehiculo: VehiculoEncontrado) => void;
  onNuevo: () => void;
  terminoInicial: string;
}) {
  // Con una reserva, arranca con su placa o su celular y la búsqueda sale sola.
  const [termino, setTermino] = useState(terminoInicial);
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

      {buscando ? <p className="text-sm text-tinta-tenue">Buscando…</p> : null}

      {resultados.length > 0 ? (
        <ul className="flex flex-col divide-y divide-borde rounded-lg border border-borde">
          {resultados.map((vehiculo) => (
            <li key={vehiculo.id}>
              <button
                type="button"
                disabled={Boolean(vehiculo.ordenAbierta)}
                onClick={() => onElegir(vehiculo)}
                className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-left hover:bg-fondo-hondo disabled:opacity-50"
              >
                <span className="font-mono font-medium">{vehiculo.placa}</span>
                <span className="text-sm opacity-80">
                  {vehiculo.marca} {vehiculo.modelo}
                </span>
                <span className="text-sm text-tinta-suave">{vehiculo.cliente.nombre}</span>
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

      {sinResultados ? (
        <p className="text-sm text-tinta-suave">
          {terminoInicial && limpio === terminoInicial.trim()
            ? "No hay ningún vehículo con los datos de la reserva. Si es la primera vez que viene, regístralo como nuevo."
            : "Sin resultados."}
        </p>
      ) : null}

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
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-borde px-3 py-2.5">
      <input type="hidden" name="vehiculo_id" value={vehiculo.id} />
      <input type="hidden" name="cliente_id" value={vehiculo.cliente.id} />

      <span className="font-mono font-medium">{vehiculo.placa}</span>
      <span className="text-sm opacity-80">
        {vehiculo.marca} {vehiculo.modelo}
      </span>
      <span className="text-sm text-tinta-suave">
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

type CamposVehiculo = {
  placa: string;
  tipo: string;
  marca: string;
  modelo: string;
  anio: string;
  cliente_nombre: string;
  cliente_telefono: string;
};

function VehiculoNuevo({
  onCancelar,
  inicial,
  escribio,
}: {
  onCancelar: () => void;
  inicial?: Partial<CamposVehiculo>;
  /** Lo que el cliente escribió en la reserva, para pasarlo a marca y modelo. */
  escribio: string | null;
}) {
  // El estado vive acá dentro y sobrevive al error porque el componente no se
  // desmonta. Con la placa repetida —el error más probable— se perdían los
  // siete campos del vehículo y del cliente, justo lo caro de volver a tipear.
  const [campos, setCampos] = useState<CamposVehiculo>({
    placa: "",
    tipo: "SEDAN",
    marca: "",
    modelo: "",
    anio: "",
    cliente_nombre: "",
    cliente_telefono: "",
    ...inicial,
  });

  // Si la placa ya vino de la reserva, lo que falta escribir empieza en la marca.
  const empezarEnMarca = Boolean(inicial?.placa);

  function cambiar(campo: keyof CamposVehiculo, valor: string) {
    setCampos((previos) => ({ ...previos, [campo]: valor }));
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-borde p-4">
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

      {escribio ? (
        <p className="text-sm text-tinta-suave">
          En la reserva escribió: <span className="font-medium text-tinta">«{escribio}»</span>
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Placa">
          <input
            name="placa"
            required
            autoFocus={!empezarEnMarca}
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
            autoFocus={empezarEnMarca}
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
