import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validateTenant } from "../tenant-schema";
import { toLocalDate, zonedDateTime } from "../time";
import { generateSeedData } from "./turnos";

const load = (slug: string) => {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, "../../tenants", `${slug}.json`), "utf8"));
  const result = validateTenant(raw, slug);
  if (!result.ok) throw new Error(result.errors.join("\n"));
  return result.config;
};

describe.each(["barberia-demo", "estetica-demo"])("generateSeedData(%s)", (slug) => {
  const config = load(slug);
  // Martes a las 11: día abierto en ambos tenants.
  const now = zonedDateTime("2026-10-06", "11:00");
  const data = generateSeedData(config, now);

  it("genera entre 8 y 15 turnos", () => {
    expect(data.bookings.length).toBeGreaterThanOrEqual(8);
    expect(data.bookings.length).toBeLessThanOrEqual(15);
  });

  it("incluye turnos de hoy", () => {
    expect(data.bookings.some((b) => toLocalDate(b.start) === "2026-10-06")).toBe(true);
  });

  it("no superpone turnos activos del mismo profesional", () => {
    const active = data.bookings.filter((b) => b.status !== "cancelled");
    for (const a of active) {
      for (const b of active) {
        if (a === b || a.profesionalId !== b.profesionalId) continue;
        expect(a.start < b.end && b.start < a.end).toBe(false);
      }
    }
  });

  it("es determinístico para el mismo día", () => {
    expect(generateSeedData(config, now)).toEqual(data);
  });
});
