import type { Metadata, Viewport } from "next";
import { StudioPanel } from "@/components/studio/panel/StudioPanel";
import { jesus } from "@/demos/jesusestilistas";

export const metadata: Metadata = {
  title: { absolute: `Panel · ${jesus.nombre}` },
  description: "Los turnos de todo el equipo en una sola agenda (demo).",
};

export const viewport: Viewport = {
  themeColor: jesus.colores.fondo,
  colorScheme: "dark",
};

export default function JesusPanelPage() {
  return <StudioPanel config={jesus} />;
}
