"use client";

import { Plus, X } from "@phosphor-icons/react/dist/ssr";
import { useActionState, useState } from "react";

import type { ConfigCompleta } from "@/lib/sitio/panel";

import { SIN_ERROR } from "../estado-formulario";
import {
  fijarImagen,
  guardarFacturacion,
  guardarHorarios,
  guardarIdentidad,
  guardarNosotros,
  guardarPortada,
} from "./acciones";
import { Area, Bloque, Campo, Entrada, Interruptor, useCampos } from "./campos";
import { ImagenActual, SubirImagen } from "./subir";

function distinto<T extends Record<string, string | boolean>>(campos: T, inicial: T) {
  return (Object.keys(campos) as (keyof T)[]).some((clave) => campos[clave] !== inicial[clave]);
}

// ---------------------------------------------------------------------------

export function Identidad({ config }: { config: ConfigCompleta }) {
  const inicial = {
    nombre_taller: config.nombreTaller,
    slogan: config.slogan,
    descripcion: config.descripcion,
    telefono: config.telefono,
    whatsapp: config.whatsapp,
    email: config.email,
    direccion: config.direccion,
    facebook: config.facebook,
    instagram: config.instagram,
    tiktok: config.tiktok,
    mapa_url: config.mapaUrl,
  };

  const [estado, accion, guardando] = useActionState(guardarIdentidad, SIN_ERROR);
  const [campos, cambiar] = useCampos(inicial);

  return (
    <form action={accion}>
      <Bloque
        titulo="Identidad y contacto"
        descripcion="Lo que aparece en la cabecera, el pie y la sección de contacto del sitio."
        sucio={distinto(campos, inicial)}
        guardando={guardando}
        error={estado.error}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Campo etiqueta="Nombre del taller">
            <Entrada
              nombre="nombre_taller"
              valor={campos.nombre_taller}
              onCambiar={(v) => cambiar("nombre_taller", v)}
              required
            />
          </Campo>

          <Campo etiqueta="Lema" ayuda="Una línea corta. Puede quedar vacío.">
            <Entrada
              nombre="slogan"
              valor={campos.slogan}
              onCambiar={(v) => cambiar("slogan", v)}
            />
          </Campo>
        </div>

        <Campo
          etiqueta="Descripción"
          ayuda="Se usa como resumen del sitio para buscadores y para cuando falta el texto de portada."
        >
          <Area
            nombre="descripcion"
            filas={2}
            valor={campos.descripcion}
            onCambiar={(v) => cambiar("descripcion", v)}
          />
        </Campo>

        <div className="grid gap-4 md:grid-cols-3">
          <Campo etiqueta="Teléfono" ayuda="Como quieres que se lea: 959 960 390.">
            <Entrada
              nombre="telefono"
              valor={campos.telefono}
              onCambiar={(v) => cambiar("telefono", v)}
              inputMode="tel"
            />
          </Campo>

          <Campo etiqueta="WhatsApp" ayuda="Solo dígitos. Se le antepone +51 si hacen falta.">
            <Entrada
              nombre="whatsapp"
              valor={campos.whatsapp}
              onCambiar={(v) => cambiar("whatsapp", v)}
              inputMode="numeric"
            />
          </Campo>

          <Campo etiqueta="Correo">
            <Entrada
              nombre="email"
              valor={campos.email}
              onCambiar={(v) => cambiar("email", v)}
              type="email"
            />
          </Campo>
        </div>

        <Campo etiqueta="Dirección">
          <Entrada
            nombre="direccion"
            valor={campos.direccion}
            onCambiar={(v) => cambiar("direccion", v)}
          />
        </Campo>

        <Campo
          etiqueta="Mapa"
          ayuda="En Google Maps: Compartir, Insertar un mapa, y copia solo la dirección que va dentro de src. Empieza con https://www.google.com/maps/embed."
        >
          <Entrada
            nombre="mapa_url"
            valor={campos.mapa_url}
            onCambiar={(v) => cambiar("mapa_url", v)}
            placeholder="https://www.google.com/maps/embed?pb=…"
          />
        </Campo>

        <div className="grid gap-4 md:grid-cols-3">
          <Campo etiqueta="Facebook">
            <Entrada
              nombre="facebook"
              valor={campos.facebook}
              onCambiar={(v) => cambiar("facebook", v)}
              placeholder="https://facebook.com/…"
            />
          </Campo>

          <Campo etiqueta="Instagram">
            <Entrada
              nombre="instagram"
              valor={campos.instagram}
              onCambiar={(v) => cambiar("instagram", v)}
              placeholder="https://instagram.com/…"
            />
          </Campo>

          <Campo etiqueta="TikTok">
            <Entrada
              nombre="tiktok"
              valor={campos.tiktok}
              onCambiar={(v) => cambiar("tiktok", v)}
              placeholder="https://tiktok.com/@…"
            />
          </Campo>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-borde p-4">
          <span className="text-sm font-medium">Logo</span>
          <p className="text-xs text-tinta-tenue">
            Va sobre la barra azul oscuro, así que conviene un PNG con fondo
            transparente. Si el archivo trae su propio fondo claro, se verá como un
            recuadro. Sin logo se usa el nombre escrito con la tipografía de la marca.
          </p>
          <ImagenActual
            url={config.logoUrl}
            alt="Logo del taller"
            alQuitar={() => fijarImagen("logo", null)}
            vacio="Sin logo. Se usa el nombre del taller escrito."
          />
          <SubirImagen
            carpeta="logo"
            alTerminar={(url) => fijarImagen("logo", url)}
            texto={config.logoUrl ? "Reemplazar logo" : "Subir logo"}
          />
        </div>
      </Bloque>
    </form>
  );
}

// ---------------------------------------------------------------------------

export function Portada({ config }: { config: ConfigCompleta }) {
  const inicial = {
    hero_titulo: config.heroTitulo,
    hero_subtitulo: config.heroSubtitulo,
  };

  const [estado, accion, guardando] = useActionState(guardarPortada, SIN_ERROR);
  const [campos, cambiar] = useCampos(inicial);

  return (
    <form action={accion}>
      <Bloque
        titulo="Portada"
        descripcion="Lo primero que se ve al abrir el sitio. Dos líneas como mucho en el titular: si es más largo, se ve apretado en el celular."
        sucio={distinto(campos, inicial)}
        guardando={guardando}
        error={estado.error}
      >
        <Campo etiqueta="Titular">
          <Area
            nombre="hero_titulo"
            filas={2}
            valor={campos.hero_titulo}
            onCambiar={(v) => cambiar("hero_titulo", v)}
          />
        </Campo>

        <Campo etiqueta="Bajada" ayuda="Una o dos frases. Acá van los servicios que más se piden.">
          <Area
            nombre="hero_subtitulo"
            filas={2}
            valor={campos.hero_subtitulo}
            onCambiar={(v) => cambiar("hero_subtitulo", v)}
          />
        </Campo>

        <div className="flex flex-col gap-3 rounded-lg border border-borde p-4">
          <span className="text-sm font-medium">Foto de portada</span>
          <ImagenActual
            url={config.heroImagenUrl}
            alt="Foto de portada"
            alQuitar={() => fijarImagen("hero", null)}
          />
          <SubirImagen
            carpeta="portada"
            alTerminar={(url) => fijarImagen("hero", url)}
            texto={config.heroImagenUrl ? "Reemplazar foto" : "Subir foto"}
          />
        </div>
      </Bloque>
    </form>
  );
}

// ---------------------------------------------------------------------------

export function ElTaller({ config }: { config: ConfigCompleta }) {
  const inicial = {
    nosotros_titulo: config.nosotrosTitulo,
    nosotros_texto: config.nosotrosTexto,
  };

  const [estado, accion, guardando] = useActionState(guardarNosotros, SIN_ERROR);
  const [campos, cambiar] = useCampos(inicial);

  return (
    <form action={accion}>
      <Bloque
        titulo="El taller"
        descripcion="Quiénes son y qué hacen. Los saltos de línea que escribas se respetan en el sitio."
        sucio={distinto(campos, inicial)}
        guardando={guardando}
        error={estado.error}
      >
        <Campo etiqueta="Título">
          <Entrada
            nombre="nosotros_titulo"
            valor={campos.nosotros_titulo}
            onCambiar={(v) => cambiar("nosotros_titulo", v)}
          />
        </Campo>

        <Campo etiqueta="Texto">
          <Area
            nombre="nosotros_texto"
            filas={6}
            valor={campos.nosotros_texto}
            onCambiar={(v) => cambiar("nosotros_texto", v)}
          />
        </Campo>

        <div className="flex flex-col gap-3 rounded-lg border border-borde p-4">
          <span className="text-sm font-medium">Foto de la sección</span>
          <ImagenActual
            url={config.nosotrosImagenUrl}
            alt="Foto del taller"
            alQuitar={() => fijarImagen("nosotros", null)}
          />
          <SubirImagen
            carpeta="taller"
            alTerminar={(url) => fijarImagen("nosotros", url)}
            texto={config.nosotrosImagenUrl ? "Reemplazar foto" : "Subir foto"}
          />
        </div>
      </Bloque>
    </form>
  );
}

// ---------------------------------------------------------------------------

export function Horarios({ config }: { config: ConfigCompleta }) {
  const [estado, accion, guardando] = useActionState(guardarHorarios, SIN_ERROR);
  const [filas, setFilas] = useState(config.horarios);

  const serializado = JSON.stringify(filas);
  const sucio = serializado !== JSON.stringify(config.horarios);

  function editar(indice: number, campo: "etiqueta" | "horario", valor: string) {
    setFilas((previas) =>
      previas.map((fila, i) => (i === indice ? { ...fila, [campo]: valor } : fila)),
    );
  }

  return (
    <form action={accion}>
      <input type="hidden" name="horarios" value={serializado} />

      <Bloque
        titulo="Horario"
        descripcion="Si lo dejas vacío, la sección no aparece en el sitio. Es preferible a publicar un horario que no es."
        sucio={sucio}
        guardando={guardando}
        error={estado.error}
      >
        {filas.length === 0 ? (
          <p className="text-sm text-tinta-tenue">
            Sin horarios cargados. El sitio no muestra la sección.
          </p>
        ) : null}

        {filas.map((fila, indice) => (
          <div key={indice} className="flex items-end gap-2">
            <div className="flex-1">
              <Campo etiqueta={indice === 0 ? "Días" : ""}>
                <Entrada
                  nombre={`etiqueta_${indice}`}
                  valor={fila.etiqueta}
                  onCambiar={(v) => editar(indice, "etiqueta", v)}
                  placeholder="Lunes a viernes"
                />
              </Campo>
            </div>

            <div className="flex-1">
              <Campo etiqueta={indice === 0 ? "Horario" : ""}>
                <Entrada
                  nombre={`horario_${indice}`}
                  valor={fila.horario}
                  onCambiar={(v) => editar(indice, "horario", v)}
                  placeholder="8:00 a 17:30"
                />
              </Campo>
            </div>

            <button
              type="button"
              onClick={() => setFilas((previas) => previas.filter((_, i) => i !== indice))}
              aria-label="Quitar fila"
              className="mb-1 rounded-lg border border-borde p-2 text-tinta-tenue transition-colors duration-200 hover:border-marca hover:text-marca"
            >
              <X size={16} />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setFilas((previas) => [...previas, { etiqueta: "", horario: "" }])}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-borde-fuerte px-3 py-2 text-sm font-medium transition duration-200 ease-salida hover:border-marca hover:text-marca"
        >
          <Plus size={16} />
          Agregar día
        </button>
      </Bloque>
    </form>
  );
}

// ---------------------------------------------------------------------------

export function Facturacion({ config }: { config: ConfigCompleta }) {
  const inicial = {
    igv_incluido: config.igvIncluido,
    igv_tasa: String(config.igvTasaBp / 100),
    plantilla_presupuesto: config.plantillas.presupuesto ?? "",
  };

  const [estado, accion, guardando] = useActionState(guardarFacturacion, SIN_ERROR);
  const [campos, cambiar] = useCampos(inicial);

  return (
    <form action={accion}>
      <Bloque
        titulo="IGV y mensaje de WhatsApp"
        descripcion="Afecta a los presupuestos nuevos. Los ya emitidos guardan la configuración que tenían cuando se enviaron."
        sucio={distinto(campos, inicial)}
        guardando={guardando}
        error={estado.error}
      >
        <div className="grid items-end gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Los precios del catálogo</span>
            <Interruptor
              nombre="igv_incluido"
              activo={campos.igv_incluido}
              onCambiar={(v) => cambiar("igv_incluido", v)}
              etiqueta={campos.igv_incluido ? "ya incluyen IGV" : "son sin IGV"}
            />
          </div>

          <Campo etiqueta="Tasa de IGV" ayuda="En porcentaje. En Perú son 18.">
            <Entrada
              nombre="igv_tasa"
              valor={campos.igv_tasa}
              onCambiar={(v) => cambiar("igv_tasa", v)}
              inputMode="decimal"
            />
          </Campo>
        </div>

        <Campo
          etiqueta="Mensaje del presupuesto"
          ayuda="Marcadores disponibles: {cliente}, {marca}, {modelo}, {placa} y {url}. El {url} es obligatorio."
        >
          <Area
            nombre="plantilla_presupuesto"
            filas={3}
            valor={campos.plantilla_presupuesto}
            onCambiar={(v) => cambiar("plantilla_presupuesto", v)}
          />
        </Campo>
      </Bloque>
    </form>
  );
}
