import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { natinails } from "@/demos/natinails";
import { body, display } from "./fonts";
import { siteUrl } from "@/lib/site-url";
import "./studio.css";

// Base absoluta para la imagen OG (WhatsApp necesita URLs completas).
export const metadata: Metadata = { metadataBase: siteUrl() };

export default function NatiNailsLayout({ children }: LayoutProps<"/demo/natinails">) {
  const c = natinails.colores;
  const vars = {
    "--st-bg": c.fondo,
    "--st-page-bg": c.fondo,
    "--st-surface": c.superficie,
    "--st-border": c.borde,
    "--st-text": c.texto,
    "--st-muted": c.textoSuave,
    "--st-accent": c.acento,
    "--st-on-accent": c.textoSobreAcento,
  } as CSSProperties;

  return (
    <div style={vars} className={`studio-root ${display.variable} ${body.variable} flex min-h-dvh flex-1 flex-col`}>
      {children}
    </div>
  );
}
