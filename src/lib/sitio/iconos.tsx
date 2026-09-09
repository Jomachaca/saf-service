import type { IconProps } from "@phosphor-icons/react";
import {
  Car,
  CarBattery,
  Circuitry,
  ClipboardText,
  Clock,
  Crane,
  Drop,
  Engine,
  Gauge,
  PaintRoller,
  ShieldCheck,
  Snowflake,
  Tire,
  TruckTrailer,
  Wrench,
} from "@phosphor-icons/react/dist/ssr";

/**
 * Catálogo cerrado de íconos para los destacados del landing.
 *
 * Es cerrado a propósito (decisión 11): el taller elige de una lista y no puede
 * pegar un SVG suelto ni un emoji que rompa la fila. Agregar uno es agregar una
 * entrada acá, no una migración.
 *
 * Cada entrada guarda una función que dibuja el ícono, no el componente en sí.
 * Elegir un componente con una variable durante el render es exactamente lo que
 * la regla `react-hooks/static-components` prohíbe, y con razón: el compilador
 * no puede saber que la referencia es estable. Llamar a una función que
 * devuelve JSX no tiene ese problema.
 */

type Pintor = (props: IconProps) => React.ReactNode;

export const ICONOS: Record<string, { etiqueta: string; pintar: Pintor }> = {
  llave: { etiqueta: "Llave (mecánica general)", pintar: (p) => <Wrench {...p} /> },
  motor: { etiqueta: "Motor", pintar: (p) => <Engine {...p} /> },
  escaner: { etiqueta: "Escáner / diagnóstico", pintar: (p) => <Gauge {...p} /> },
  electrico: { etiqueta: "Sistema eléctrico", pintar: (p) => <Circuitry {...p} /> },
  grua: { etiqueta: "Grúa", pintar: (p) => <Crane {...p} /> },
  camion: { etiqueta: "Unidades pesadas", pintar: (p) => <TruckTrailer {...p} /> },
  auto: { etiqueta: "Unidades livianas", pintar: (p) => <Car {...p} /> },
  neumatico: { etiqueta: "Neumáticos", pintar: (p) => <Tire {...p} /> },
  bateria: { etiqueta: "Batería", pintar: (p) => <CarBattery {...p} /> },
  pintura: { etiqueta: "Planchado y pintura", pintar: (p) => <PaintRoller {...p} /> },
  lavado: { etiqueta: "Car wash", pintar: (p) => <Drop {...p} /> },
  aire: { etiqueta: "Aire acondicionado", pintar: (p) => <Snowflake {...p} /> },
  lista: { etiqueta: "Presupuesto", pintar: (p) => <ClipboardText {...p} /> },
  garantia: { etiqueta: "Garantía", pintar: (p) => <ShieldCheck {...p} /> },
  reloj: { etiqueta: "Tiempos de entrega", pintar: (p) => <Clock {...p} /> },
};

export const CLAVES_ICONO = Object.keys(ICONOS);

/** Nunca falla: una clave vieja o desconocida cae en la llave. */
export function Icono({ clave, ...props }: { clave: string } & IconProps) {
  const entrada = ICONOS[clave] ?? ICONOS.llave;
  return <>{entrada.pintar(props)}</>;
}
