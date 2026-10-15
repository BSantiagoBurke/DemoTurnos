import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Portada, StudioBooking } from "@/components/studio/StudioBooking";
import { jesus } from "@/demos/jesusestilistas";

export const metadata: Metadata = {
  title: { absolute: jesus.og.titulo },
  description: jesus.og.descripcion,
  alternates: { canonical: "/demo/jesusestilistas" },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "/demo/jesusestilistas",
    siteName: jesus.nombre,
    title: jesus.og.titulo,
    description: jesus.og.descripcion,
  },
  twitter: { card: "summary_large_image", title: jesus.og.titulo, description: jesus.og.descripcion },
};

export const viewport: Viewport = {
  themeColor: jesus.colores.fondo,
  colorScheme: "dark",
};

export default function JesusPage() {
  // La portada se pre-renderiza como fallback: el HTML estático ya muestra la marca.
  return (
    <Suspense fallback={<Portada config={jesus} />}>
      <StudioBooking config={jesus} />
    </Suspense>
  );
}
