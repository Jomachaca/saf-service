"use client";

import { useActionState } from "react";

import { guardarAjustesPresupuesto } from "../acciones-catalogo";
import { Area, Bloque, Campo, Entrada, Interruptor, useCampos } from "../campos";
import { SIN_ERROR } from "../estado-formulario";

/**
 * El IGV y el mensaje de WhatsApp del presupuesto. Van junto al catálogo porque
 * el IGV decide cómo se leen sus precios (decisión 16), y nada de esto sale en
 * el sitio público.
 */
export function AjustesPresupuesto({
  igvIncluido,
  igvTasaBp,
  plantilla,
}: {
  igvIncluido: boolean;
  igvTasaBp: number;
  plantilla: string;
}) {
  const inicial = {
    igv_incluido: igvIncluido,
    igv_tasa: String(igvTasaBp / 100),
    plantilla_presupuesto: plantilla,
  };

  const [estado, accion, guardando] = useActionState(guardarAjustesPresupuesto, SIN_ERROR);
  const [campos, cambiar] = useCampos(inicial);

  const sucio = (Object.keys(inicial) as (keyof typeof inicial)[]).some(
    (clave) => campos[clave] !== inicial[clave],
  );

  return (
    <form action={accion}>
      <Bloque
        titulo="Presupuestos"
        descripcion="El IGV y el mensaje con el que sale el enlace por WhatsApp. Afecta a los presupuestos nuevos: los ya emitidos guardan la configuración que tenían cuando se enviaron."
        sucio={sucio}
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
