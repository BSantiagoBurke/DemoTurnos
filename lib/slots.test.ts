import { describe, expect, it } from "vitest";
import { assignProfesional, getAvailableSlots, type SlotQuery } from "./slots";
import { toZonedIso, zonedDateTime } from "./time";
import { ANY_PROFESIONAL, type Block, type Booking, type Profesional, type Sede, type Servicio } from "./types";

// 2026-10-07 es miércoles.
const DATE = "2026-10-07";
const SUNDAY = "2026-10-11";

const sede: Sede = {
  id: "centro",
  name: "Centro",
  address: "Calle 123",
  hours: {
    0: null,
    1: { open: "09:00", close: "12:00" },
    2: { open: "09:00", close: "12:00" },
    3: { open: "09:00", close: "12:00" },
    4: { open: "09:00", close: "12:00" },
    5: { open: "09:00", close: "12:00" },
    6: null,
  },
};

const corte: Servicio = { id: "corte", name: "Corte", durationMin: 30, price: 9000 };
const color: Servicio = { id: "color", name: "Color", durationMin: 60, price: 18000 };

const ana: Profesional = { id: "ana", name: "Ana", sedeIds: ["centro"], servicioIds: ["corte", "color"] };
const beto: Profesional = { id: "beto", name: "Beto", sedeIds: ["centro"], servicioIds: ["corte"] };

const iso = (time: string, date = DATE) => toZonedIso(zonedDateTime(date, time));

function booking(profesionalId: string, start: string, end: string, status: Booking["status"] = "confirmed"): Booking {
  return {
    id: `b-${profesionalId}-${start}`,
    tenantSlug: "test",
    servicioId: "corte",
    sedeId: "centro",
    profesionalId,
    start: iso(start),
    end: iso(end),
    customerName: "Cliente",
    customerPhone: "5493811234567",
    status,
    createdAt: iso("08:00"),
  };
}

function query(overrides: Partial<SlotQuery> = {}): SlotQuery {
  return {
    date: DATE,
    sede,
    servicio: corte,
    profesionales: [ana, beto],
    profesionalId: "ana",
    bookings: [],
    blocks: [],
    slotStepMin: 30,
    now: zonedDateTime("2026-10-01", "10:00"), // una semana antes: no afecta
    ...overrides,
  };
}

const times = (q: SlotQuery) => getAvailableSlots(q).map((s) => s.time);

describe("getAvailableSlots", () => {
  it("genera slots cada slotStepMin entre apertura y cierre - duración", () => {
    expect(times(query())).toEqual(["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"]);
  });

  it("no devuelve slots en un día cerrado", () => {
    expect(times(query({ date: SUNDAY }))).toEqual([]);
  });

  it("no ofrece un servicio que no entra antes del cierre", () => {
    const result = times(query({ servicio: color }));
    expect(result).toEqual(["09:00", "09:30", "10:00", "10:30", "11:00"]);
    expect(result).not.toContain("11:30");
  });

  it("descarta superposiciones parciales con un turno", () => {
    // Turno 10:15 a 10:45: pisa los slots de 10:00 y 10:30.
    const result = times(query({ slotStepMin: 15, bookings: [booking("ana", "10:15", "10:45")] }));
    expect(result).not.toContain("10:00");
    expect(result).not.toContain("10:30");
    expect(result).toContain("09:45"); // termina justo cuando empieza el turno
    expect(result).toContain("10:45"); // empieza justo cuando termina
  });

  it("los turnos cancelados liberan el horario y los atendidos no", () => {
    expect(times(query({ bookings: [booking("ana", "10:00", "10:30", "cancelled")] }))).toContain("10:00");
    expect(times(query({ bookings: [booking("ana", "10:00", "10:30", "done")] }))).not.toContain("10:00");
  });

  it("respeta los bloqueos del profesional", () => {
    const block: Block = { id: "bl", tenantSlug: "test", profesionalId: "ana", start: iso("09:00"), end: iso("10:00") };
    const result = times(query({ blocks: [block] }));
    expect(result).toEqual(["10:00", "10:30", "11:00", "11:30"]);
  });

  it("si es hoy, descarta lo que empieza antes de ahora + 30 minutos", () => {
    const result = times(query({ now: zonedDateTime(DATE, "09:40") }));
    expect(result).toEqual(["10:30", "11:00", "11:30"]);
  });

  it("con 'cualquiera', el slot vale si al menos un profesional está libre", () => {
    const q = query({ profesionalId: ANY_PROFESIONAL, bookings: [booking("ana", "10:00", "10:30")] });
    const slot = getAvailableSlots(q).find((s) => s.time === "10:00");
    expect(slot).toBeDefined();
    expect(slot?.profesionalIds).toEqual(["beto"]);
    expect(assignProfesional(slot!, ANY_PROFESIONAL)).toBe("beto");
  });

  it("con 'cualquiera', el slot desaparece si todos están ocupados", () => {
    const q = query({
      profesionalId: ANY_PROFESIONAL,
      bookings: [booking("ana", "10:00", "10:30"), booking("beto", "10:00", "10:30")],
    });
    expect(times(q)).not.toContain("10:00");
  });

  it("solo considera profesionales que hacen el servicio en esa sede", () => {
    // Beto no hace color: aunque esté libre, con Ana ocupada no hay slot.
    const q = query({
      servicio: color,
      profesionalId: ANY_PROFESIONAL,
      bookings: [booking("ana", "09:00", "10:00")],
    });
    expect(times(q)).toEqual(["10:00", "10:30", "11:00"]);
  });

  it("asigna el primer profesional libre según el orden de la config", () => {
    const slot = getAvailableSlots(query({ profesionalId: ANY_PROFESIONAL }))[0];
    expect(assignProfesional(slot, ANY_PROFESIONAL)).toBe("ana");
    expect(assignProfesional(slot, "beto")).toBe("beto");
  });

  it("devuelve inicio y fin en ISO con offset de Tucumán", () => {
    const [first] = getAvailableSlots(query());
    expect(first.start).toBe("2026-10-07T09:00:00-03:00");
    expect(first.end).toBe("2026-10-07T09:30:00-03:00");
  });
});
