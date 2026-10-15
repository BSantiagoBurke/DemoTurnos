import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { jesus } from "../../demos/jesusestilistas";
import { natinails } from "../../demos/natinails";
import { createMemoryStore } from "../repositories/storage";
import { timeToMinutes, weekdayOf } from "../time";
import { assignProfesional, busyIntervals, checkSlot, duracionesDeServicios, seedBookings } from "./agenda";
import { buildConfirmMessage, mergeSlots, slotsForDate, studioFlow } from "./booking";
import { exampleBusy } from "./busy";
import { LocalStorageStudioRepository, SlotTakenError, studioStorageKeys, type NewStudioBooking } from "./repository";
import { validateStudioDemo } from "./schema";
import type { StudioBlock, StudioBooking } from "./types";

// 2026-10-16 es viernes: Jesús abre de 13 a 21.
const VIERNES = "2026-10-16";
const sede = jesus.sedes[0];
const [e1, e2, e3] = jesus.profesionales!;

const clockAt = (today: string, nowMin = 9 * 60) => () => ({ today, nowMin, iso: `${today}T12:00:00.000Z` });

function emptyRepo() {
  const store = createMemoryStore();
  const keys = studioStorageKeys(jesus.slug);
  store.set(keys.seededOn, VIERNES);
  store.set(keys.bookings, "[]");
  return new LocalStorageStudioRepository(jesus, clockAt(VIERNES), store);
}

const turno = (over: Partial<NewStudioBooking> = {}): NewStudioBooking => ({
  sedeId: "centro",
  servicioId: "corte-dama",
  extraIds: [],
  date: VIERNES,
  time: "15:00",
  durationMin: 45,
  nombre: "Lucía",
  telefono: "5493815551234",
  ...over,
});

const booking = (over: Partial<StudioBooking>): StudioBooking => ({
  ...turno(),
  id: Math.random().toString(36),
  slug: jesus.slug,
  status: "confirmado",
  origen: "web",
  createdAt: "2026-10-16T12:00:00.000Z",
  ...over,
});

describe("Nati Nails no cambia", () => {
  it("mismo flujo de pasos que antes", () => {
    expect(studioFlow(natinails)).toEqual(["sede", "servicio", "extras", "agenda", "datos", "confirmacion", "listo"]);
  });

  it("la agenda de ejemplo es idéntica a la de antes del cambio", () => {
    const json = JSON.stringify(seedBookings(natinails, VIERNES, 842, 14));
    expect(createHash("sha256").update(json).digest("hex")).toBe(
      "968124f31a343aedf9d87e23aadd77d9d85e08aeb284584bbf3de2cb2722f777",
    );
  });

  it("exampleBusy sin opciones da lo mismo que con opciones vacías", () => {
    const s = natinails.sedes[0];
    expect(exampleBusy("natinails", s, VIERNES, 30, {})).toEqual(exampleBusy("natinails", s, VIERNES));
  });

  it("sin profesionales, la agenda bloquea por sede como siempre", () => {
    const res = checkSlot(natinails, [], [], { sedeId: "heller", date: VIERNES, time: "10:00", durationMin: 60 });
    expect(res.ok).toBe(true);
  });
});

describe("config de Jesús Estilistas", () => {
  it("es válida", () => {
    const r = validateStudioDemo(jesus);
    expect(r.ok ? [] : r.errors).toEqual([]);
  });

  it("una sola sede y sin extras: sin pasos de sede ni extras, con paso de estilista", () => {
    expect(studioFlow(jesus)).toEqual(["servicio", "profesional", "agenda", "datos", "confirmacion", "listo"]);
  });

  it("3 estilistas genéricos, sin precios y servicios de ejemplo", () => {
    expect(jesus.profesionales!.map((p) => p.nombre)).toEqual(["Estilista 1", "Estilista 2", "Estilista 3"]);
    expect(jesus.categorias.map((c) => c.nombre)).toEqual(["Corte", "Color", "Tratamientos"]);
    expect(jesus.categorias.flatMap((c) => c.servicios).every((s) => s.ejemplo)).toBe(true);
  });

  it("color completo, balayage y alisado requieren consulta", () => {
    const conConsulta = jesus.categorias.flatMap((c) => c.servicios).filter((s) => s.requiereConsulta).map((s) => s.id);
    expect(conConsulta).toEqual(["color-completo", "balayage", "alisado"]);
  });

  it("falla si hay servicios con consulta y no está la nota", () => {
    const bad = { ...jesus, textos: { ...jesus.textos, notaConsulta: undefined } };
    expect(validateStudioDemo(bad).ok).toBe(false);
  });

  it("horario: lunes a viernes 13 a 21, sábado 9 a 18, domingo cerrado", () => {
    expect(sede.horarios[1]).toEqual({ open: "13:00", close: "21:00" });
    expect(sede.horarios[6]).toEqual({ open: "09:00", close: "18:00" });
    expect(sede.horarios[0]).toBeNull();
  });
});

describe("agenda por estilista", () => {
  it("cada estilista tiene ocupados de ejemplo distintos y determinísticos", () => {
    const duraciones = duracionesDeServicios(jesus);
    const agendas = jesus.profesionales!.map((p) => exampleBusy(jesus.slug, sede, VIERNES, 30, { profesional: p, duraciones }));
    expect(new Set(agendas.map((a) => JSON.stringify(a))).size).toBe(3);
    expect(exampleBusy(jesus.slug, sede, VIERNES, 30, { profesional: e1, duraciones })).toEqual(agendas[0]);
  });

  it("los turnos de ejemplo tienen estilista, un servicio real con esa duración y están dentro del horario", () => {
    const seed = seedBookings(jesus, VIERNES, 0, 14);
    const servicios = jesus.categorias.flatMap((c) => c.servicios);
    expect(seed.length).toBeGreaterThan(0);
    for (const b of seed) {
      expect(jesus.profesionales!.some((p) => p.id === b.profesionalId)).toBe(true);
      expect(servicios.find((s) => s.id === b.servicioId)?.duracionMin).toBe(b.durationMin);
      const h = sede.horarios[weekdayOf(b.date)]!;
      expect(timeToMinutes(b.time)).toBeGreaterThanOrEqual(timeToMinutes(h.open));
      expect(timeToMinutes(b.time) + b.durationMin).toBeLessThanOrEqual(timeToMinutes(h.close));
    }
  });

  it("los turnos de ejemplo de un mismo estilista no se superponen", () => {
    const seed = seedBookings(jesus, VIERNES, 0, 14);
    for (const p of jesus.profesionales!) {
      const day = seed.filter((b) => b.profesionalId === p.id && b.date === VIERNES);
      const ok = day.every((a) =>
        day.every((b) => a === b || timeToMinutes(a.time) + a.durationMin <= timeToMinutes(b.time) || timeToMinutes(b.time) + b.durationMin <= timeToMinutes(a.time)),
      );
      expect(ok).toBe(true);
    }
  });

  it("un turno de un estilista no ocupa a los otros", () => {
    const list = [booking({ profesionalId: e1.id, time: "15:00" })];
    expect(busyIntervals(list, [], "centro", VIERNES, e1.id)).toHaveLength(1);
    expect(busyIntervals(list, [], "centro", VIERNES, e2.id)).toHaveLength(0);
  });

  it("un bloqueo sin estilista bloquea a todo el estudio; con estilista, solo a ese", () => {
    const blocks: StudioBlock[] = [
      { id: "a", slug: jesus.slug, sedeId: "centro", date: VIERNES, start: "13:00", end: "14:00" },
      { id: "b", slug: jesus.slug, sedeId: "centro", profesionalId: e2.id, date: VIERNES, start: "18:00", end: "19:00" },
    ];
    expect(busyIntervals([], blocks, "centro", VIERNES, e1.id)).toHaveLength(1);
    expect(busyIntervals([], blocks, "centro", VIERNES, e2.id)).toHaveLength(2);
  });

  it("en una demo con estilistas, el turno necesita un estilista válido", () => {
    expect(checkSlot(jesus, [], [], { sedeId: "centro", date: VIERNES, time: "15:00", durationMin: 45 })).toEqual({
      ok: false,
      reason: "sin-profesional",
    });
    expect(checkSlot(jesus, [], [], { sedeId: "centro", profesionalId: e3.id, date: VIERNES, time: "15:00", durationMin: 45 }).ok).toBe(true);
  });

  it("no acepta turnos que terminan después del cierre (balayage de 3 h a las 19:00)", () => {
    const r = checkSlot(jesus, [], [], { sedeId: "centro", profesionalId: e1.id, date: VIERNES, time: "19:00", durationMin: 180 });
    expect(r).toEqual({ ok: false, reason: "fuera-de-horario" });
  });
});

describe("Sin preferencia", () => {
  it("unión de huecos: un horario está libre si al menos un estilista lo tiene libre", () => {
    const merged = mergeSlots([
      [
        { time: "13:00", free: false },
        { time: "13:30", free: true },
      ],
      [
        { time: "13:00", free: true },
        { time: "13:30", free: false },
        { time: "14:00", free: false },
      ],
    ]);
    expect(merged).toEqual([
      { time: "13:00", free: true },
      { time: "13:30", free: true },
      { time: "14:00", free: false },
    ]);
  });

  it("con agendas reales, la unión tiene al menos tantos horarios libres como cada estilista", () => {
    const base = { sede, durationMin: 45, stepMin: 30, today: VIERNES, nowMin: 0, leadMin: 60, date: VIERNES };
    const seed = seedBookings(jesus, VIERNES, 0, 1);
    const per = jesus.profesionales!.map((p) => slotsForDate({ ...base, busy: busyIntervals(seed, [], "centro", VIERNES, p.id) }));
    const union = mergeSlots(per).filter((s) => s.free).length;
    for (const list of per) expect(union).toBeGreaterThanOrEqual(list.filter((s) => s.free).length);
  });

  it("asigna al primer estilista con lugar, en el orden de la config", () => {
    const list = [booking({ profesionalId: e1.id, time: "15:00" })];
    const input = { sedeId: "centro", date: VIERNES, time: "15:00", durationMin: 45 };
    expect(assignProfesional(jesus, list, [], input)).toBe(e2.id);
    expect(assignProfesional(jesus, [], [], input)).toBe(e1.id);
  });

  it("el repositorio asigna estilista si no viene y bloquea ese horario solo para él", async () => {
    const repo = emptyRepo();
    const a = await repo.create(turno());
    const b = await repo.create(turno());
    const c = await repo.create(turno());
    expect([a.profesionalId, b.profesionalId, c.profesionalId]).toEqual([e1.id, e2.id, e3.id]);
    await expect(repo.create(turno())).rejects.toBeInstanceOf(SlotTakenError);
  });

  it("con estilista elegido, rechaza si ese estilista ya tiene el horario", async () => {
    const repo = emptyRepo();
    await repo.create(turno({ profesionalId: e2.id }));
    await expect(repo.create(turno({ profesionalId: e2.id, time: "15:30" }))).rejects.toBeInstanceOf(SlotTakenError);
    const otro = await repo.create(turno({ profesionalId: e3.id, time: "15:30" }));
    expect(otro.profesionalId).toBe(e3.id);
  });

  it("cancelar libera el horario del estilista", async () => {
    const repo = emptyRepo();
    const a = await repo.create(turno({ profesionalId: e1.id }));
    await repo.updateStatus(a.id, "cancelado");
    expect((await repo.create(turno({ profesionalId: e1.id }))).profesionalId).toBe(e1.id);
  });
});

describe("mensaje de WhatsApp", () => {
  it("sin sede cuando el negocio tiene una sola", () => {
    expect(
      buildConfirmMessage({ servicio: "Corte dama", profesional: "Estilista 2", dia: "viernes 16/10", hora: "15:00", nombre: "Lucía" }),
    ).toBe("Hola! Reservé mi turno por la web: Corte dama con Estilista 2 el viernes 16/10 a las 15:00. Soy Lucía.");
  });
});
