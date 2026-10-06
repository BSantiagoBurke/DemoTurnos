import { describe, expect, it } from "vitest";
import { summarizeHours } from "./hours";

describe("summarizeHours", () => {
  it("agrupa días consecutivos con el mismo horario", () => {
    const h = { open: "09:00", close: "20:00" };
    expect(summarizeHours({ 0: null, 1: h, 2: h, 3: h, 4: h, 5: h, 6: { open: "09:00", close: "14:00" } })).toEqual([
      { days: "Lun a Vie", hours: "09:00 a 20:00" },
      { days: "Sáb", hours: "09:00 a 14:00" },
      { days: "Dom", hours: "Cerrado" },
    ]);
  });
});
