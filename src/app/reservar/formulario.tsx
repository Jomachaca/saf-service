"use client";

import {
  CalendarCheck,
  Car,
  CheckCircle,
  MapPin,
  Stethoscope,
  Truck,
  WhatsappLogo,
  Wrench,
} from "@phosphor-icons/react/dist/ssr";
import { useActionState, useEffect, useRef, useState } from "react";

import {
  ETIQUETA_TIPO_VEHICULO,
  MOTIVO_DIAGNOSTICO,
  TIPOS_VEHICULO,
  type TipoVehiculo,
} from "@/lib/reserva/modelo";
import { enlaceWhatsApp, formatearCelular } from "@/lib/whatsapp";

import { Boton } from "../_landing/piezas";

import { crearReserva } from "./acciones";
import { ENVIO_INICIAL } from "./estado";

export type HoraParaElegir = { hora: string; etiqueta: string; libres: number };

/** Un día con todo su texto ya armado en el servidor (ver `page.tsx`). */
export type DiaParaElegir = {
  fecha: string;
  semana: string;
  dia: string;
  mes: string;
  relativo: string | null;
  largo: string;
  horas: HoraParaElegir[];
};

export type GrupoServicios = { categoria: string; servicios: { id: string; nombre: string }[] };

const CLASES_CAMPO =
  "w-full rounded-lg border border-borde bg-fondo-alto px-3.5 py-2.5 text-base text-tinta " +
  "placeholder:text-tinta-tenue transition-colors duration-200 focus:border-marca focus:outline-none";

/** Lo elegido se pinta igual en todos los controles: fondo granate y texto claro. */
const ELEGIDO = "border-marca bg-marca text-sobre-marca";
const SIN_ELEGIR = "border-borde bg-fondo-alto text-tinta hover:border-borde-fuerte";

const PULSABLE =
  "transition duration-200 ease-salida active:translate-y-px " +
  "disabled:cursor-not-allowed disabled:active:translate-y-0";

/**
 * El formulario de reserva.
 *
 * Una sola pantalla, en el orden en que piensa quien reserva: qué le pasa al
 * vehículo, cuándo lo trae y a quién avisarle. El resumen se llena mientras
 * elige, y el botón dice qué falta en vez de quedarse apagado sin explicación.
 *
 * Todo va controlado, y los grupos de opciones son botones con un input oculto
 * en vez de radios: React resetea el formulario antes de cada acción, y un
 * error devolvería la pantalla vacía (ver CLAUDE.md, «Los formularios con acción
 * se resetean solos»). En un celular eso es volver a escribirlo todo con el
 * pulgar.
 */
export function FormularioReserva({
  dias,
  grupos,
  whatsapp,
  direccion,
  mapaHref,
}: {
  dias: DiaParaElegir[];
  grupos: GrupoServicios[];
  whatsapp: string;
  direccion: string;
  mapaHref: string | null;
}) {
  const [estado, accion, enviando] = useActionState(crearReserva, ENVIO_INICIAL);

  // «No sé qué tiene» viene marcado: es la opción que más se usa y va primero
  // (decisión 15).
  const [modo, setModo] = useState<"diagnostico" | "servicio">("diagnostico");
  const [servicioId, setServicioId] = useState("");
  const [detalle, setDetalle] = useState("");

  const [fecha, setFecha] = useState(
    () => dias.find((dia) => dia.horas.some((hora) => hora.libres > 0))?.fecha ?? "",
  );
  const [hora, setHora] = useState("");

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [tipo, setTipo] = useState<TipoVehiculo | "">("");
  const [vehiculo, setVehiculo] = useState("");
  const [placa, setPlaca] = useState("");

  const diaElegido = dias.find((dia) => dia.fecha === fecha) ?? null;
  const horaElegida = diaElegido?.horas.find((opcion) => opcion.hora === hora) ?? null;

  const servicioElegido =
    modo === "diagnostico"
      ? MOTIVO_DIAGNOSTICO
      : (grupos.flatMap((grupo) => grupo.servicios).find((servicio) => servicio.id === servicioId)
          ?.nombre ?? null);

  const faltan = [
    modo === "servicio" && !servicioId ? "el servicio" : null,
    horaElegida ? null : diaElegido ? "la hora" : "el día y la hora",
    tipo ? null : "el tipo de vehículo",
    nombre.trim().length < 2 ? "tu nombre" : null,
    telefono.replace(/\D/g, "").length < 9 ? "tu celular" : null,
  ].filter((pieza): pieza is string => pieza !== null);

  function elegirDia(dia: DiaParaElegir) {
    setFecha(dia.fecha);
    // La hora se conserva si ese otro día también la tiene libre: quien quería
    // «a las 10» casi siempre sigue queriendo a las 10.
    if (!dia.horas.some((opcion) => opcion.hora === hora && opcion.libres > 0)) setHora("");
  }

  if (estado.reservada && diaElegido && horaElegida && servicioElegido) {
    return (
      <Confirmacion
        servicio={servicioElegido}
        dia={diaElegido.largo}
        hora={horaElegida.etiqueta}
        nombre={nombre.trim()}
        telefono={telefono}
        whatsapp={whatsapp}
      />
    );
  }

  return (
    <form action={accion} className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-12">
      <input type="hidden" name="modo" value={modo} />
      <input type="hidden" name="servicio_id" value={modo === "servicio" ? servicioId : ""} />
      <input type="hidden" name="fecha" value={fecha} />
      <input type="hidden" name="hora" value={hora} />
      <input type="hidden" name="tipo_vehiculo" value={tipo} />

      <div className="flex min-w-0 flex-col gap-12">
        <Paso titulo="Qué necesitas">
          <div className="grid gap-3 sm:grid-cols-2">
            <Opcion
              activa={modo === "diagnostico"}
              onElegir={() => setModo("diagnostico")}
              icono={<Stethoscope size={28} weight="duotone" />}
              titulo="No sé qué tiene"
              texto="Suena raro, falla o se prendió una luz. Lo revisamos primero."
            />

            {grupos.length > 0 ? (
              <Opcion
                activa={modo === "servicio"}
                onElegir={() => setModo("servicio")}
                icono={<Wrench size={28} weight="duotone" />}
                titulo="Ya sé qué necesito"
                texto="Elige el servicio de la lista."
              />
            ) : null}
          </div>

          {modo === "servicio" ? (
            <div className="al-montar">
              <Campo etiqueta="Servicio" htmlFor="servicio">
                <select
                  id="servicio"
                  value={servicioId}
                  onChange={(evento) => setServicioId(evento.target.value)}
                  className={CLASES_CAMPO}
                >
                  <option value="" disabled>
                    Elige un servicio
                  </option>
                  {grupos.map((grupo) => (
                    <optgroup key={grupo.categoria} label={grupo.categoria}>
                      {grupo.servicios.map((servicio) => (
                        <option key={servicio.id} value={servicio.id}>
                          {servicio.nombre}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </Campo>
            </div>
          ) : null}

          <Campo
            etiqueta="Cuéntanos qué pasa"
            htmlFor="detalle"
            opcional
            ayuda="Un ruido, una luz, desde cuándo. Nos ayuda a tener todo listo."
          >
            <textarea
              id="detalle"
              name="detalle"
              rows={3}
              maxLength={500}
              value={detalle}
              onChange={(evento) => setDetalle(evento.target.value)}
              className={CLASES_CAMPO}
            />
          </Campo>
        </Paso>

        <Paso titulo="Cuándo lo traes">
          <div
            role="group"
            aria-label="Día"
            className="-mx-5 flex snap-x gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0"
          >
            {dias.map((dia) => {
              const lleno = dia.horas.every((opcion) => opcion.libres === 0);
              const activo = dia.fecha === fecha;

              return (
                <button
                  key={dia.fecha}
                  type="button"
                  disabled={lleno}
                  aria-pressed={activo}
                  aria-label={lleno ? `${dia.largo}, sin horarios libres` : dia.largo}
                  onClick={() => elegirDia(dia)}
                  className={`flex w-18 shrink-0 snap-start flex-col items-center gap-1 rounded-lg border px-2 py-2.5 disabled:opacity-40 ${PULSABLE} ${
                    activo ? ELEGIDO : SIN_ELEGIR
                  }`}
                >
                  <span className="text-xs font-semibold uppercase">{dia.relativo ?? dia.semana}</span>
                  <span className="font-display text-2xl leading-none font-bold tabular-nums">
                    {dia.dia}
                  </span>
                  <span className={`text-xs ${activo ? "text-sobre-marca/80" : "text-tinta-suave"}`}>
                    {lleno ? "Lleno" : dia.mes}
                  </span>
                </button>
              );
            })}
          </div>

          {diaElegido ? (
            <div key={diaElegido.fecha} className="al-montar flex flex-col gap-3">
              <p className="text-sm text-tinta-suave">
                Horas del <span className="font-medium text-tinta">{diaElegido.largo}</span>
              </p>

              <div role="group" aria-label="Hora" className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {diaElegido.horas.map((opcion) => {
                  const llena = opcion.libres === 0;
                  const activa = opcion.hora === hora;

                  return (
                    <button
                      key={opcion.hora}
                      type="button"
                      disabled={llena}
                      aria-pressed={activa}
                      aria-label={llena ? `${opcion.etiqueta}, lleno` : opcion.etiqueta}
                      onClick={() => setHora(opcion.hora)}
                      className={`border px-3 py-2.5 text-sm font-medium tabular-nums disabled:line-through disabled:opacity-45 ${PULSABLE} ${
                        activa ? ELEGIDO : SIN_ELEGIR
                      }`}
                    >
                      {opcion.etiqueta}
                    </button>
                  );
                })}
              </div>

              {horaElegida?.libres === 1 ? (
                <p className="text-sm text-tinta-suave">A esa hora queda un solo cupo.</p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-tinta-suave">Elige un día para ver las horas.</p>
          )}
        </Paso>

        <Paso titulo="Tus datos">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Nombre" htmlFor="nombre">
              <input
                id="nombre"
                name="nombre"
                autoComplete="name"
                maxLength={80}
                value={nombre}
                onChange={(evento) => setNombre(evento.target.value)}
                className={CLASES_CAMPO}
              />
            </Campo>

            <Campo
              etiqueta="Celular"
              htmlFor="telefono"
              ayuda="Te confirmamos la reserva por WhatsApp a este número."
            >
              <input
                id="telefono"
                name="telefono"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                maxLength={15}
                value={telefono}
                onChange={(evento) => setTelefono(evento.target.value)}
                className={CLASES_CAMPO}
              />
            </Campo>
          </div>

          <div className="flex flex-col gap-2">
            <span id="tipo-vehiculo" className="text-sm font-medium">
              Tipo de vehículo
            </span>
            <div role="group" aria-labelledby="tipo-vehiculo" className="flex flex-wrap gap-2">
              {TIPOS_VEHICULO.map((opcion) => (
                <button
                  key={opcion}
                  type="button"
                  aria-pressed={tipo === opcion}
                  onClick={() => setTipo(opcion)}
                  className={`inline-flex items-center gap-2 border px-4 py-2.5 text-sm font-medium ${PULSABLE} ${
                    tipo === opcion ? ELEGIDO : SIN_ELEGIR
                  }`}
                >
                  {opcion === "SEDAN" ? (
                    <Car size={18} weight="duotone" />
                  ) : (
                    <Truck size={18} weight="duotone" />
                  )}
                  {ETIQUETA_TIPO_VEHICULO[opcion]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_11rem]">
            <Campo etiqueta="Marca y modelo" htmlFor="vehiculo" opcional>
              <input
                id="vehiculo"
                name="vehiculo"
                maxLength={80}
                placeholder="Toyota Hilux 2018"
                value={vehiculo}
                onChange={(evento) => setVehiculo(evento.target.value)}
                className={CLASES_CAMPO}
              />
            </Campo>

            <Campo etiqueta="Placa" htmlFor="placa" opcional>
              <input
                id="placa"
                name="placa"
                maxLength={10}
                autoCapitalize="characters"
                autoComplete="off"
                value={placa}
                onChange={(evento) => setPlaca(evento.target.value.toUpperCase())}
                className={`${CLASES_CAMPO} font-mono`}
              />
            </Campo>
          </div>
        </Paso>
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-28 lg:self-start">
        <div className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-estructura p-6 text-white">
          <h2 className="font-display text-xl font-bold uppercase tracking-tight">Tu reserva</h2>

          <dl className="flex flex-col gap-3.5">
            <Resumen etiqueta="Servicio" valor={servicioElegido} />
            <Resumen etiqueta="Día" valor={diaElegido ? conMayuscula(diaElegido.largo) : null} />
            <Resumen etiqueta="Hora" valor={horaElegida?.etiqueta ?? null} />
          </dl>

          {estado.error ? (
            <p
              role="alert"
              className="rounded-lg border border-vino-400/40 bg-vino-900/60 px-3 py-2 text-sm text-vino-100"
            >
              {estado.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={faltan.length > 0 || enviando}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-marca px-5 py-3 font-display text-base font-semibold uppercase tracking-wide text-sobre-marca transition duration-200 ease-salida hover:bg-marca-viva active:translate-y-px disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/55 disabled:active:translate-y-0"
          >
            <CalendarCheck size={20} weight="fill" />
            {enviando ? "Reservando…" : "Reservar hora"}
          </button>

          <p aria-live="polite" className="text-sm leading-relaxed text-white/70">
            {faltan.length > 0
              ? `Falta completar ${enumerar(faltan)}.`
              : "El taller revisa la reserva y te confirma por WhatsApp."}
          </p>
        </div>

        {direccion && mapaHref ? (
          <a
            href={mapaHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 px-1 text-sm text-tinta-suave transition-colors duration-200 hover:text-marca"
          >
            <MapPin size={20} weight="duotone" className="shrink-0 text-marca" />
            <span>{direccion}</span>
          </a>
        ) : null}
      </aside>
    </form>
  );
}

function Paso({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-5">
      <h2 className="font-display text-2xl font-bold uppercase tracking-tight">{titulo}</h2>
      {children}
    </section>
  );
}

function Campo({
  etiqueta,
  htmlFor,
  opcional,
  ayuda,
  children,
}: {
  etiqueta: string;
  htmlFor: string;
  opcional?: boolean;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {etiqueta}
        {opcional ? <span className="ml-1.5 font-normal text-tinta-suave">(opcional)</span> : null}
      </label>
      {children}
      {ayuda ? <p className="text-sm text-tinta-suave">{ayuda}</p> : null}
    </div>
  );
}

/**
 * Las dos puertas de entrada. Son tarjetas y no píldoras porque llevan una
 * explicación; elegidas no se rellenan de granate como el resto de los
 * controles, porque con dos líneas de texto encima quedaría un bloque pesado.
 */
function Opcion({
  activa,
  onElegir,
  icono,
  titulo,
  texto,
}: {
  activa: boolean;
  onElegir: () => void;
  icono: React.ReactNode;
  titulo: string;
  texto: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={activa}
      onClick={onElegir}
      className={`flex items-start gap-3.5 rounded-lg border p-4 text-left ${PULSABLE} ${
        activa
          ? "border-marca bg-vino-50 ring-1 ring-marca dark:bg-vino-900/30"
          : "border-borde bg-fondo-alto hover:border-borde-fuerte"
      }`}
    >
      <span
        className={`mt-0.5 shrink-0 transition-colors duration-200 ${
          activa ? "text-marca" : "text-tinta-tenue"
        }`}
      >
        {icono}
      </span>
      <span className="flex flex-col gap-1">
        <span className="font-display text-lg leading-tight font-semibold uppercase tracking-tight">
          {titulo}
        </span>
        <span className="text-sm leading-relaxed text-tinta-suave">{texto}</span>
      </span>
    </button>
  );
}

function Resumen({ etiqueta, valor }: { etiqueta: string; valor: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium text-white/60">{etiqueta}</dt>
      <dd className={valor ? "text-white" : "text-white/50"}>{valor ?? "Sin elegir"}</dd>
    </div>
  );
}

function Confirmacion({
  servicio,
  dia,
  hora,
  nombre,
  telefono,
  whatsapp,
}: {
  servicio: string;
  dia: string;
  hora: string;
  nombre: string;
  telefono: string;
  whatsapp: string;
}) {
  const titulo = useRef<HTMLHeadingElement>(null);

  // El formulario desaparece al confirmar y el foco se quedaría en la nada: se
  // lleva al título para que un lector de pantalla anuncie lo que pasó.
  useEffect(() => {
    titulo.current?.focus();
  }, []);

  const aviso = whatsapp
    ? enlaceWhatsApp(whatsapp, `Hola, acabo de reservar para el ${dia} a las ${hora}, a nombre de ${nombre}.`)
    : null;

  return (
    <div className="al-montar flex max-w-2xl flex-col gap-7 rounded-2xl border border-borde bg-fondo-alto p-6 md:p-10">
      <CheckCircle size={48} weight="duotone" className="text-marca" />

      <div className="flex flex-col gap-2">
        <h2
          ref={titulo}
          tabIndex={-1}
          className="font-display text-3xl font-bold uppercase tracking-tight outline-none md:text-4xl"
        >
          Reserva registrada
        </h2>
        <p className="text-lg text-tinta-suave">
          El taller la revisa y te escribe al {formatearCelular(telefono)} para confirmarla.
        </p>
      </div>

      <dl className="grid gap-4 border-y border-borde py-5 sm:grid-cols-3">
        <Dato etiqueta="Servicio" valor={servicio} />
        <Dato etiqueta="Día" valor={conMayuscula(dia)} />
        <Dato etiqueta="Hora" valor={hora} />
      </dl>

      <div className="flex flex-wrap gap-3">
        {aviso ? (
          <Boton href={aviso} externo>
            <WhatsappLogo size={20} weight="fill" />
            Escribir por WhatsApp
          </Boton>
        ) : null}
        <Boton href="/" tono="linea">
          Volver al inicio
        </Boton>
      </div>
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-sm text-tinta-suave">{etiqueta}</dt>
      <dd className="font-medium">{valor}</dd>
    </div>
  );
}

/** ["la hora", "tu nombre", "tu celular"] → "la hora, tu nombre y tu celular". */
function enumerar(partes: string[]): string {
  if (partes.length <= 1) return partes.join("");
  return `${partes.slice(0, -1).join(", ")} y ${partes[partes.length - 1]}`;
}

function conMayuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
