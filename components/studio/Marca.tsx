import type { StudioMarca } from "@/lib/studio/types";
import { NNMonogram } from "./NNMonogram";

/**
 * Logo de la demo según la config: monograma NN o nombre en texto (tipografía display, color de acento).
 * `size` es la altura aproximada en px.
 */
export function Marca({ marca, size = 96, title }: { marca: StudioMarca; size?: number; title?: string }) {
  if (marca.tipo === "nn") return <NNMonogram size={size} title={title} />;
  return (
    <span
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className="st-display st-wordmark inline-block leading-none text-(--st-accent)"
      style={{ fontSize: Math.round(size * 0.72) }}
    >
      {marca.texto}
    </span>
  );
}
