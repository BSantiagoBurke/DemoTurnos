import { describe, expect, it } from "vitest";
import { validateTenant } from "./tenant-schema";

const base = {
  slug: "test",
  type: "turnos",
  name: "Test",
  logo: "/tenants/test/logo.svg",
  colors: { primary: "#000000", accent: "#ffffff" },
  whatsapp: "5493811234567",
  adminPin: "1234",
  slotStepMin: 15,
  bookingWindowDays: 14,
  sedes: [{ id: "a", name: "A", address: "x", hours: { 0: null, 1: null, 2: null, 3: null, 4: null, 5: null, 6: { open: "09:00", close: "13:00" } } }],
  profesionales: [{ id: "p", name: "P", sedeIds: ["a"], servicioIds: ["s"] }],
  servicios: [{ id: "s", name: "S", durationMin: 30, price: 1000 }],
};

describe("validateTenant", () => {
  it("acepta un tenant válido", () => {
    expect(validateTenant(base).ok).toBe(true);
  });

  it("indica qué campo falla", () => {
    const result = validateTenant({
      ...base,
      colors: { primary: "rojo", accent: "#fff" },
      profesionales: [{ id: "p", name: "P", sedeIds: ["no-existe"], servicioIds: ["s"] }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.startsWith("colors.primary:"))).toBe(true);
      expect(result.errors).toContain('profesionales.0.sedeIds.0: La sede "no-existe" no existe');
    }
  });

  it("rechaza un horario con cierre antes de la apertura", () => {
    const sedes = [{ ...base.sedes[0], hours: { ...base.sedes[0].hours, 6: { open: "13:00", close: "09:00" } } }];
    const result = validateTenant({ ...base, sedes });
    expect(result.ok).toBe(false);
  });

  it("valida que el slug coincida con el nombre del archivo", () => {
    const result = validateTenant(base, "otro");
    expect(result.ok).toBe(false);
  });
});
