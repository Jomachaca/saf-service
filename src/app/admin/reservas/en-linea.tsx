"use client";

import Link from "next/link";
import { useActionState } from "react";

import { PLANTILLA_RESERVA } from "@/lib/reserva/modelo";

import { Area, Bloque, Campo, Entrada, Interruptor, useCampos } from "../campos";
import { SIN_ERROR } from "../estado-formulario";
import { guardarReservas } from "./acciones";

/**
 * El interruptor, cuántos días hacia adelante y el mensaje para confirmar.
 *
 * Guardarlo tiene efecto en ese momento, sin publicar. El botón «Reservar hora»
 * de la portada, en cambio, espera a que se publique el sitio (decisión 29): por
 * eso la explicación lleva a «Sitio web».
 */
export function ReservasEnLinea({
  activas,
  dias,
  plantilla,
  hayHorario,
}: {
  activas: boolean;
  dias: number;
  plantilla: string;
  hayHorario: boolean;
}) {
  const inicial = {
    reservas_activas: activas,
    reservas_dias: String(dias),
    plantilla_reserva: plantilla || PLANTILLA_RESERVA,
  };

  const [estado, accion, guardando] = useActionState(guardarReservas, SIN_ERROR);
  const [campos, cambiar] = useCampos(inicial);

  const sucio = (Object.keys(inicial) as (keyof typeof inicial)[]).some(
    (clave) => campos[clave] !== inicial[clave],
  );

  return (
    <form action={accion}>
      <Bloque
        titulo="Reservas en línea"
        descripcion={
          <>
            Encenderlo abre el formulario de reservas en ese momento. El botón «Reservar hora»
            recién aparece en la portada cuando{" "}
            <Link
              href="/admin/sitio"
              className="font-medium text-marca underline underline-offset-4"
            >
              publicas el sitio web
            </Link>
            .
          </>
        }
        sucio={sucio}
        guardando={guardando}
        error={estado.error}
      >
        <Interruptor
          nombre="reservas_activas"
          activo={campos.reservas_activas}
          onCambiar={(v) => cambiar("reservas_activas", v)}
          etiqueta={
            campos.reservas_activas
              ? "Se aceptan reservas por la web"
              : "No se aceptan reservas por la web"
          }
        />

        {hayHorario ? null : (
          <p className="text-sm text-tinta-suave">
            Para encenderlas hace falta el horario: arma los cupos por hora más abajo.
          </p>
        )}

        <div className="max-w-xs">
          <Campo
            etiqueta="Días hacia adelante"
            ayuda="Hasta cuántos días desde hoy se puede reservar. Entre 1 y 60."
          >
            <Entrada
              nombre="reservas_dias"
              valor={campos.reservas_dias}
              onCambiar={(v) => cambiar("reservas_dias", v)}
              inputMode="numeric"
            />
          </Campo>
        </div>

        <Campo
          etiqueta="Mensaje para confirmar por WhatsApp"
          ayuda="La agenda lo abre con los datos de cada reserva. Marcadores: {cliente}, {fecha}, {hora}, {taller} y {direccion}."
        >
          <Area
            nombre="plantilla_reserva"
            filas={3}
            valor={campos.plantilla_reserva}
            onCambiar={(v) => cambiar("plantilla_reserva", v)}
          />
        </Campo>
      </Bloque>
    </form>
  );
}
