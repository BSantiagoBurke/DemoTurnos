import { describe, expect, it } from "vitest";
import { natinails } from "../../demos/natinails";
import { studioDemos } from "../../demos";
import {
  buildConfirmMessage,
  dayOptions,
  extrasFor,
  findServicio,
  formatMessageDate,
  formatMinutes,
  mapsUrl,
  servicioLabel,
  slotsForDate,
  totalDuration,
} from "./booking";
import { exampleBusy } from "./busy";
import { validateStudioDemo } from "./schema";
import type { StudioSede } from "./types";

const sanMartin = natinails.sedes[0];
// 2026-10-15 es jueves (8 a 20:30); 2026-10-17 sábado (8 a 15); 2026-10-18 domingo.
const base = { sede: sanMartin, stepMin: 30, busy: [], today: "2026-10-12", nowMin: 0, leadMin: 60 };

describe("config de demos estudio", () => {
  it.each(studioDemos.map((d) => [d.slug, d] as const))("%s es válida", (_, demo) => {
    const result = validateStudioDemo(demo);
    expect(result.ok ? [] : result.errors).toEqual([]);
  });

  it("detecta contraste insuficiente", () => {
    const bad = { ...natinails, colores: { ...natinails.colores, textoSuave: "#333333" } };
    const result = validateStudioDemo(bad);
    expect(result.ok).toBe(false);
  });

  it("detecta extras con categorías inexistentes", () => {
    const bad = { ...natinails, extras: [{ id: "x", nombre: "X", duracionMin: 10, soloCategorias: ["cejas"] }] };
    expect(validateStudioDemo(bad).ok).toBe(false);
  });

  it("Nati Nails: 3 sedes, Marcos Paz y Heller con horario a confirmar, servicios de ejemplo", () => {
    expect(natinails.sedes.map((s) => s.nombre)).toEqual(["San Martín 2135", "Marcos Paz 717", "Heller 175"]);
    expect(natinails.sedes.filter((s) => s.horarioAConfirmar).map((s) => s.id)).toEqual(["marcos-paz", "heller"]);
    expect(natinails.categorias.flatMap((c) => c.servicios).every((s) => s.ejemplo)).toBe(true);
  });
});

describe("servicios y extras", () => {
  it("French solo aparece con servicios de manos", () => {
    const manos = findServicio(natinails, "kapping");
    const pies = findServicio(natinails, "semi-pies");
    expect(extrasFor(natinails, manos).map((e) => e.id)).toContain("french");
    expect(extrasFor(natinails, pies).map((e) => e.id)).not.toContain("french");
    expect(extrasFor(natinails, pies).map((e) => e.id)).toEqual(["nail-art", "retiro"]);
  });

  it("suma la duración de los extras", () => {
    const kapping = findServicio(natinails, "kapping")!;
    const extras = natinails.extras.filter((e) => e.id === "nail-art" || e.id === "retiro");
    expect(totalDuration(kapping, extras)).toBe(75 + 15 + 20);
    expect(servicioLabel(kapping, extras)).toBe("Kapping en gel + Nail art + Retiro de material");
  });

  it("formatea minutos", () => {
    expect(formatMinutes(45)).toBe("45 min");
    expect(formatMinutes(60)).toBe("1 h");
    expect(formatMinutes(135)).toBe("2 h 15 min");
  });
});

describe("horarios", () => {
  it("bloques de 30 min y el turno completo tiene que terminar antes del cierre", () => {
    const slots = slotsForDate({ ...base, date: "2026-10-17", durationMin: 120 }); // sábado 8 a 15
    expect(slots[0].time).toBe("08:00");
    expect(slots.at(-1)!.time).toBe("13:00");
    expect(slots).toHaveLength(11);
  });

  it("el jueves cierra a las 20:30", () => {
    const slots = slotsForDate({ ...base, date: "2026-10-15", durationMin: 60 });
    expect(slots.at(-1)!.time).toBe("19:30");
  });

  it("domingo cerrado", () => {
    expect(slotsForDate({ ...base, date: "2026-10-18", durationMin: 60 })).toEqual([]);
  });

  it("marca ocupado cualquier inicio que se superponga con un turno tomado", () => {
    const busy = [{ start: 10 * 60, end: 11 * 60 }];
    const slots = slotsForDate({ ...base, date: "2026-10-16", durationMin: 90, busy });
    const state = Object.fromEntries(slots.map((s) => [s.time, s.free]));
    expect(state["08:00"]).toBe(true); // 8:00 a 9:30
    expect(state["08:30"]).toBe(true); // 8:30 a 10:00, termina justo cuando empieza el ocupado
    expect(state["09:00"]).toBe(false); // 9:00 a 10:30
    expect(state["10:30"]).toBe(false);
    expect(state["11:00"]).toBe(true);
  });

  it("hoy no ofrece horarios dentro de la anticipación mínima", () => {
    const slots = slotsForDate({ ...base, today: "2026-10-16", nowMin: 15 * 60 + 10, date: "2026-10-16", durationMin: 60 });
    expect(slots[0].time).toBe("16:30");
  });

  it("14 días desde hoy con los cerrados marcados", () => {
    const days = dayOptions({ ...base, durationMin: 60, days: 14, busyFor: () => [] });
    expect(days).toHaveLength(14);
    expect(days[0].date).toBe("2026-10-12");
    expect(days.find((d) => d.date === "2026-10-18")!.open).toBe(false);
    expect(days.filter((d) => !d.open)).toHaveLength(2);
  });
});

describe("ocupados de ejemplo", () => {
  const date = "2026-10-16";

  it("son determinísticos y caen en bloques de 30 min dentro del horario", () => {
    const a = exampleBusy("natinails", sanMartin, date);
    expect(a).toEqual(exampleBusy("natinails", sanMartin, date));
    expect(a.length).toBeGreaterThan(0);
    for (const b of a) {
      expect(b.start % 30).toBe(0);
      expect(b.start).toBeGreaterThanOrEqual(8 * 60);
      expect(b.end).toBeLessThanOrEqual(21 * 60 + 30);
    }
  });

  it("no se superponen entre sí", () => {
    const busy = exampleBusy("natinails", sanMartin, date);
    for (let i = 1; i < busy.length; i++) expect(busy[i].start).toBeGreaterThanOrEqual(busy[i - 1].end);
  });

  it("cada sede tiene una agenda distinta y siempre quedan horarios libres", () => {
    const agendas = natinails.sedes.map((s: StudioSede) => JSON.stringify(exampleBusy("natinails", s, date)));
    expect(new Set(agendas).size).toBe(3);
    for (const sede of natinails.sedes) {
      const slots = slotsForDate({ ...base, sede, date, durationMin: 60, busy: exampleBusy("natinails", sede, date) });
      expect(slots.some((s) => s.free)).toBe(true);
      expect(slots.some((s) => !s.free)).toBe(true);
    }
  });

  it("día cerrado: sin ocupados", () => {
    expect(exampleBusy("natinails", sanMartin, "2026-10-18")).toEqual([]);
  });
});

describe("mensaje de WhatsApp", () => {
  it("arma el texto pedido, ordenado por sede", () => {
    const text = buildConfirmMessage({
      sede: "Marcos Paz 717",
      servicio: "Kapping en gel + Nail art",
      dia: formatMessageDate("2026-10-16"),
      hora: "10:30",
      nombre: "Sofía",
    });
    expect(text).toBe(
      "Hola! Quiero confirmar mi turno en la sede Marcos Paz 717: Kapping en gel + Nail art el viernes 16/10 a las 10:30. Soy Sofía.",
    );
  });

  it("fecha corta con mes de dos dígitos", () => {
    expect(formatMessageDate("2026-11-02")).toBe("lunes 2/11");
    expect(formatMessageDate("2026-10-05")).toBe("lunes 5/10");
  });

  it("link de Google Maps con la dirección", () => {
    expect(mapsUrl("Heller 175, Yerba Buena, Tucumán")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Heller%20175%2C%20Yerba%20Buena%2C%20Tucum%C3%A1n",
    );
  });
});
