import type { Metadata, Viewport } from "next";
import { StudioPanel } from "@/components/studio/panel/StudioPanel";
import { natinails } from "@/demos/natinails";

export const metadata: Metadata = {
  title: { absolute: `Panel · ${natinails.nombre}` },
  description: "Turnos de las 3 sedes en un solo lugar (demo).",
};

export const viewport: Viewport = {
  themeColor: natinails.colores.fondo,
  colorScheme: "dark",
};

export default function NatiNailsPanelPage() {
  return <StudioPanel config={natinails} />;
}
