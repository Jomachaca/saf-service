"use client";

import { Trash, UploadSimple } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { useState } from "react";

import { crearClienteNavegador } from "@/lib/supabase/client";

import { Aviso } from "../componentes";

/**
 * Subida de fotos con redimensionado en el navegador.
 *
 * Esto es el riesgo de `ARQUITECTURA.md` §13: el dueño sube desde el celular
 * una foto de 8 MB y el landing tarda quince segundos. La foto se reduce acá
 * antes de salir del teléfono, así que lo que viaja son unos 200 KB, y el
 * límite de peso del bucket queda como segunda defensa, no como la única.
 *
 * Se sube directamente a Storage con la sesión del staff; al servidor solo
 * llega la URL. Mandar el archivo por una acción de servidor lo haría viajar
 * dos veces.
 */

const LADO_MAXIMO = 1600;
const CALIDAD = 0.82;

async function reducir(archivo: File): Promise<Blob> {
  // `from-image` respeta la orientación EXIF: sin esto, las fotos tomadas en
  // vertical con el celular se guardan giradas.
  const mapa = await createImageBitmap(archivo, { imageOrientation: "from-image" });

  const escala = Math.min(1, LADO_MAXIMO / Math.max(mapa.width, mapa.height));
  const ancho = Math.round(mapa.width * escala);
  const alto = Math.round(mapa.height * escala);

  const lienzo = document.createElement("canvas");
  lienzo.width = ancho;
  lienzo.height = alto;

  const pincel = lienzo.getContext("2d");
  if (!pincel) throw new Error("El navegador no pudo procesar la imagen.");

  pincel.drawImage(mapa, 0, 0, ancho, alto);
  mapa.close();

  return await new Promise<Blob>((entregar, fallar) => {
    lienzo.toBlob(
      (blob) =>
        blob ? entregar(blob) : fallar(new Error("No se pudo convertir la imagen.")),
      "image/webp",
      CALIDAD,
    );
  });
}

export function SubirImagen({
  carpeta,
  alTerminar,
  texto = "Subir foto",
}: {
  carpeta: string;
  alTerminar: (url: string) => Promise<void>;
  texto?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  async function manejar(evento: React.ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    // Se limpia enseguida para poder volver a elegir el mismo archivo.
    evento.target.value = "";
    if (!archivo) return;

    setError(null);
    setSubiendo(true);

    try {
      const reducida = await reducir(archivo);

      const supabase = crearClienteNavegador();
      const ruta = `${carpeta}/${crypto.randomUUID()}.webp`;

      const { error: fallo } = await supabase.storage
        .from("sitio")
        .upload(ruta, reducida, { contentType: "image/webp" });

      if (fallo) throw new Error(fallo.message);

      const { data } = supabase.storage.from("sitio").getPublicUrl(ruta);
      await alTerminar(data.publicUrl);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No se pudo subir la imagen.");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label
        className={`inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-borde-fuerte px-4 py-2 text-sm font-medium transition duration-200 ease-salida hover:border-marca hover:text-marca ${
          subiendo ? "pointer-events-none opacity-50" : ""
        }`}
      >
        <UploadSimple size={18} />
        {subiendo ? "Subiendo…" : texto}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={manejar}
          disabled={subiendo}
          className="sr-only"
        />
      </label>

      {error ? <Aviso>{error}</Aviso> : null}
    </div>
  );
}

/** Vista previa con el botón de quitar, para las tres imágenes de campo fijo. */
export function ImagenActual({
  url,
  alt,
  alQuitar,
  vacio = "Sin imagen. La sección se muestra igual, con la trama de la marca.",
}: {
  url: string | null;
  alt: string;
  alQuitar: () => Promise<void>;
  vacio?: string;
}) {
  const [quitando, setQuitando] = useState(false);

  if (!url) return <p className="text-sm text-tinta-tenue">{vacio}</p>;

  return (
    <div className="flex items-start gap-3">
      <div className="relative aspect-4/3 w-40 overflow-hidden rounded-lg bg-fondo-hondo">
        <Image src={url} alt={alt} fill sizes="10rem" className="object-contain" />
      </div>

      <button
        type="button"
        disabled={quitando}
        onClick={async () => {
          setQuitando(true);
          try {
            await alQuitar();
          } finally {
            setQuitando(false);
          }
        }}
        className="inline-flex items-center gap-2 rounded-lg border border-borde-fuerte px-3 py-2 text-sm transition duration-200 ease-salida hover:border-marca hover:text-marca disabled:opacity-50"
      >
        <Trash size={16} />
        {quitando ? "Quitando…" : "Quitar"}
      </button>
    </div>
  );
}
