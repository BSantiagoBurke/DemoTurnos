import localFont from "next/font/local";

// Syne y Manrope (Google Fonts, licencia OFL), servidas desde el repo para que el build
// no dependa de la red. Archivos en assets/fonts.
export const display = localFont({
  src: "../../../assets/fonts/syne-latin-700-normal.woff2",
  weight: "700",
  variable: "--font-display",
  display: "swap",
});

export const body = localFont({
  src: "../../../assets/fonts/manrope-latin-wght-normal.woff2",
  weight: "200 800",
  variable: "--font-body",
  display: "swap",
});
