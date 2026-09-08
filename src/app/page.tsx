import Link from "next/link";

/**
 * Marcador de posición. El landing de verdad —contenido desde `config_sitio`,
 * galería, horarios— es la Fase 3. Esto solo reemplaza la plantilla de
 * create-next-app para que abrir el proyecto muestre algo del proyecto.
 */
export default function PaginaInicio() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold">SAF Service</h1>
        <p className="mt-1 opacity-70">Taller automotriz</p>
      </div>

      <p className="text-sm opacity-70">
        El landing público se construye en la Fase 3: contenido editable desde el
        panel, galería, horarios y formulario de reserva.
      </p>

      <div className="flex flex-col gap-2 text-sm">
        <p className="font-medium">Rutas que ya existen</p>
        <ul className="flex flex-col gap-1 opacity-80">
          <li>
            <Link href="/acceso" className="underline underline-offset-4">
              /acceso
            </Link>{" "}
            — entrada del staff
          </li>
          <li>
            <Link href="/admin" className="underline underline-offset-4">
              /admin
            </Link>{" "}
            — tablero (pide sesión)
          </li>
        </ul>
      </div>
    </main>
  );
}
