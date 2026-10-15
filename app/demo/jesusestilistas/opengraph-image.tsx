import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { jesus } from "@/demos/jesusestilistas";

export const alt = "Jesús Estilistas · Reservá tu turno online";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const [anton, manrope] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/anton-latin-400-normal.woff")),
    readFile(join(process.cwd(), "assets/fonts/manrope-latin-500-normal.woff")),
  ]);
  const c = jesus.colores;
  const wordmark = jesus.marca.tipo === "wordmark" ? jesus.marca.texto : jesus.nombre;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: c.fondo,
          color: c.texto,
          fontFamily: "Manrope",
          padding: "0 96px",
        }}
      >
        <div style={{ display: "flex", fontFamily: "Anton", fontSize: 220, lineHeight: 1, letterSpacing: 8, color: c.acento }}>
          {wordmark}
        </div>
        <div style={{ display: "flex", width: 120, height: 3, background: c.acento, marginTop: 28 }} />
        <div style={{ display: "flex", fontSize: 24, letterSpacing: 8, color: c.textoSuave, marginTop: 24 }}>
          ESTILISTAS CONTEMPORÁNEOS
        </div>
        <div style={{ display: "flex", fontSize: 46, marginTop: 30 }}>Reservá tu turno online</div>
        <div style={{ display: "flex", fontSize: 28, marginTop: 16, color: c.textoSuave }}>
          Servicio · Estilista · Horario · Salta 78, San Miguel de Tucumán
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Anton", data: anton, weight: 400, style: "normal" },
        { name: "Manrope", data: manrope, weight: 500, style: "normal" },
      ],
    },
  );
}
