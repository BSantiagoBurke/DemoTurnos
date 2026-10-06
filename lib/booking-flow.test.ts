import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createFlowReducer, initialFlowState, visibleSteps } from "./booking-flow";
import { validateTenant } from "./tenant-schema";
import type { TenantTurnosConfig } from "./types";

const load = (slug: string): TenantTurnosConfig => {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, "../tenants", `${slug}.json`), "utf8"));
  const r = validateTenant(raw);
  if (!r.ok) throw new Error(r.errors.join("\n"));
  return r.config;
};

describe("flujo de reserva", () => {
  it("con una sola sede omite el paso de sede", () => {
    const config = load("estetica-demo");
    const reduce = createFlowReducer(config);
    const s = reduce(initialFlowState, { type: "selectServicio", id: "masaje" });
    expect(s.sedeId).toBe("principal");
    // Masaje lo hace solo Sofía: también se omite el profesional.
    expect(s.profesionalId).toBe("sofia");
    expect(s.step).toBe("fecha");
    expect(visibleSteps(config, s)).toEqual(["servicio", "fecha", "horario", "datos", "confirmacion"]);
  });

  it("con varias sedes pide la sede y después el profesional", () => {
    const config = load("barberia-demo");
    const reduce = createFlowReducer(config);
    let s = reduce(initialFlowState, { type: "selectServicio", id: "corte" });
    expect(s.step).toBe("sede");
    s = reduce(s, { type: "selectSede", id: "centro" });
    expect(s.step).toBe("profesional");
  });

  it("'Atrás' no pierde lo elegido", () => {
    const config = load("barberia-demo");
    const reduce = createFlowReducer(config);
    let s = reduce(initialFlowState, { type: "selectServicio", id: "corte" });
    s = reduce(s, { type: "selectSede", id: "centro" });
    s = reduce(s, { type: "selectProfesional", id: "nico" });
    s = reduce(s, { type: "back" });
    expect(s.step).toBe("profesional");
    expect(s).toMatchObject({ servicioId: "corte", sedeId: "centro", profesionalId: "nico" });
  });

  it("si cambia el servicio y el profesional no lo hace, se limpia la elección", () => {
    const config = load("barberia-demo");
    const reduce = createFlowReducer(config);
    let s = reduce(initialFlowState, { type: "selectServicio", id: "corte" });
    s = reduce(s, { type: "selectSede", id: "centro" });
    s = reduce(s, { type: "selectProfesional", id: "nico" });
    s = reduce(s, { type: "goTo", step: "servicio" });
    s = reduce(s, { type: "selectServicio", id: "color" }); // Nico no hace color
    expect(s.profesionalId).toBeNull();
  });
});
