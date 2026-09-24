import { Suspense } from "react";

import { cargarSitio } from "@/lib/sitio/contenido";

import { Apartado, MarcoLegal } from "../_legal/marco";

export const metadata = {
  title: "Términos de uso",
  description:
    "Qué es y qué no es una reserva hecha por la web, cómo funcionan los precios del catálogo y qué significa aprobar un presupuesto.",
};

/**
 * Términos de uso.
 *
 * Lo que tiene que dejar claro es lo que el sistema promete y lo que no: una
 * reserva es una solicitud de hora, los precios del catálogo son referenciales,
 * y aprobar un presupuesto autoriza el trabajo pero no es un comprobante de
 * pago (regla 8: acá nunca se dice «boleta»).
 */
export default function PaginaTerminos() {
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
      titulo="Términos de uso"
      entradilla="Qué significa reservar por la web y qué significa aprobar un presupuesto."
    >
      <Apartado titulo="Quién opera este sitio">
        <p>
          Este sitio es de <strong className="text-tinta">{taller.nombre}</strong>
          {taller.direccion ? `, con taller en ${taller.direccion}` : ""}. Al usarlo aceptas lo que
          dice esta página y la{" "}
          <a className="subrayado text-tinta" href="/privacidad">
            política de privacidad
          </a>
          .
        </p>
      </Apartado>

      <Apartado titulo="Reservar una hora es pedirla, no cerrarla">
        <p>
          Cuando reservas por la web estás pidiendo un espacio en la agenda del taller. El taller
          te lo confirma por WhatsApp o por teléfono, y{" "}
          <strong className="text-tinta">recién ahí la reserva está en pie</strong>.
        </p>
        <p>
          Puede pasar que haya que reprogramarla: una avería que se alarga, un repuesto que no
          llega. Si ocurre, te avisamos. De la misma forma, si no puedes venir, avísanos para
          liberar el espacio.
        </p>
      </Apartado>

      <Apartado titulo="Los precios que ves son referenciales">
        <p>
          Los precios del catálogo de servicios sirven para que te hagas una idea. No son una
          cotización: el precio real de tu trabajo sale del presupuesto que armamos después de
          revisar tu vehículo, porque hasta no verlo nadie sabe qué necesita.
        </p>
      </Apartado>

      <Apartado titulo="Aprobar un presupuesto">
        <p>
          El enlace que te mandamos te deja aprobar o rechazar el presupuesto. Aprobarlo es
          autorizarnos a hacer ese trabajo por ese monto; queda registrado con la fecha y el nombre
          que escribas.
        </p>
        <p>
          <strong className="text-tinta">No es un comprobante de pago.</strong> El comprobante que
          corresponda se emite aparte, en el taller, cuando recoges el vehículo.
        </p>
        <p>
          Si hace falta un trabajo adicional que no estaba presupuestado, te mandamos un
          presupuesto nuevo. No hacemos nada que no hayas aprobado.
        </p>
      </Apartado>

      <Apartado titulo="El enlace de tu orden es tuyo">
        <p>
          El enlace de tu orden contiene una clave larga y aleatoria, y quien lo tenga puede ver el
          diagnóstico, el presupuesto y los datos de tu vehículo. Cuídalo como cuidarías una
          factura: si lo compartes, compartes esa información.
        </p>
      </Apartado>

      <Apartado titulo="El contenido del sitio">
        <p>
          Los textos, las fotos y la marca de {taller.nombre} son suyos. Puedes compartir enlaces
          al sitio sin pedir permiso; para reproducir el contenido en otro lado, escríbenos.
        </p>
      </Apartado>

      <Apartado titulo="Disponibilidad">
        <p>
          Hacemos lo posible por mantener el sitio en línea, pero puede estar caído por
          mantenimiento o por algo fuera de nuestro alcance. Si necesitas algo y la web no
          responde,{" "}
          {taller.telefono ? <>llámanos al {taller.telefono} o </> : null}pásate por el taller.
        </p>
      </Apartado>

      <Apartado titulo="Ley aplicable">
        <p>
          Todo esto se rige por las leyes del Perú, y cualquier desacuerdo se ve ante los jueces de
          Arequipa.
        </p>
      </Apartado>
    </MarcoLegal>
  );
}
