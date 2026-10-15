import type { CSSProperties, ReactNode } from "react";
import type { StudioDemoConfig } from "@/lib/studio/types";
import "./studio.css";

/** Contenedor de cada demo estudio: pasa los colores de la config como CSS variables. */
export function StudioRoot({ config, fontClassName, children }: { config: StudioDemoConfig; fontClassName: string; children: ReactNode }) {
  const c = config.colores;
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
    <div style={vars} data-marca={config.marca.tipo} className={`studio-root ${fontClassName} flex min-h-dvh flex-1 flex-col`}>
      {children}
    </div>
  );
}
