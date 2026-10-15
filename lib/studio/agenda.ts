import { addDaysLocal, timeToMinutes, weekdayOf, type LocalDate } from "../time";
import type { Interval } from "./booking";
import { exampleBusy } from "./busy";
import type { StudioBlock, StudioBooking, StudioDemoConfig } from "./types";

/** Turnos que ocupan lugar en la agenda (los cancelados liberan el horario). */
export const isActive = (b: StudioBooking) => b.status !== "cancelado";

export function bookingInterval(b: Pick<StudioBooking, "time" | "durationMin">): Interval {
  const start = timeToMinutes(b.time);
  return { start, end: start + b.durationMin };
}

/** Horarios ocupados de una sede en un día: turnos activos + bloqueos. */
export function busyIntervals(
  bookings: StudioBooking[],
  blocks: StudioBlock[],
  sedeId: string,
  date: LocalDate,
): Interval[] {
  return [
    ...bookings.filter((b) => isActive(b) && b.sedeId === sedeId && b.date === date).map(bookingInterval),
    ...blocks
      .filter((b) => b.sedeId === sedeId && b.date === date)
      .map((b) => ({ start: timeToMinutes(b.start), end: timeToMinutes(b.end) })),
  ].sort((a, b) => a.start - b.start);
}

export type SlotCheck =
  | { ok: true }
  | { ok: false; reason: "cerrado" | "fuera-de-horario" | "ocupado" };

/** ¿Entra un turno de `durationMin` que empieza a `time` en esa sede y día? */
export function checkSlot(
  config: StudioDemoConfig,
  bookings: StudioBooking[],
  blocks: StudioBlock[],
  input: { sedeId: string; date: LocalDate; time: string; durationMin: number },
): SlotCheck {
  const sede = config.sedes.find((s) => s.id === input.sedeId);
  const hours = sede?.horarios[weekdayOf(input.date)];
  if (!sede || !hours) return { ok: false, reason: "cerrado" };
  const start = timeToMinutes(input.time);
  const end = start + input.durationMin;
  if (start < timeToMinutes(hours.open) || end > timeToMinutes(hours.close)) {
    return { ok: false, reason: "fuera-de-horario" };
  }
  const busy = busyIntervals(bookings, blocks, input.sedeId, input.date);
  if (busy.some((b) => start < b.end && b.start < end)) return { ok: false, reason: "ocupado" };
  return { ok: true };
}

const NOMBRES = [
  "Sofía Paz", "Valentina Ruiz", "Camila Herrera", "Micaela Torres", "Agustina Sosa", "Florencia Díaz",
  "Julieta Ledesma", "Rocío Juárez", "Milagros Ibáñez", "Lucía Fernández", "Carolina Aguirre", "Belén Romero",
  "Antonella Castro", "Martina Medina", "Paula Navarro", "Daniela Acosta", "Josefina López", "Abril Gómez",
];

/** Servicio de ejemplo según la duración del hueco ocupado. */
function servicioPara(minutes: number, pick: number): { servicioId: string; extraIds: string[] } {
  if (minutes >= 120) return { servicioId: "esculpidas", extraIds: [] };
  if (minutes >= 90) return { servicioId: "service-esculpidas", extraIds: [] };
  if (minutes >= 75) return { servicioId: "kapping", extraIds: [] };
  return pick % 3 === 0 ? { servicioId: "semi-pies", extraIds: [] } : { servicioId: "semi-manos", extraIds: [] };
}

/**
 * Turnos de ejemplo para los próximos días, con nombres inventados (origen "ejemplo").
 * Salen de los mismos ocupados determinísticos que usa la agenda, así el panel y la página coinciden.
 */
export function seedBookings(config: StudioDemoConfig, today: LocalDate, nowMin: number, days: number): StudioBooking[] {
  const out: StudioBooking[] = [];
  let n = 0;
  for (let i = 0; i < days; i++) {
    const date = addDaysLocal(today, i);
    for (const sede of config.sedes) {
      for (const interval of exampleBusy(config.slug, sede, date, config.reserva.bloqueMin)) {
        const durationMin = interval.end - interval.start;
        const { servicioId, extraIds } = servicioPara(durationMin, n);
        const servicio = config.categorias.flatMap((c) => c.servicios).find((s) => s.id === servicioId);
        // Si el servicio no existe en esta config, se usa el primero.
        const fallback = config.categorias[0].servicios[0];
        const hh = String(Math.floor(interval.start / 60)).padStart(2, "0");
        const mm = String(interval.start % 60).padStart(2, "0");
        const pasado = i === 0 && interval.end <= nowMin;
        out.push({
          id: `ej_${config.slug}_${date}_${sede.id}_${interval.start}`,
          slug: config.slug,
          sedeId: sede.id,
          servicioId: servicio?.id ?? fallback.id,
          extraIds,
          date,
          time: `${hh}:${mm}`,
          durationMin,
          nombre: NOMBRES[n % NOMBRES.length],
          telefono: `549381555${String(1000 + ((n * 7919) % 9000))}`,
          status: pasado ? "atendido" : "confirmado",
          origen: "ejemplo",
          createdAt: new Date(Date.UTC(2026, 0, 1)).toISOString(),
        });
        n++;
      }
    }
  }
  return out;
}

export function sortBookings(list: StudioBooking[]): StudioBooking[] {
  return [...list].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}
