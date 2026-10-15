import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Portada, StudioBooking } from "@/components/studio/StudioBooking";
import { natinails } from "@/demos/natinails";

export const metadata: Metadata = {
  title: { absolute: natinails.og.titulo },
  description: natinails.og.descripcion,
  alternates: { canonical: "/demo/natinails" },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "/demo/natinails",
    siteName: natinails.nombre,
    title: natinails.og.titulo,
    description: natinails.og.descripcion,
  },
  twitter: { card: "summary_large_image", title: natinails.og.titulo, description: natinails.og.descripcion },
};

export const viewport: Viewport = {
  themeColor: natinails.colores.fondo,
  colorScheme: "dark",
};

export default function NatiNailsPage() {
  // La portada se pre-renderiza como fallback: el HTML estático ya muestra la marca.
  return (
    <Suspense fallback={<Portada config={natinails} />}>
      <StudioBooking config={natinails} />
    </Suspense>
  );
}
