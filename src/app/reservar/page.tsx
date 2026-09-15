import { CalendarX, Warning, WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { io } from "next/cache";
import { Suspense } from "react";

import {
  diaRelativo,
  fechaISOLima,
  formatearDia,
  formatearHoraFranja,
  piezasDelDia,
} from "@/lib/fecha";
import { CATEGORIAS, ETIQUETA_CATEGORIA } from "@/lib/orden/presupuesto";
import { cargarDisponibilidad } from "@/lib/reserva/consultas";
import { SALUDO_WHATSAPP, cargarSitio, enlaceComoLlegar } from "@/lib/sitio/contenido";
import { enlaceWhatsApp } from "@/lib/whatsapp";

import { Navegacion } from "../_landing/navegacion";
import { Pie } from "../_landing/pie";
import { Boton } from "../_landing/piezas";

import { FormularioReserva, type DiaParaElegir, type GrupoServicios } from "./formulario";

export const metadata: Metadata = {
  title: "Reservar hora",
  description:
    "Elige el día y la hora para traer tu vehículo al taller. Te confirmamos por WhatsApp.",
};

/**
 * Reserva pública.
 *
 * Dos velocidades en la misma página. La cabecera, el título y el pie salen del
 * contenido publicado y se cachean como el landing (decisión 25). Los días, las
 * horas y los servicios se leen en cada visita detrás de un `<Suspense>`:
 * cambian con cada reserva y no pueden esperar a que alguien publique.
 */
export default async function PaginaReservar() {
  const { taller } = await cargarSitio();

  const whatsappHref = taller.whatsapp ? enlaceWhatsApp(taller.whatsapp, SALUDO_WHATSAPP) : null;

  return (
    <>
      <Navegacion
        logo={taller.logoUrl}
        nombre={taller.nombre}
        whatsapp={whatsappHref}
        reservar={null}
        enlacesEn="/"
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pt-10 pb-16 md:px-8 md:pt-14 md:pb-24">
        <div className="mb-10 flex max-w-2xl flex-col gap-3">
          <h1 className="font-display text-4xl leading-[1.05] font-bold uppercase tracking-tight md:text-5xl">
            Reservar hora
          </h1>
          <p className="text-lg text-tinta-suave">
            Eliges el día y la hora, y el taller te confirma por WhatsApp.
          </p>
        </div>

        <Suspense fallback={<Esqueleto />}>
          <Reserva
            whatsapp={taller.whatsapp}
            whatsappHref={whatsappHref}
            direccion={taller.direccion}
            mapaHref={enlaceComoLlegar(taller.direccion)}
          />
        </Suspense>
      </main>

      <Pie taller={taller} />
    </>
  );
}

async function Reserva({
  whatsapp,
  whatsappHref,
  direccion,
  mapaHref,
}: {
  whatsapp: string;
  whatsappHref: string | null;
  direccion: string;
  mapaHref: string | null;
}) {
  // Desde acá, todo es por visita.
  await io();

  const disponibilidad = await cargarDisponibilidad();

  if (disponibilidad.tipo === "error") {
    return (
      <SinReservas
        error
        titulo="No pudimos cargar los horarios"
        texto="Intenta de nuevo en un momento, o escríbenos por WhatsApp y coordinamos el día."
        whatsappHref={whatsappHref}
      />
    );
  }

  if (disponibilidad.tipo === "apagadas") {
    return (
      <SinReservas
        titulo="Las reservas en línea están pausadas"
        texto="Escríbenos por WhatsApp y coordinamos el día."
        whatsappHref={whatsappHref}
      />
    );
  }

  const conCupo = disponibilidad.dias.some((dia) => dia.horas.some((hora) => hora.libres > 0));

  if (!conCupo) {
    return (
      <SinReservas
        titulo="No quedan horarios libres"
        texto="Los próximos días están completos. Escríbenos por WhatsApp y vemos cómo atenderte."
        whatsappHref={whatsappHref}
      />
    );
  }

  const hoy = fechaISOLima(new Date());

  // Todo el texto de fechas se arma acá, en el servidor. El navegador podría
  // escribir los meses de otra forma y romper la hidratación (ver fecha.ts).
  const dias: DiaParaElegir[] = disponibilidad.dias.map((dia) => ({
    fecha: dia.fecha,
    ...piezasDelDia(dia.fecha),
    relativo: diaRelativo(dia.fecha, hoy),
    largo: formatearDia(dia.fecha),
    horas: dia.horas.map((hora) => ({ ...hora, etiqueta: formatearHoraFranja(hora.hora) })),
  }));

  const grupos: GrupoServicios[] = CATEGORIAS.map((categoria) => ({
    categoria: ETIQUETA_CATEGORIA[categoria],
    servicios: disponibilidad.servicios
      .filter((servicio) => servicio.categoria === categoria)
      .map(({ id, nombre }) => ({ id, nombre })),
  })).filter((grupo) => grupo.servicios.length > 0);

  return (
    <FormularioReserva
      dias={dias}
      grupos={grupos}
      whatsapp={whatsapp}
      direccion={direccion}
      mapaHref={mapaHref}
    />
  );
}

function SinReservas({
  titulo,
  texto,
  whatsappHref,
  error,
}: {
  titulo: string;
  texto: string;
  whatsappHref: string | null;
  error?: boolean;
}) {
  return (
    <div className="al-montar flex max-w-2xl flex-col items-start gap-6 rounded-2xl border border-borde bg-fondo-alto p-6 md:p-10">
      {error ? (
        <Warning size={40} weight="duotone" className="text-marca" />
      ) : (
        <CalendarX size={40} weight="duotone" className="text-marca" />
      )}

      <div className="flex flex-col gap-2">
        <h2 className="font-display text-2xl font-bold uppercase tracking-tight md:text-3xl">
          {titulo}
        </h2>
        <p className="text-lg text-tinta-suave">{texto}</p>
      </div>

      {whatsappHref ? (
        <Boton href={whatsappHref} externo>
          <WhatsappLogo size={20} weight="fill" />
          Escribir por WhatsApp
        </Boton>
      ) : null}
    </div>
  );
}

/** Tiene la forma del formulario para que, al llegar los horarios, nada salte de lugar. */
function Esqueleto() {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-12">
      <p role="status" className="sr-only">
        Cargando horarios…
      </p>

      <div aria-hidden className="flex flex-col gap-12">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="h-24 rounded-lg bg-fondo-hondo motion-safe:animate-pulse" />
          <div className="h-24 rounded-lg bg-fondo-hondo motion-safe:animate-pulse" />
        </div>

        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 7 }, (_, indice) => (
            <div
              key={indice}
              className="h-20 w-18 shrink-0 rounded-lg bg-fondo-hondo motion-safe:animate-pulse"
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {Array.from({ length: 8 }, (_, indice) => (
            <div key={indice} className="h-11 rounded-full bg-fondo-hondo motion-safe:animate-pulse" />
          ))}
        </div>
      </div>

      <div aria-hidden className="h-80 rounded-2xl bg-fondo-hondo motion-safe:animate-pulse" />
    </div>
  );
}
