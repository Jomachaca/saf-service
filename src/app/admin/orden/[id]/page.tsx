import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { formatearFechaHora, tiempoTranscurrido } from "@/lib/fecha";
import {
  cargarBoxes,
  cargarCatalogo,
  cargarConfig,
  cargarDiagnostico,
  cargarEventos,
  cargarOrden,
  cargarPresupuestos,
  cargarTablero,
} from "@/lib/orden/consultas";
import { etiquetaEvento } from "@/lib/orden/eventos";
import { requerirStaff } from "@/lib/sesion";
import { aplicarPlantilla, enlacePublico, enlaceWhatsApp } from "@/lib/whatsapp";

import {
  Dato,
  Ficha,
  FichaLateral,
  Insignia,
  Rotulo,
  Ubicada,
} from "../../componentes";
import { CambiarEstado, MoverVehiculo } from "./acciones-orden";
import { FormularioDiagnostico } from "./diagnostico";
import { EditorPresupuesto, PresupuestoEmitido } from "./presupuesto";
import { BotonWhatsApp } from "./whatsapp";

export const metadata = {
  title: "Orden",
};

type Parametros = PageProps<"/admin/orden/[id]">["params"];

/**
 * `params` no se resuelve acá sino dentro del boundary: esperarlo en el cuerpo
 * de la página impide prerenderizar el armazón (decisión 22).
 */
export default function PaginaOrden({ params }: PageProps<"/admin/orden/[id]">) {
  return (
    <Suspense fallback={<p className="text-sm text-tinta-tenue">Cargando orden…</p>}>
      <Contenido params={params} />
    </Suspense>
  );
}

async function Contenido({ params }: { params: Parametros }) {
  await requerirStaff();

  const { id } = await params;
  const orden = await cargarOrden(id);
  if (!orden) notFound();

  const [eventos, boxes, { ocupacion }, diagnostico, presupuestos, catalogo, config] =
    await Promise.all([
      cargarEventos(id),
      cargarBoxes(),
      cargarTablero(),
      cargarDiagnostico(id),
      cargarPresupuestos(id),
      cargarCatalogo(),
      cargarConfig(),
    ]);

  const nombresDeBox = Object.fromEntries(boxes.map((box) => [box.id, box.nombre]));
  const boxesOcupados = [...ocupacion.keys()];
  const ahora = new Date();

  const borrador = presupuestos.find((p) => p.estado === "BORRADOR") ?? null;
  const emitidos = presupuestos.filter((p) => p.estado !== "BORRADOR");
  const vigente = emitidos[0] ?? null;

  const urlCliente = enlacePublico(orden.token_publico);
  const mensaje = aplicarPlantilla(
    config.plantillas.presupuesto ??
      "Hola {cliente}, ya revisamos tu {marca} {modelo} {placa}. El diagnóstico y presupuesto están acá: {url}",
    {
      cliente: orden.cliente?.nombre,
      marca: orden.vehiculo?.marca,
      modelo: orden.vehiculo?.modelo,
      placa: orden.vehiculo?.placa,
      url: urlCliente,
    },
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 border-b border-borde-fuerte pb-4">
        <Link
          href="/admin"
          className="subrayado w-fit font-display text-xs font-semibold tracking-[0.18em] text-tinta-tenue uppercase"
        >
          ← Tablero
        </Link>

        <div className="flex flex-wrap items-center gap-3.5">
          <h1 className="font-mono text-[2.375rem] leading-none font-medium">
            {orden.vehiculo?.placa}
          </h1>
          <Insignia estado={orden.estado} />
          <Ubicada
            ubicacion={orden.ubicacion}
            box={orden.box_id ? nombresDeBox[orden.box_id] : null}
          />
          <span className="ms-auto font-mono text-sm text-tinta-tenue">{orden.numero}</span>
        </div>

        <p className="text-base text-tinta-suave">
          {orden.vehiculo?.marca} {orden.vehiculo?.modelo}
          {orden.vehiculo?.anio ? ` · ${orden.vehiculo.anio}` : ""} ·{" "}
          {orden.vehiculo?.tipo === "GRANDE" ? "Grande" : "Sedán"}
        </p>
      </div>

      <div className="grid gap-8 @4xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <Rotulo>Estado</Rotulo>
            <CambiarEstado ordenId={orden.id} estado={orden.estado} />
          </div>

          <Ficha titulo="Diagnóstico">
            <FormularioDiagnostico ordenId={orden.id} diagnostico={diagnostico} />
          </Ficha>

          <Ficha titulo="Presupuesto">
            <div className="flex flex-col gap-5">
              {emitidos.map((presupuesto) => (
                <PresupuestoEmitido key={presupuesto.id} presupuesto={presupuesto} />
              ))}

              {vigente?.estado === "ENVIADO" ? (
                <BotonWhatsApp
                  ordenId={orden.id}
                  enlace={
                    orden.cliente?.telefono
                      ? enlaceWhatsApp(orden.cliente.telefono, mensaje)
                      : null
                  }
                  enlacePublico={urlCliente}
                />
              ) : null}

              {vigente?.estado === "ENVIADO" ? null : (
                <EditorPresupuesto
                  ordenId={orden.id}
                  catalogo={catalogo}
                  config={config}
                  borrador={borrador}
                />
              )}
            </div>
          </Ficha>

          {/* La bitácora se dibuja como una línea de tiempo: un filete vertical
              y un punto por hecho. Es lo que ya era —una lista en orden—, pero
              se lee como lo que cuenta, que es una secuencia. */}
          <div className="flex flex-col gap-2.5">
            <Rotulo>Bitácora</Rotulo>
            <ol className="flex flex-col border-l border-borde-fuerte">
              {eventos.map((evento) => (
                <li
                  key={evento.id}
                  className="relative flex flex-wrap items-baseline gap-x-2.5 gap-y-1 py-2.5 ps-5"
                >
                  <span
                    aria-hidden
                    className="absolute top-[1.05rem] -left-[3px] size-[5px] bg-marca"
                  />
                  <span className="font-display text-[15px] font-semibold tracking-[0.06em] uppercase">
                    {etiquetaEvento(evento.tipo)}
                  </span>
                  <Detalle payload={evento.payload} />
                  {evento.actor_descripcion ? (
                    <span className="text-xs text-tinta-tenue">{evento.actor_descripcion}</span>
                  ) : null}
                  <span className="ms-auto font-mono text-xs text-tinta-tenue tabular-nums">
                    {formatearFechaHora(evento.creado_en)}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <aside className="flex flex-col gap-5">
          <FichaLateral titulo="Cliente">
            <dl className="m-0 flex flex-col gap-2">
              <Dato etiqueta="Nombre">{orden.cliente?.nombre}</Dato>
              {orden.cliente?.telefono ? (
                <Dato etiqueta="Teléfono">
                  <span className="tabular-nums">{orden.cliente.telefono}</span>
                </Dato>
              ) : null}
              {orden.cliente?.email ? (
                <Dato etiqueta="Correo">
                  <span className="break-all">{orden.cliente.email}</span>
                </Dato>
              ) : null}
            </dl>
          </FichaLateral>

          <FichaLateral titulo="Ubicación">
            <MoverVehiculo
              ordenId={orden.id}
              ubicacion={orden.ubicacion}
              boxId={orden.box_id}
              boxes={boxes}
              boxesOcupados={boxesOcupados}
            />
          </FichaLateral>

          <FichaLateral titulo="Ingreso">
            <dl className="m-0 flex flex-col gap-2">
              <Dato etiqueta="Motivo">{orden.motivo_ingreso}</Dato>
              <Dato etiqueta="Kilometraje">
                {orden.kilometraje === null
                  ? "No registrado"
                  : `${orden.kilometraje.toLocaleString("es-PE")} km`}
              </Dato>
              <Dato etiqueta="Recibido">
                {formatearFechaHora(orden.recibido_en)}
                <span className="text-tinta-tenue">
                  {" "}
                  · hace {tiempoTranscurrido(orden.recibido_en, ahora)}
                </span>
              </Dato>
              {orden.cerrado_en ? (
                <Dato etiqueta="Cerrado">{formatearFechaHora(orden.cerrado_en)}</Dato>
              ) : null}
            </dl>
          </FichaLateral>
        </aside>
      </div>
    </div>
  );
}

/**
 * Resumen legible del payload del evento. Solo se muestran las claves que
 * aportan algo al leer la bitácora de corrido.
 */
function Detalle({ payload }: { payload: unknown }) {
  if (typeof payload !== "object" || payload === null) return null;

  const datos = payload as Record<string, unknown>;
  const partes: string[] = [];

  if (typeof datos.desde === "string" && typeof datos.hacia === "string") {
    partes.push(`${datos.desde} → ${datos.hacia}`);
  }
  if (typeof datos.ubicacion === "string") partes.push(String(datos.ubicacion));
  if (typeof datos.motivo === "string") partes.push(String(datos.motivo));
  if (datos.reserva_id) partes.push("vino con reserva");
  if (typeof datos.mecanico === "string" && datos.mecanico) partes.push(String(datos.mecanico));
  if (typeof datos.nombre === "string" && datos.nombre) partes.push(String(datos.nombre));
  if (typeof datos.nota === "string" && datos.nota) partes.push(`"${datos.nota}"`);

  if (partes.length === 0) return null;

  return <span className="text-sm text-tinta-suave">{partes.join(" · ")}</span>;
}
