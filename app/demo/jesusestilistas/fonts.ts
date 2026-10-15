import localFont from "next/font/local";

// Anton (display condensada, para el wordmark y los títulos) y Manrope (texto), Google Fonts con
// licencia OFL, servidas desde el repo para que el build no dependa de la red. Archivos en assets/fonts.
// Anton tiene un solo peso; se declara como 700 para que el navegador no le agregue una negrita falsa.
// Los nombres de las constantes son únicos: next/font los usa como nombre de familia y, si coinciden
// con los de otra demo (ej. "display" de Nati Nails), una fuente pisa a la otra.
export const jesusDisplay = localFont({
  src: "../../../assets/fonts/anton-latin-400-normal.woff2",
  weight: "700",
  variable: "--font-display",
  display: "swap",
});

export const jesusBody = localFont({
  src: "../../../assets/fonts/manrope-latin-wght-normal.woff2",
  weight: "200 800",
  variable: "--font-body",
  display: "swap",
});
