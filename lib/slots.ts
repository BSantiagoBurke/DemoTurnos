import { minutesToTime, timeToMinutes, toZonedIso, weekdayOf, zonedDateTime, type LocalDate } from "./time";
import {
  ANY_PROFESIONAL,
  type Block,
  type Booking,
  type Profesional,
  type ProfesionalChoice,
  type Sede,
  type Servicio,
} from "./types";

export const DEFAULT_MIN_LEAD_MIN = 30;

export type Slot = {
  /** "HH:mm" local, para mostrar. */
  time: string;
  start: string; // ISO con offset
  end: string;
  /** Profesionales libres en este slot, en el orden de la config. */
  profesionalIds: string[];
};

export type SlotQuery = {
  date: LocalDate;
  sede: Sede;
  servicio: Servicio;
  /** Todos los profesionales del negocio. */
  profesionales: Profesional[];
  profesionalId: ProfesionalChoice;
  bookings: Booking[];
  blocks: Block[];
  slotStepMin: number;
  now: Date;
  minLeadMin?: number;
};

type Interval = { start: number; end: number };

function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

/** Profesionales que hacen el servicio en la sede. */
export function eligibleProfesionales(
  profesionales: Profesional[],
  sedeId: string,
  servicioId: string,
): Profesional[] {
  return profesionales.filter((p) => p.sedeIds.includes(sedeId) && p.servicioIds.includes(servicioId));
}

/** Intervalos ocupados por profesional (turnos activos y bloqueos, en cualquier sede). */
function busyByProfesional(bookings: Booking[], blocks: Block[]): Map<string, Interval[]> {
  const busy = new Map<string, Interval[]>();
  const push = (id: string, start: string, end: string) => {
    const list = busy.get(id) ?? [];
    list.push({ start: Date.parse(start), end: Date.parse(end) });
    busy.set(id, list);
  };
  for (const b of bookings) {
    if (b.status === "confirmed" || b.status === "done") push(b.profesionalId, b.start, b.end);
  }
  for (const bl of blocks) push(bl.profesionalId, bl.start, bl.end);
  return busy;
}

/**
 * Horarios libres para una fecha, sede, servicio y profesional (o "cualquiera").
 * Función pura: no lee el reloj ni el storage, todo entra por parámetro.
 */
export function getAvailableSlots(query: SlotQuery): Slot[] {
  const { date, sede, servicio, slotStepMin, now } = query;
  const minLeadMin = query.minLeadMin ?? DEFAULT_MIN_LEAD_MIN;

  const hours = sede.hours[weekdayOf(date)];
  if (!hours) return [];

  const eligible = eligibleProfesionales(query.profesionales, sede.id, servicio.id);
  const candidates =
    query.profesionalId === ANY_PROFESIONAL
      ? eligible
      : eligible.filter((p) => p.id === query.profesionalId);
  if (candidates.length === 0) return [];

  const busy = busyByProfesional(query.bookings, query.blocks);
  const earliest = now.getTime() + minLeadMin * 60_000;

  const open = timeToMinutes(hours.open);
  const lastStart = timeToMinutes(hours.close) - servicio.durationMin;
  const slots: Slot[] = [];

  for (let m = open; m <= lastStart; m += slotStepMin) {
    const time = minutesToTime(m);
    const startDate = zonedDateTime(date, time);
    const interval: Interval = {
      start: startDate.getTime(),
      end: startDate.getTime() + servicio.durationMin * 60_000,
    };
    if (interval.start < earliest) continue;

    const free = candidates
      .filter((p) => !(busy.get(p.id) ?? []).some((b) => overlaps(interval, b)))
      .map((p) => p.id);
    if (free.length === 0) continue;

    slots.push({
      time,
      start: toZonedIso(startDate),
      end: toZonedIso(new Date(interval.end)),
      profesionalIds: free,
    });
  }
  return slots;
}

/** Profesional asignado al confirmar: el elegido o el primero libre. */
export function assignProfesional(slot: Slot, choice: ProfesionalChoice): string | null {
  if (choice === ANY_PROFESIONAL) return slot.profesionalIds[0] ?? null;
  return slot.profesionalIds.includes(choice) ? choice : null;
}
