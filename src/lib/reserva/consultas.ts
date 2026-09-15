import "server-only";

import { supabaseConfigurado } from "@/lib/supabase/env";
import { crearClientePublico } from "@/lib/supabase/publico";
import { crearClienteServidor } from "@/lib/supabase/server";

import type { EstadoReserva } from "./estados";
import {
  agruparDisponibilidad,
  PLANTILLA_RESERVA,
  type DiaDisponible,
  type Franja,
  type ReservaAgenda,
  type TipoVehiculo,
} from "./modelo";

// ---------------------------------------------------------------------------
// Sitio público
// ---------------------------------------------------------------------------

export type ServicioParaReservar = { id: string; nombre: string; categoria: string };

export type Disponibilidad =
  | { tipo: "abiertas"; dias: DiaDisponible[]; servicios: ServicioParaReservar[] }
  | { tipo: "apagadas" }
  | { tipo: "error" };

/**
 * Lo que necesita el formulario público, leído en cada visita.
 *
 * Sin caché, a propósito. El resto del sitio espera a que alguien publique
 * (decisión 25), pero los cupos cambian con cada reserva: un horario lleno que
 * se ve libre es justo el error que el formulario tiene que evitar. Por lo
 * mismo, el catálogo se lee acá en vivo y no del contenido publicado.
 *
 * Va con la clave pública y sin cookies, como el landing. El visitante no tiene
 * sesión, y lo que puede ver lo decide la base (decisión 26).
 */
export async function cargarDisponibilidad(): Promise<Disponibilidad> {
  if (!supabaseConfigurado()) return { tipo: "apagadas" };

  const supabase = crearClientePublico();

  const [config, cupos, servicios] = await Promise.all([
    supabase.from("config_sitio").select("reservas_activas").eq("id", 1).maybeSingle(),
    supabase.rpc("disponibilidad_reservas"),
    supabase
      .from("servicio_catalogo")
      .select("id, nombre, categoria")
      .eq("activo", true)
      .order("orden_visual"),
  ]);

  const error = config.error ?? cupos.error ?? servicios.error;
  if (error) {
    console.error("No se pudo leer la disponibilidad de reservas", error);
    return { tipo: "error" };
  }

  if (!config.data?.reservas_activas) return { tipo: "apagadas" };

  return {
    tipo: "abiertas",
    dias: agruparDisponibilidad(cupos.data ?? []),
    servicios: servicios.data ?? [],
  };
}

// ---------------------------------------------------------------------------
// Panel: todo con la sesión del staff
// ---------------------------------------------------------------------------

const CAMPOS_RESERVA = `
  id, nombre, telefono, placa, vehiculo, tipo_vehiculo, motivo, detalle,
  fecha, hora, estado, creado_en,
  orden:orden_servicio ( id, numero )
`;

export type Agenda = {
  /** De hoy en adelante y en todos los estados: hoy también muestra lo ya resuelto. */
  proximas: ReservaAgenda[];
  /** De días pasados que nadie cerró. Siguen contando como cupo ocupado. */
  sinCerrar: ReservaAgenda[];
  cerrados: { fecha: string; motivo: string }[];
  activas: boolean;
  hayHorario: boolean;
  plantilla: string;
  taller: { nombre: string; direccion: string };
  error: string | null;
};

export async function cargarAgenda(hoy: string): Promise<Agenda> {
  const supabase = await crearClienteServidor();

  const [proximas, sinCerrar, cerrados, franjas, config] = await Promise.all([
    supabase
      .from("reserva")
      .select(CAMPOS_RESERVA)
      .gte("fecha", hoy)
      .order("fecha")
      .order("hora")
      .order("creado_en")
      .overrideTypes<ReservaAgenda[]>(),
    supabase
      .from("reserva")
      .select(CAMPOS_RESERVA)
      .lt("fecha", hoy)
      .in("estado", ["PENDIENTE", "CONFIRMADA"])
      .order("fecha")
      .order("hora")
      .overrideTypes<ReservaAgenda[]>(),
    supabase.from("dia_cerrado").select("fecha, motivo").gte("fecha", hoy).order("fecha"),
    supabase.from("franja").select("dia_semana", { count: "exact", head: true }),
    supabase
      .from("config_sitio")
      .select("reservas_activas, plantillas_mensaje, nombre_taller, direccion")
      .eq("id", 1)
      .maybeSingle(),
  ]);

  const error = proximas.error ?? sinCerrar.error ?? cerrados.error ?? config.error;
  const plantillas = (config.data?.plantillas_mensaje ?? {}) as Record<string, string>;

  return {
    proximas: proximas.data ?? [],
    sinCerrar: sinCerrar.data ?? [],
    cerrados: cerrados.data ?? [],
    activas: config.data?.reservas_activas ?? false,
    hayHorario: (franjas.count ?? 0) > 0,
    plantilla: plantillas.reserva || PLANTILLA_RESERVA,
    taller: {
      nombre: config.data?.nombre_taller ?? "SAF Service",
      direccion: config.data?.direccion ?? "",
    },
    error: error?.message ?? null,
  };
}

export type ReservaParaRecepcion = {
  id: string;
  nombre: string;
  telefono: string;
  placa: string | null;
  vehiculo: string;
  tipo_vehiculo: TipoVehiculo;
  motivo: string;
  detalle: string;
  fecha: string;
  hora: string;
  estado: EstadoReserva;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function cargarReserva(id: string): Promise<ReservaParaRecepcion | null> {
  // Un id que no es uuid no llega a la base, que respondería con un error.
  if (!UUID.test(id)) return null;

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("reserva")
    .select(
      "id, nombre, telefono, placa, vehiculo, tipo_vehiculo, motivo, detalle, fecha, hora, estado",
    )
    .eq("id", id)
    .maybeSingle()
    .overrideTypes<ReservaParaRecepcion>();

  return data ?? null;
}

export type DiaCerradoPanel = { fecha: string; motivo: string; reservas: number };

export async function cargarHorario(
  hoy: string,
): Promise<{ franjas: Franja[]; cerrados: DiaCerradoPanel[] }> {
  const supabase = await crearClienteServidor();

  const [franjas, cerrados] = await Promise.all([
    supabase.from("franja").select("dia_semana, hora, cupos").order("hora").order("dia_semana"),
    supabase.from("dia_cerrado").select("fecha, motivo").gte("fecha", hoy).order("fecha"),
  ]);

  const dias = cerrados.data ?? [];

  // Cerrar un día no cancela lo que ya estaba reservado. Se cuenta para que la
  // pantalla avise, no para tocarlo.
  const afectadas =
    dias.length === 0
      ? []
      : ((
          await supabase
            .from("reserva")
            .select("fecha")
            .in(
              "fecha",
              dias.map((dia) => dia.fecha),
            )
            .in("estado", ["PENDIENTE", "CONFIRMADA"])
        ).data ?? []);

  return {
    franjas: franjas.data ?? [],
    cerrados: dias.map((dia) => ({
      ...dia,
      reservas: afectadas.filter((reserva) => reserva.fecha === dia.fecha).length,
    })),
  };
}
