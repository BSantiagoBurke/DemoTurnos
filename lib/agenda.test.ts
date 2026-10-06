import { describe, expect, it } from "vitest";
import { conflictingBookings, dayStats, initialAgendaDate, weekDates } from "./agenda";
import type { Booking, TenantTurnosConfig } from "./types";

const h = { open: "09:00", close: "18:00" };
const config = {
  slug: "t",
  sedes: [{ id: "a", name: "A", address: "x", hours: { 0: null, 1: h, 2: h, 3: h, 4: h, 5: h, 6: null } }],
  servicios: [{ id: "s", name: "S", durationMin: 30, price: 1000 }],
  profesionales: [{ id: "p", name: "P", sedeIds: ["a"], servicioIds: ["s"] }],
} as unknown as TenantTurnosConfig;

const bk = (start: string, end: string, status: Booking["status"] = "confirmed"): Booking => ({
  id: start + status,
  tenantSlug: "t",
  servicioId: "s",
  sedeId: "a",
  profesionalId: "p",
  start,
  end,
  customerName: "X",
  customerPhone: "5493811234567",
  status,
  createdAt: start,
});

describe("agenda", () => {
  it("cuenta turnos, atendidos, cancelados y facturación", () => {
    const list = [
      bk("2026-10-06T10:00:00-03:00", "2026-10-06T10:30:00-03:00", "done"),
      bk("2026-10-06T11:00:00-03:00", "2026-10-06T11:30:00-03:00"),
      bk("2026-10-06T12:00:00-03:00", "2026-10-06T12:30:00-03:00", "cancelled"),
    ];
    expect(dayStats(config, list)).toEqual({ turnos: 2, atendidos: 1, cancelados: 1, facturacion: 2000 });
  });

  it("la semana empieza el lunes", () => {
    expect(weekDates("2026-10-08")[0]).toBe("2026-10-05");
    expect(weekDates("2026-10-11")[6]).toBe("2026-10-11");
  });

  it("si hoy está cerrado y vacío, abre en el próximo día con turnos", () => {
    const list = [bk("2026-10-12T10:00:00-03:00", "2026-10-12T10:30:00-03:00")];
    expect(initialAgendaDate(config, list, "2026-10-11")).toBe("2026-10-12");
    expect(initialAgendaDate(config, list, "2026-10-06")).toBe("2026-10-06");
  });

  it("detecta turnos que chocan con un bloqueo (ignora cancelados)", () => {
    const list = [
      bk("2026-10-06T10:00:00-03:00", "2026-10-06T10:30:00-03:00"),
      bk("2026-10-06T11:00:00-03:00", "2026-10-06T11:30:00-03:00", "cancelled"),
    ];
    expect(conflictingBookings(list, "p", "2026-10-06T10:15:00-03:00", "2026-10-06T11:15:00-03:00")).toHaveLength(1);
  });
});
