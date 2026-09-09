import { cargarSitio } from "@/lib/sitio/contenido";
import { enlaceWhatsApp } from "@/lib/whatsapp";

import { Contacto } from "./_landing/contacto";
import { Destacados } from "./_landing/destacados";
import { Galeria } from "./_landing/galeria";
import { Hero } from "./_landing/hero";
import { Navegacion } from "./_landing/navegacion";
import { Pie } from "./_landing/pie";
import { Servicios } from "./_landing/servicios";
import { Taller } from "./_landing/taller";

/** Lo que aparece escrito cuando alguien abre WhatsApp desde el sitio. */
const SALUDO = "Hola, quisiera consultar por un servicio para mi vehículo.";

/**
 * El landing.
 *
 * Todo el contenido sale de `cargarSitio()`, que está cacheado hasta que
 * alguien pulse "Publicar cambios" en `/admin/config` (decisión 17). Por eso la
 * página se prerenderiza entera: no hay ninguna lectura dinámica acá.
 *
 * Cada sección decide si se muestra según lo que tenga cargado. Un taller que
 * todavía no subió fotos ni horarios ve una página corta pero terminada, nunca
 * un hueco ni un texto de relleno.
 */
export default async function PaginaInicio() {
  const { taller, hero, nosotros, destacados, galeria, servicios } = await cargarSitio();

  const whatsappHref = taller.whatsapp ? enlaceWhatsApp(taller.whatsapp, SALUDO) : null;

  const mapaHref = taller.direccion
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(taller.direccion)}`
    : null;

  return (
    <>
      <Navegacion whatsapp={whatsappHref} logo={taller.logoUrl} nombre={taller.nombre} />

      <main className="flex flex-col">
        <Hero hero={hero} taller={taller} whatsappHref={whatsappHref} mapaHref={mapaHref} />
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
