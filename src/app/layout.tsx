import type { Metadata } from "next";
import { Barlow, Barlow_Condensed, Geist_Mono } from "next/font/google";
import "./globals.css";

/*
  Barlow Condensed para titulares y Barlow para el texto: es la misma familia,
  y la condensada en cursiva es lo más cerca que hay en Google Fonts del
  lettering del logo. Geist Mono se queda para placas, números de orden e
  importes, donde importa que las cifras alineen.
*/
const barlow = Barlow({
  variable: "--fuente-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  variable: "--fuente-display",
  subsets: ["latin"],
  weight: ["600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--fuente-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "SAF Service · Taller automotriz en Arequipa",
    template: "%s · SAF Service",
  },
  description:
    "Taller multimotriz en Sachaca, Arequipa. Mecánica general, suspensión, cajas, motores a gasolina y diésel, escáner, planchado y pintura. Unidades livianas y pesadas.",
  openGraph: {
    type: "website",
    locale: "es_PE",
    siteName: "SAF Service",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-PE"
      className={`${barlow.variable} ${barlowCondensed.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-fondo text-tinta">{children}</body>
    </html>
  );
}
