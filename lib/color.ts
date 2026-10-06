/** Utilidades de contraste WCAG para los colores de cada tenant. */

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export const LIGHT_TEXT = "#ffffff";
export const DARK_TEXT = "#111827";

/** Texto blanco si llega a AA (4.5:1) sobre el fondo; si no, texto oscuro. */
export function readableTextOn(background: string): string {
  return contrastRatio(background, LIGHT_TEXT) >= 4.5 ? LIGHT_TEXT : DARK_TEXT;
}

/** CSS variables del tenant para inyectar en el contenedor. */
export function tenantCssVars(colors: { primary: string; accent: string }): Record<string, string> {
  return {
    "--color-primary": colors.primary,
    "--color-on-primary": readableTextOn(colors.primary),
    "--color-accent": colors.accent,
    "--color-on-accent": readableTextOn(colors.accent),
  };
}
