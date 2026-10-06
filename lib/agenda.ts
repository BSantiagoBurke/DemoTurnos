import { findServicio } from "./tenant-lookup";
import { addDaysLocal, startOfWeekLocal, timeToMinutes, toLocalDate, weekdayOf, type LocalDate } from "./time";
import type { Block, Booking, Profesional, TenantTurnosConfig } from "./types";

export type SedeFilter = string | "all";

export function bookingsForDate(bookings: Booking[], date: LocalDate, sede: SedeFilter): Booking[] {
  return bookings
    .filter((b) => toLocalDate(b.start) === date && (sede === "all" || b.sedeId === sede))
    .sort((a, b) => a.start.localeCompare(b.start));
}

export function blocksForDate(blocks: Block[], date: LocalDate, profesionalIds: string[]): Block[] {
  return blocks.filter((b) => toLocalDate(b.start) === date && profesionalIds.includes(b.profesionalId));
}

export type DayStats = { turnos: number; atendidos: number; cancelados: number; facturacion: number };

/** Contadores del día. La facturación estimada suma los turnos no cancelados. */
export function dayStats(config: TenantTurnosConfig, bookings: Booking[]): DayStats {
  return bookings.reduce<DayStats>(
    (acc, b) => {
      if (b.status === "cancelled") return { ...acc, cancelados: acc.cancelados + 1 };
      return {
        ...acc,
        turnos: acc.turnos + 1,
        atendidos: acc.atendidos + (b.status === "done" ? 1 : 0),
        facturacion: acc.facturacion + (findServicio(config, b.servicioId)?.price ?? 0),
      };
    },
    { turnos: 0, atendidos: 0, cancelados: 0, facturacion: 0 },
  );
}

export function profesionalesForSede(config: TenantTurnosConfig, sede: SedeFilter): Profesional[] {
  return sede === "all" ? config.profesionales : config.profesionales.filter((p) => p.sedeIds.includes(sede));
}

/** Rango horario a dibujar en la grilla: de la apertura más temprana al cierre más tardío. */
export function dayRange(config: TenantTurnosConfig, date: LocalDate, sede: SedeFilter): { start: number; end: number } | null {
  const hours = config.sedes
    .filter((s) => sede === "all" || s.id === sede)
    .map((s) => s.hours[weekdayOf(date)])
    .filter((h): h is NonNullable<typeof h> => h !== null);
  if (hours.length === 0) return null;
  return {
    start: Math.min(...hours.map((h) => timeToMinutes(h.open))),
    end: Math.max(...hours.map((h) => timeToMinutes(h.close))),
  };
}

export function isClosed(config: TenantTurnosConfig, date: LocalDate, sede: SedeFilter): boolean {
  return dayRange(config, date, sede) === null;
}

export function weekDates(date: LocalDate): LocalDate[] {
  const monday = startOfWeekLocal(date);
  return Array.from({ length: 7 }, (_, i) => addDaysLocal(monday, i));
}

/** Día inicial del panel: hoy, o el próximo día con turnos si hoy está cerrado y vacío. */
export function initialAgendaDate(config: TenantTurnosConfig, bookings: Booking[], today: LocalDate): LocalDate {
  if (!isClosed(config, today, "all") || bookings.some((b) => toLocalDate(b.start) === today)) return today;
  const next = bookings.map((b) => toLocalDate(b.start)).filter((d) => d > today).sort()[0];
  return next ?? today;
}

/** Turnos activos que se superponen con un rango (para validar bloqueos). */
export function conflictingBookings(bookings: Booking[], profesionalId: string, start: string, end: string): Booking[] {
  const s = Date.parse(start);
  const e = Date.parse(end);
  return bookings.filter(
    (b) => b.profesionalId === profesionalId && b.status !== "cancelled" && Date.parse(b.start) < e && s < Date.parse(b.end),
  );
}
