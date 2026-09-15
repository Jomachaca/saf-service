import { SALUDO_WHATSAPP, cargarSitio, enlaceComoLlegar } from "@/lib/sitio/contenido";
import { enlaceWhatsApp } from "@/lib/whatsapp";

import { Contacto } from "./_landing/contacto";
import { Destacados } from "./_landing/destacados";
import { Galeria } from "./_landing/galeria";
import { Hero } from "./_landing/hero";
import { Navegacion } from "./_landing/navegacion";
import { Pie } from "./_landing/pie";
import { Servicios } from "./_landing/servicios";
import { Taller } from "./_landing/taller";

/**
 * El landing.
 *
 * Todo el contenido sale de `cargarSitio()`, que está cacheado hasta que
 * alguien pulse "Publicar cambios" en `/admin/sitio` (decisión 17). Por eso la
 * página se prerenderiza entera: no hay ninguna lectura dinámica acá.
 *
 * Eso incluye el botón «Reservar hora», que sale según el interruptor de
 * reservas tal como estaba al publicar. El formulario de `/reservar`, en
 * cambio, mira el valor en vivo (decisión 29).
 *
 * Cada sección decide si se muestra según lo que tenga cargado. Un taller que
 * todavía no subió fotos ni horarios ve una página corta pero terminada, nunca
 * un hueco ni un texto de relleno.
 */
export default async function PaginaInicio() {
  const { taller, hero, nosotros, destacados, galeria, servicios, reservasActivas } =
    await cargarSitio();

  const whatsappHref = taller.whatsapp ? enlaceWhatsApp(taller.whatsapp, SALUDO_WHATSAPP) : null;
  const reservarHref = reservasActivas ? "/reservar" : null;
  const mapaHref = enlaceComoLlegar(taller.direccion);

  return (
    <>
      <Navegacion
        logo={taller.logoUrl}
        nombre={taller.nombre}
        whatsapp={whatsappHref}
        reservar={reservarHref}
      />

      <main className="flex flex-col">
        <Hero
          hero={hero}
          taller={taller}
          whatsappHref={whatsappHref}
          reservarHref={reservarHref}
          mapaHref={mapaHref}
        />
        <Servicios servicios={servicios} />
        <Destacados destacados={destacados} />
        <Taller nosotros={nosotros} />
        <Galeria fotos={galeria} />
        <Contacto taller={taller} whatsappHref={whatsappHref} mapaHref={mapaHref} />
      </main>

      <Pie taller={taller} />
    </>
  );
}
