import { Suspense } from "react";

import { cargarSitio } from "@/lib/sitio/contenido";

import { Apartado, MarcoLegal } from "../_legal/marco";

export const metadata = {
  title: "Política de privacidad",
  description:
    "Qué datos personales recoge este sitio, para qué se usan, dónde se guardan y cómo pedir que se corrijan o se borren.",
};

/**
 * Política de privacidad, escrita para la Ley N.° 29733 de Protección de Datos
 * Personales del Perú.
 *
 * Dice lo que el sistema hace de verdad, no una plantilla: los datos que se
 * piden son los que están en `crear_reserva()` y en la recepción, y los lugares
 * donde se guardan son los que usa el proyecto. Si mañana se recoge un dato
 * más, este texto tiene que cambiar el mismo día.
 */
export default function PaginaPrivacidad() {
  return (
    <Suspense fallback={null}>
      <Contenido />
    </Suspense>
  );
}

async function Contenido() {
  const { taller } = await cargarSitio();

  return (
    <MarcoLegal
      titulo="Política de privacidad"
      entradilla="Qué datos pedimos, para qué los usamos y qué puedes pedirnos que hagamos con ellos."
    >
      <Apartado titulo="Quién trata tus datos">
        <p>
          El responsable es <strong className="text-tinta">{taller.nombre}</strong>
          {taller.direccion ? `, con taller en ${taller.direccion}` : ""}.
        </p>
        <p>
          Para cualquier cosa relacionada con tus datos puedes escribirnos
          {taller.email ? (
            <>
              {" "}
              a <a className="subrayado text-tinta" href={`mailto:${taller.email}`}>{taller.email}</a>
            </>
          ) : null}
          {taller.telefono ? <> o llamarnos al {taller.telefono}</> : null}.
        </p>
      </Apartado>

      <Apartado titulo="Qué datos recogemos, y cuándo">
        <p>
          <strong className="text-tinta">Si reservas una hora por la web:</strong> tu nombre y tu
          celular, que son obligatorios, y si quieres, la placa, la marca y el modelo del vehículo
          y una descripción de lo que le pasa.
        </p>
        <p>
          <strong className="text-tinta">Si dejas el vehículo en el taller:</strong> lo mismo, más
          el kilometraje y el motivo del ingreso, que anotamos al recibirlo. Esto lo escribe el
          taller, no tú.
        </p>
        <p>
          No pedimos tu documento de identidad, ni tu dirección, ni datos de pago. El sitio tampoco
          usa herramientas de analítica ni de publicidad, así que no recogemos nada sobre tu
          navegación.
        </p>
      </Apartado>

      <Apartado titulo="Para qué los usamos">
        <p>
          Para atender tu reserva, abrir y llevar la orden de servicio de tu vehículo, y
          contactarte por teléfono o WhatsApp sobre ese trabajo: confirmarte la hora, avisarte del
          diagnóstico, mandarte el presupuesto y decirte cuándo está listo.
        </p>
        <p>
          Para nada más. No te mandamos publicidad, no vendemos ni cedemos tus datos a terceros, y
          no los usamos para crear perfiles ni para decidir nada de forma automática.
        </p>
      </Apartado>

      <Apartado titulo="El enlace de tu orden">
        <p>
          Cuando te mandamos el presupuesto, te llega un enlace con una clave larga y aleatoria.
          Ese enlace muestra tu nombre, la placa del vehículo, el diagnóstico y el presupuesto, y
          sirve para que apruebes o rechaces el trabajo.
        </p>
        <p>
          No se puede adivinar y no aparece en buscadores, pero{" "}
          <strong className="text-tinta">quien tenga el enlace puede ver esa información</strong>.
          Si lo reenvías, lo estás compartiendo.
        </p>
      </Apartado>

      <Apartado titulo="Cookies">
        <p>
          Si solo estás visitando el sitio o reservando una hora,{" "}
          <strong className="text-tinta">no te instalamos ninguna cookie</strong>. No hay analítica,
          ni píxeles, ni cookies de terceros, ni nada que te siga por otras webs.
        </p>
        <p>
          La única cookie del sistema es la que mantiene la sesión abierta del personal del taller
          cuando entra a administrar las órdenes. Es estrictamente necesaria para que ese acceso
          funcione, no sirve para seguir a nadie, y un visitante nunca la recibe.
        </p>
      </Apartado>

      <Apartado titulo="Dónde se guardan">
        <p>
          En una base de datos administrada por Supabase, alojada en{" "}
          <strong className="text-tinta">São Paulo, Brasil</strong>. Eso significa que tus datos
          salen del Perú: es un flujo transfronterizo, y al reservar lo estás aceptando.
        </p>
        <p>
          El acceso está restringido al personal del taller, que entra con usuario y contraseña. La
          conexión con el sitio va cifrada de punta a punta.
        </p>
      </Apartado>

      <Apartado titulo="Cuánto tiempo los conservamos">
        <p>
          El historial de tu vehículo se conserva mientras siga siendo útil para atenderte: saber
          qué se le hizo y cuándo es parte del servicio de un taller, y es lo que permite no
          repetir un trabajo ni olvidar uno pendiente.
        </p>
        <p>Si nos pides que los borremos, los borramos. Lo de abajo explica cómo.</p>
      </Apartado>

      <Apartado titulo="Qué puedes pedirnos">
        <p>
          La Ley N.° 29733 te da derecho a acceder a tus datos, a que corrijamos los que estén
          mal, a que los borremos y a oponerte a que los usemos.
        </p>
        <p>
          Para ejercer cualquiera de esos derechos, escríbenos
          {taller.email ? (
            <>
              {" "}
              a <a className="subrayado text-tinta" href={`mailto:${taller.email}`}>{taller.email}</a>
            </>
          ) : null}
          {taller.telefono ? <> o al {taller.telefono}</> : null} diciéndonos qué quieres y con qué
          placa o celular registramos tu vehículo. No cobramos nada por atenderlo.
        </p>
        <p>
          Si crees que no te atendimos bien, puedes reclamar ante la Autoridad Nacional de
          Protección de Datos Personales del Ministerio de Justicia.
        </p>
      </Apartado>

      <Apartado titulo="Menores de edad">
        <p>
          El sitio no está dirigido a menores de edad y no pedimos datos a sabiendas de que lo
          sean. Si nos avisas de que registramos los de un menor sin autorización, los borramos.
        </p>
      </Apartado>

      <Apartado titulo="Cambios">
        <p>
          Si cambiamos algo de esto, lo actualizamos en esta misma página. Lo que ves acá es lo que
          rige hoy.
        </p>
      </Apartado>
    </MarcoLegal>
  );
}
