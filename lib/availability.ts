import { getAvailableSlots, type Slot } from "./slots";
import { findSede, findServicio } from "./tenant-lookup";
import { addDaysLocal, toLocalDate, weekdayOf, type LocalDate } from "./time";
import type { Block, Booking, ProfesionalChoice, TenantTurnosConfig } from "./types";

export type AvailabilityInput = {
  config: TenantTurnosConfig;
  servicioId: string;
  sedeId: string;
  profesionalId: ProfesionalChoice;
  bookings: Booking[];
  blocks: Block[];
  now: Date;
};

export function slotsForDate(input: AvailabilityInput, date: LocalDate): Slot[] {
  const sede = findSede(input.config, input.sedeId);
  const servicio = findServicio(input.config, input.servicioId);
  if (!sede || !servicio) return [];
  return getAvailableSlots({
    date,
    sede,
    servicio,
    profesionales: input.config.profesionales,
    profesionalId: input.profesionalId,
    bookings: input.bookings,
    blocks: input.blocks,
    slotStepMin: input.config.slotStepMin,
    now: input.now,
  });
}

export type DayOption = { date: LocalDate; closed: boolean; slots: number };

/** Los próximos `bookingWindowDays` días, con días cerrados y sin lugar marcados. */
export function dayOptions(input: AvailabilityInput): DayOption[] {
  const sede = findSede(input.config, input.sedeId);
  const today = toLocalDate(input.now);
  return Array.from({ length: input.config.bookingWindowDays }, (_, i) => {
    const date = addDaysLocal(today, i);
    const closed = !sede || sede.hours[weekdayOf(date)] === null;
    return { date, closed, slots: closed ? 0 : slotsForDate(input, date).length };
  });
}
