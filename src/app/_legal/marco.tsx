import { SALUDO_WHATSAPP, cargarSitio, enlaceComoLlegar } from "@/lib/sitio/contenido";
import { enlaceWhatsApp } from "@/lib/whatsapp";

import { Navegacion } from "../_landing/navegacion";
import { Pie } from "../_landing/pie";

/**
 * El marco de las páginas legales: la misma navegación y el mismo pie que el
 * resto del sitio.
 *
 * Los datos del responsable —nombre, dirección, correo, teléfono— salen del
 * CMS, igual que en el landing. Escribirlos a mano acá significaría que el día
 * que el taller cambie de local, su política de privacidad siga apuntando al
 * anterior.
 */
export async function MarcoLegal({
  titulo,
  entradilla,
  children,
}: {
  titulo: string;
  entradilla: string;
  children: React.ReactNode;
}) {
  const { taller, servicios } = await cargarSitio();
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

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pt-10 pb-16 md:px-8 md:pt-14 md:pb-24">
        <div className="flex flex-col gap-3 border-b border-borde-fuerte pb-6">
          <h1 className="font-display text-4xl leading-[1.05] font-bold tracking-tight uppercase md:text-5xl">
            {titulo}
          </h1>
          <p className="text-lg text-tinta-suave">{entradilla}</p>
        </div>

        <div className="flex flex-col gap-8 pt-8">{children}</div>
      </main>

      <Pie
        taller={taller}
        servicios={servicios}
        whatsappHref={whatsappHref}
        mapaHref={enlaceComoLlegar(taller.direccion)}
        enlacesEn="/"
      />
    </>
  );
}

/** Un apartado del documento: título en condensada y su texto debajo. */
export function Apartado({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-xl font-bold tracking-[0.06em] uppercase">{titulo}</h2>
      <div className="flex flex-col gap-3 text-[17px] leading-relaxed text-tinta-suave">
        {children}
      </div>
    </section>
  );
}
