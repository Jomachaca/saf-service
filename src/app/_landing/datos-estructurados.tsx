import type { Taller } from "@/lib/sitio/contenido";
import { sitioUrl } from "@/lib/sitio/url";

/**
 * Los datos del taller en formato schema.org, para que un buscador pueda
 * mostrar la dirección y el teléfono sin tener que adivinarlos del texto.
 *
 * `AutoRepair` y no `LocalBusiness` a secas: es el tipo exacto y lo entienden
 * igual.
 *
 * **No van los horarios.** En el CMS son texto libre —«Lunes a viernes»,
 * «8:00 a 18:00»— y traducirlos a `openingHoursSpecification` sería adivinar.
 * Un horario equivocado publicado como dato estructurado es peor que ninguno:
 * manda gente al taller cuando está cerrado.
 *
 * La dirección viaja entera en `streetAddress` por lo mismo. Partirla por las
 * comas funciona con la de hoy y se rompe el día que la cambien.
 */
export function DatosEstructurados({ taller }: { taller: Taller }) {
  const base = sitioUrl();

  const redes = [taller.facebook, taller.instagram, taller.tiktok].filter((red) => red.trim());

  const datos = {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    name: taller.nombre,
    description: taller.descripcion || taller.slogan || undefined,
    url: base,
    image: taller.logoUrl ?? undefined,
    telephone: taller.telefono || undefined,
    email: taller.email || undefined,
    address: taller.direccion
      ? { "@type": "PostalAddress", streetAddress: taller.direccion, addressCountry: "PE" }
      : undefined,
    areaServed: { "@type": "City", name: "Arequipa" },
    sameAs: redes.length > 0 ? redes : undefined,
  };

  /*
    `dangerouslySetInnerHTML` es la única forma de poner JSON-LD en React: si se
    pasa como hijo de <script>, React escapa los caracteres y rompe el JSON.

    El escape de `<` es el que importa. El contenido sale del CMS, o sea de
    alguien con sesión de staff, pero un `</script>` escrito en la descripción
    del taller cerraría la etiqueta antes de tiempo y el resto se interpretaría
    como HTML. Con `<` eso no puede pasar, y el JSON sigue siendo válido.
  */
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(datos).replace(/</g, "\\u003c") }}
    />
  );
}
