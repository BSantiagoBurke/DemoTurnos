import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { NN_PATH } from "@/components/studio/NNMonogram";
import { natinails } from "@/demos/natinails";

export const alt = "Nati Nails 2.0 · Reservá tu turno online";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const [syne, manrope] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/syne-latin-700-normal.woff")),
    readFile(join(process.cwd(), "assets/fonts/manrope-latin-500-normal.woff")),
  ]);
  const c = natinails.colores;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: c.fondo,
          color: c.texto,
          fontFamily: "Manrope",
          padding: "0 90px",
          position: "relative",
        }}
      >
        {/* Brillo abstracto de esmalte */}
        <div
          style={{
            position: "absolute",
            right: -160,
            top: -200,
            width: 640,
            height: 640,
            borderRadius: 9999,
            background: `radial-gradient(circle at 40% 40%, ${c.acento}99, ${c.fondo}00 65%)`,
          }}
        />
        <svg width="300" height="300" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="49" fill="#ffffff" />
          <path d={NN_PATH} fill="#0e0e0f" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 70 }}>
          <div style={{ fontSize: 22, letterSpacing: 8, color: c.textoSuave }}>NATI NAILS | ARTIST</div>
          <div style={{ fontFamily: "Syne", fontSize: 96, lineHeight: 1, marginTop: 18, display: "flex" }}>
            Nati Nails 2.0
          </div>
          <div style={{ fontSize: 40, marginTop: 26 }}>Reservá tu turno online</div>
          <div style={{ display: "flex", marginTop: 34 }}>
            <div
              style={{
                display: "flex",
                background: c.acento,
                color: c.textoSobreAcento,
                fontSize: 28,
                padding: "14px 30px",
                borderRadius: 9999,
              }}
            >
              Sede · Servicio · Horario
            </div>
          </div>
          <div style={{ fontSize: 24, marginTop: 28, color: c.textoSuave }}>
            San Martín 2135 · Marcos Paz 717 · Heller 175
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Syne", data: syne, weight: 700, style: "normal" },
        { name: "Manrope", data: manrope, weight: 500, style: "normal" },
      ],
    },
  );
}
