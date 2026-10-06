import { eligibleProfesionales, getAvailableSlots } from "../slots";
import { addDaysLocal, timeToMinutes, toLocalDate, toZonedIso, weekdayOf, zonedDateTime } from "../time";
import { ANY_PROFESIONAL, type Block, type Booking, type TenantTurnosConfig } from "../types";
import type { SeedData } from "../repositories/booking";

const NAMES = [
  "Lucía Fernández", "Martín Gómez", "Valentina Ruiz", "Santiago López", "Camila Herrera",
  "Joaquín Medina", "Agustina Sosa", "Tomás Romero", "Florencia Paz", "Benjamín Díaz",
  "Micaela Torres", "Facundo Acosta", "Julieta Ledesma", "Lautaro Navarro", "Rocío Juárez",
  "Ignacio Castro", "Milagros Ibáñez", "Franco Aguirre",
];

/** PRNG determinístico (mulberry32): la misma semilla da los mismos datos. */
function createRandom(seedText: string): () => number {
  let seed = 0;
  for (const ch of seedText) seed = (Math.imul(31, seed) + ch.charCodeAt(0)) | 0;
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(random: () => number, items: T[]): T {
  return items[Math.floor(random() * items.length)];
}

function shuffle<T>(random: () => number, items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Reparte la carga: el profesional libre con menos turnos ese día. */
function leastBusy(ids: string[], bookings: Booking[], date: string): string {
  const count = (id: string) => bookings.filter((b) => b.profesionalId === id && toLocalDate(b.start) === date).length;
  return [...ids].sort((a, b) => count(a) - count(b))[0];
}

function isOpen(config: TenantTurnosConfig, date: string): boolean {
  return config.sedes.some((s) => s.hours[weekdayOf(date)] !== null);
}

/**
 * Datos de ejemplo: entre 8 y 15 turnos repartidos entre hoy y los próximos días,
 * más un bloqueo de almuerzo, para que el panel nunca esté vacío.
 */
export function generateSeedData(config: TenantTurnosConfig, now: Date = new Date()): SeedData {
  const today = toLocalDate(now);
  const random = createRandom(`${config.slug}:${today}`);
  const target = 8 + Math.floor(random() * 8); // 8 a 15
  const bookings: Booking[] = [];
  const blocks: Block[] = [];

  // Días abiertos desde hoy (máximo 6), con más peso para el primero.
  const days: string[] = [];
  for (let i = 0; days.length < 6 && i < 21; i++) {
    const d = addDaysLocal(today, i);
    if (isOpen(config, d)) days.push(d);
  }
  if (days.length === 0) return { bookings, blocks };

  const firstDay = days[0];
  const perDay = new Map<string, number>();
  perDay.set(firstDay, Math.min(target, Math.ceil(target * 0.55)));
  let remaining = target - (perDay.get(firstDay) ?? 0);
  for (let i = 1; remaining > 0 && days.length > 1; i = (i % (days.length - 1)) + 1) {
    perDay.set(days[i], (perDay.get(days[i]) ?? 0) + 1);
    remaining--;
  }

  // Bloqueo de almuerzo para el primer profesional en el primer día.
  const firstSede = config.sedes.find((s) => s.hours[weekdayOf(firstDay)]);
  const lunchPro = config.profesionales.find((p) => firstSede && p.sedeIds.includes(firstSede.id));
  const hours = firstSede?.hours[weekdayOf(firstDay)];
  if (lunchPro && hours && timeToMinutes(hours.open) <= 13 * 60 && timeToMinutes(hours.close) >= 14 * 60) {
    blocks.push({
      id: "seed_bl_1",
      tenantSlug: config.slug,
      profesionalId: lunchPro.id,
      start: toZonedIso(zonedDateTime(firstDay, "13:00")),
      end: toZonedIso(zonedDateTime(firstDay, "14:00")),
      reason: "Almuerzo",
    });
  }

  const names = shuffle(random, NAMES);
  let n = 0;
  let cancelledOne = false;
  for (const [date, count] of perDay) {
    const dayStart = zonedDateTime(date, "00:00");
    for (let k = 0, attempts = 0; k < count && attempts < count * 6; attempts++) {
      const sede = pick(random, config.sedes.filter((s) => s.hours[weekdayOf(date)]));
      const servicios = config.servicios.filter(
        (sv) => eligibleProfesionales(config.profesionales, sede.id, sv.id).length > 0,
      );
      if (servicios.length === 0) continue;
      const servicio = pick(random, servicios);
      const slots = getAvailableSlots({
        date,
        sede,
        servicio,
        profesionales: config.profesionales,
        profesionalId: ANY_PROFESIONAL,
        bookings,
        blocks,
        slotStepMin: Math.max(config.slotStepMin, 30),
        now: dayStart,
        minLeadMin: 0,
      });
      if (slots.length === 0) continue;
      // Se reparten a lo largo del día (mañana y tarde) en vez de elegir al azar puro.
      const position = (k + 0.2 + random() * 0.6) / count;
      const slot = slots[Math.min(slots.length - 1, Math.floor(position * slots.length))];
      const end = new Date(slot.end);
      let status: Booking["status"] = end < now ? "done" : "confirmed";
      if (!cancelledOne && status === "confirmed" && random() < 0.25) {
        status = "cancelled";
        cancelledOne = true;
      }
      n++;
      bookings.push({
        id: `seed_bk_${n}`,
        tenantSlug: config.slug,
        servicioId: servicio.id,
        sedeId: sede.id,
        profesionalId: leastBusy(slot.profesionalIds, bookings, date),
        start: slot.start,
        end: slot.end,
        customerName: names[(n - 1) % names.length],
        customerPhone: `549381555${String(1000 + Math.floor(random() * 9000))}`,
        status,
        createdAt: new Date(now.getTime() - (n + 2) * 3_600_000).toISOString(),
      });
      k++;
    }
  }

  bookings.sort((a, b) => a.start.localeCompare(b.start));
  return { bookings, blocks };
}
