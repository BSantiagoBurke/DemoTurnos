import { beforeEach, describe, expect, it } from "vitest";
import { natinails } from "../../demos/natinails";
import { createMemoryStore, type KeyValueStore } from "../repositories/storage";
import { busyIntervals, checkSlot, seedBookings } from "./agenda";
import { LocalStorageStudioRepository, SlotTakenError, studioStorageKeys, type NewStudioBooking } from "./repository";

// 2026-10-16 es viernes (8 a 21:30).
const clockAt = (today: string, nowMin = 9 * 60) => () => ({ today, nowMin, iso: `${today}T12:00:00.000Z` });

/** Repositorio sin turnos de ejemplo, para probar reglas con una agenda limpia. */
function emptyRepo(store: KeyValueStore = createMemoryStore(), today = "2026-10-16") {
  const keys = studioStorageKeys(natinails.slug);
  store.set(keys.seededOn, today);
  store.set(keys.bookings, "[]");
  return new LocalStorageStudioRepository(natinails, clockAt(today), store);
}

const turno = (over: Partial<NewStudioBooking> = {}): NewStudioBooking => ({
  sedeId: "heller",
  servicioId: "kapping",
  extraIds: [],
  date: "2026-10-16",
  time: "10:00",
  durationMin: 75,
  nombre: "Sofía",
  telefono: "5493815551234",
  ...over,
});

describe("repositorio estudio", () => {
  let repo: LocalStorageStudioRepository;
  beforeEach(() => {
    repo = emptyRepo();
  });

  it("guarda la reserva como confirmada y de origen web", async () => {
    const b = await repo.create(turno());
    expect(b.status).toBe("confirmado");
    expect(b.origen).toBe("web");
    expect(await repo.list()).toHaveLength(1);
  });

  it("no permite dos turnos superpuestos en la misma sede", async () => {
    await repo.create(turno({ time: "10:00", durationMin: 75 })); // 10:00 a 11:15
    await expect(repo.create(turno({ time: "11:00", durationMin: 60 }))).rejects.toBeInstanceOf(SlotTakenError);
    await expect(repo.create(turno({ time: "09:00", durationMin: 75 }))).rejects.toBeInstanceOf(SlotTakenError);
  });

  it("el mismo horario en otra sede sí se puede", async () => {
    await repo.create(turno({ sedeId: "heller" }));
    await expect(repo.create(turno({ sedeId: "san-martin" }))).resolves.toMatchObject({ sedeId: "san-martin" });
  });

  it("turnos pegados (uno termina cuando empieza el otro) entran", async () => {
    await repo.create(turno({ time: "10:00", durationMin: 60 }));
    await expect(repo.create(turno({ time: "11:00", durationMin: 60 }))).resolves.toBeDefined();
  });

  it("cancelar libera el horario", async () => {
    const b = await repo.create(turno());
    await repo.updateStatus(b.id, "cancelado");
    await expect(repo.create(turno())).resolves.toBeDefined();
  });

  it("no se puede reactivar un cancelado si su horario ya se ocupó", async () => {
    const b = await repo.create(turno());
    await repo.updateStatus(b.id, "cancelado");
    await repo.create(turno({ nombre: "Otra" }));
    await expect(repo.updateStatus(b.id, "confirmado")).rejects.toBeInstanceOf(SlotTakenError);
  });

  it("un bloqueo impide reservar en ese rango y al quitarlo se libera", async () => {
    const block = await repo.createBlock({ sedeId: "heller", date: "2026-10-16", start: "13:00", end: "14:00", motivo: "Almuerzo" });
    await expect(repo.create(turno({ time: "12:30", durationMin: 60 }))).rejects.toBeInstanceOf(SlotTakenError);
    await repo.deleteBlock(block.id);
    await expect(repo.create(turno({ time: "12:30", durationMin: 60 }))).resolves.toBeDefined();
  });

  it("rechaza turnos fuera del horario o en días cerrados", async () => {
    await expect(repo.create(turno({ time: "21:00", durationMin: 60 }))).rejects.toBeInstanceOf(SlotTakenError);
    await expect(repo.create(turno({ date: "2026-10-18" }))).rejects.toBeInstanceOf(SlotTakenError); // domingo
  });
});

describe("turnos de ejemplo", () => {
  it("se generan la primera vez y coinciden con los ocupados de la agenda", async () => {
    const repo = new LocalStorageStudioRepository(natinails, clockAt("2026-10-16"), createMemoryStore());
    const list = await repo.list();
    expect(list.length).toBeGreaterThan(10);
    expect(list.every((b) => b.origen === "ejemplo")).toBe(true);
    expect(new Set(list.map((b) => b.sedeId)).size).toBe(3);
  });

  it("al día siguiente se regeneran pero se conservan las reservas web", async () => {
    const store = createMemoryStore();
    const day1 = new LocalStorageStudioRepository(natinails, clockAt("2026-10-16"), store);
    const all = await day1.list();
    // Un horario libre seguro: buscamos uno sin ocupados en Heller el lunes 19.
    const busy = busyIntervals(all, [], "heller", "2026-10-19");
    let time = "08:00";
    for (let m = 8 * 60; m < 20 * 60; m += 30) {
      if (!busy.some((b) => m < b.end && b.start < m + 60)) {
        time = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
        break;
      }
    }
    const web = await day1.create(turno({ date: "2026-10-19", time, durationMin: 60 }));

    const day2 = new LocalStorageStudioRepository(natinails, clockAt("2026-10-17"), store);
    const list = await day2.list();
    expect(list.find((b) => b.id === web.id)).toBeDefined();
    expect(list.filter((b) => b.origen === "ejemplo").every((b) => b.date >= "2026-10-17")).toBe(true);
  });

  it("los de hoy que ya terminaron figuran como atendidos", () => {
    const seed = seedBookings(natinails, "2026-10-16", 23 * 60, 1);
    expect(seed.length).toBeGreaterThan(0);
    expect(seed.every((b) => b.status === "atendido")).toBe(true);
  });

  it("checkSlot respeta horarios ocupados de ejemplo", () => {
    const seed = seedBookings(natinails, "2026-10-16", 0, 1);
    const b = seed[0];
    expect(checkSlot(natinails, seed, [], { sedeId: b.sedeId, date: b.date, time: b.time, durationMin: 30 })).toEqual({
      ok: false,
      reason: "ocupado",
    });
  });
});
