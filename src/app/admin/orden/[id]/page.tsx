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

import { Insignia, Seccion, Ubicada } from "../../componentes";
import { CambiarEstado, MoverVehiculo } from "./acciones-orden";
import { FormularioDiagnostico } from "./diagnostico";
import { EditorPresupuesto, PresupuestoEmitido } from "./presupuesto";
import { BotonWhatsApp } from "./whatsapp";

export const metadata = {
  title: "Orden · SAF Service",
};

type Parametros = PageProps<"/admin/orden/[id]">["params"];

/**
 * `params` no se resuelve acá sino dentro del boundary: esperarlo en el cuerpo
 * de la página impide prerenderizar el armazón (decisión 22).
 */
export default function PaginaOrden({ params }: PageProps<"/admin/orden/[id]">) {
  return (
    <Suspense fallback={<p className="text-sm opacity-40">Cargando orden…</p>}>
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
      <div className="flex flex-col gap-2">
        <Link href="/admin" className="text-sm opacity-60 underline-offset-4 hover:underline">
          ← Tablero
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-xl font-semibold">{orden.vehiculo?.placa}</h1>
          <Insignia estado={orden.estado} />
          <Ubicada
            ubicacion={orden.ubicacion}
            box={orden.box_id ? nombresDeBox[orden.box_id] : null}
          />
          <span className="ml-auto font-mono text-sm opacity-50">{orden.numero}</span>
        </div>

        <p className="text-sm opacity-70">
          {orden.vehiculo?.marca} {orden.vehiculo?.modelo}
          {orden.vehiculo?.anio ? ` · ${orden.vehiculo.anio}` : ""} ·{" "}
          {orden.vehiculo?.tipo === "GRANDE" ? "Grande" : "Sedán"}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-8">
          <Seccion titulo="Estado">
            <CambiarEstado ordenId={orden.id} estado={orden.estado} />
          </Seccion>

          <Seccion titulo="Diagnóstico">
            <FormularioDiagnostico ordenId={orden.id} diagnostico={diagnostico} />
          </Seccion>

          <Seccion titulo="Presupuesto">
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
          </Seccion>

          <Seccion titulo="Bitácora">
            <ol className="flex flex-col divide-y divide-black/10 dark:divide-white/10">
              {eventos.map((evento) => (
                <li key={evento.id} className="flex flex-wrap items-baseline gap-x-3 py-2">
                  <span className="text-sm font-medium">{etiquetaEvento(evento.tipo)}</span>
                  <Detalle payload={evento.payload} />
                  {evento.actor_descripcion ? (
                    <span className="text-xs opacity-50">{evento.actor_descripcion}</span>
                  ) : null}
                  <span className="ml-auto text-xs tabular-nums opacity-50">
                    {formatearFechaHora(evento.creado_en)}
                  </span>
                </li>
              ))}
            </ol>
          </Seccion>
        </div>

        <aside className="flex flex-col gap-8">
          <Seccion titulo="Cliente">
            <dl className="flex flex-col gap-1 text-sm">
              <dd className="font-medium">{orden.cliente?.nombre}</dd>
              <dd className="opacity-70">{orden.cliente?.telefono}</dd>
              {orden.cliente?.email ? (
                <dd className="opacity-70">{orden.cliente.email}</dd>
              ) : null}
            </dl>
          </Seccion>

          <Seccion titulo="Ubicación">
            <MoverVehiculo
              ordenId={orden.id}
              ubicacion={orden.ubicacion}
              boxId={orden.box_id}
              boxes={boxes}
              boxesOcupados={boxesOcupados}
            />
          </Seccion>

          <Seccion titulo="Ingreso">
            <dl className="flex flex-col gap-2 text-sm">
              <div>
                <dt className="text-xs opacity-50">Motivo</dt>
                <dd>{orden.motivo_ingreso}</dd>
              </div>
              <div>
                <dt className="text-xs opacity-50">Kilometraje</dt>
                <dd>
                  {orden.kilometraje === null
                    ? "No registrado"
                    : `${orden.kilometraje.toLocaleString("es-PE")} km`}
                </dd>
              </div>
              <div>
                <dt className="text-xs opacity-50">Recibido</dt>
                <dd>
                  {formatearFechaHora(orden.recibido_en)}
                  <span className="opacity-50">
                    {" "}
                    · hace {tiempoTranscurrido(orden.recibido_en, ahora)}
                  </span>
                </dd>
              </div>
              {orden.cerrado_en ? (
                <div>
                  <dt className="text-xs opacity-50">Cerrado</dt>
                  <dd>{formatearFechaHora(orden.cerrado_en)}</dd>
                </div>
              ) : null}
            </dl>
          </Seccion>
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
  if (typeof datos.mecanico === "string" && datos.mecanico) partes.push(String(datos.mecanico));
  if (typeof datos.nombre === "string" && datos.nombre) partes.push(String(datos.nombre));
  if (typeof datos.nota === "string" && datos.nota) partes.push(`"${datos.nota}"`);

  if (partes.length === 0) return null;

  return <span className="text-sm opacity-60">{partes.join(" · ")}</span>;
}
