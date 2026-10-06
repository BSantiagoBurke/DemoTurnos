import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { slotsForDate } from "./availability";
import { confirmBooking } from "./booking-service";
import { LocalStorageBookingRepository } from "./repositories/booking";
import { createMemoryStore } from "./repositories/storage";
import { validateTenant } from "./tenant-schema";
import { zonedDateTime } from "./time";
import { ANY_PROFESIONAL, type TenantTurnosConfig } from "./types";

const raw = JSON.parse(fs.readFileSync(path.join(__dirname, "../tenants/barberia-demo.json"), "utf8"));
const result = validateTenant(raw);
if (!result.ok) throw new Error("tenant inválido");
const config: TenantTurnosConfig = result.config;

const now = zonedDateTime("2026-10-05", "10:00");
const input = { config, servicioId: "corte", sedeId: "centro", profesionalId: ANY_PROFESIONAL, now } as const;

function emptyRepo() {
  return new LocalStorageBookingRepository("barberia-demo", () => ({ bookings: [], blocks: [] }), createMemoryStore());
}

describe("confirmBooking", () => {
  it("crea el turno y asigna el primer profesional libre", async () => {
    const repo = emptyRepo();
    const [slot] = slotsForDate({ ...input, bookings: [], blocks: [] }, "2026-10-07");
    const r = await confirmBooking(repo, input, slot.start, { name: " Ana ", phone: "5493811234567" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.booking.profesionalId).toBe("nico");
      expect(r.booking.customerName).toBe("Ana");
      expect(r.booking.status).toBe("confirmed");
    }
  });

  it("con 'cualquiera' el segundo turno al mismo horario va a otro profesional, y nunca se superpone", async () => {
    const repo = emptyRepo();
    const [slot] = slotsForDate({ ...input, bookings: [], blocks: [] }, "2026-10-07");
    const pros = new Set<string>();
    // Corte en Centro lo hacen Nico, Facu y Juli: el cuarto intento tiene que fallar.
    for (let i = 0; i < 3; i++) {
      const r = await confirmBooking(repo, input, slot.start, { name: `C${i}`, phone: "5493811234567" });
      expect(r.ok).toBe(true);
      if (r.ok) pros.add(r.booking.profesionalId);
    }
    expect(pros.size).toBe(3);
    const r4 = await confirmBooking(repo, input, slot.start, { name: "C4", phone: "5493811234567" });
    expect(r4).toEqual({ ok: false, reason: "slot_taken" });
  });

  it("cancelar un turno libera el horario y el reinicio vuelve a la semilla", async () => {
    const repo = emptyRepo();
    const nico = { ...input, profesionalId: "nico" };
    const [slot] = slotsForDate({ ...nico, bookings: [], blocks: [] }, "2026-10-07");
    const r = await confirmBooking(repo, nico, slot.start, { name: "A", phone: "5493811234567" });
    if (!r.ok) throw new Error("no se creó");
    expect((await confirmBooking(repo, nico, slot.start, { name: "B", phone: "5493811234567" })).ok).toBe(false);
    await repo.updateStatus(r.booking.id, "cancelled");
    expect((await confirmBooking(repo, nico, slot.start, { name: "B", phone: "5493811234567" })).ok).toBe(true);
    await repo.reset();
    expect(await repo.list()).toEqual([]);
  });
});
