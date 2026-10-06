import { addDays, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import type { Weekday } from "./types";

export const TIME_ZONE = "America/Argentina/Tucuman";

/** Fecha calendario local, formato "yyyy-MM-dd". */
export type LocalDate = string;

/** "HH:mm" a minutos desde la medianoche. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Minutos desde la medianoche a "HH:mm". */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Instante absoluto para una fecha y hora en la zona del negocio. */
export function zonedDateTime(date: LocalDate, time: string): Date {
  return fromZonedTime(`${date}T${time}:00`, TIME_ZONE);
}

/** ISO con offset de la zona del negocio, ej. 2026-10-06T10:30:00-03:00. */
export function toZonedIso(date: Date): string {
  return formatInTimeZone(date, TIME_ZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

/** Fecha local (en la zona del negocio) de un instante. */
export function toLocalDate(date: Date | string): LocalDate {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatInTimeZone(d, TIME_ZONE, "yyyy-MM-dd");
}

/** "HH:mm" local de un instante. */
export function toLocalTime(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatInTimeZone(d, TIME_ZONE, "HH:mm");
}

export function addDaysLocal(date: LocalDate, days: number): LocalDate {
  // Se usa mediodía UTC para que el cambio de día no dependa de la zona del navegador.
  const base = new Date(`${date}T12:00:00Z`);
  return addDays(base, days).toISOString().slice(0, 10);
}

export function weekdayOf(date: LocalDate): Weekday {
  return new Date(`${date}T12:00:00Z`).getUTCDay() as Weekday;
}

/** Lunes de la semana de la fecha dada. */
export function startOfWeekLocal(date: LocalDate): LocalDate {
  const wd = weekdayOf(date);
  const diff = wd === 0 ? -6 : 1 - wd;
  return addDaysLocal(date, diff);
}

function asCalendarDate(date: LocalDate): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}

/** Formato de fecha en español, independiente de la zona del navegador. */
export function formatLocalDate(date: LocalDate, pattern: string): string {
  return format(asCalendarDate(date), pattern, { locale: es });
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "Martes 6 de octubre" */
export function formatLongDate(date: LocalDate): string {
  return capitalize(formatLocalDate(date, "EEEE d 'de' MMMM"));
}

export function minutesBetween(start: string, end: string): number {
  return Math.round((parseISO(end).getTime() - parseISO(start).getTime()) / 60000);
}

export const WEEKDAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const;
