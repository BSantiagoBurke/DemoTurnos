import { addDaysLocal, formatLocalDate, minutesToTime, timeToMinutes, weekdayOf, type LocalDate } from "../time";
import type { StudioCategoria, StudioDemoConfig, StudioExtra, StudioSede, StudioServicio } from "./types";

/** Intervalo en minutos desde la medianoche, [inicio, fin). */
export type Interval = { start: number; end: number };

export type ServicioConCategoria = StudioServicio & { categoria: StudioCategoria };

export function findServicio(config: StudioDemoConfig, id: string | null): ServicioConCategoria | undefined {
  for (const categoria of config.categorias) {
    const servicio = categoria.servicios.find((s) => s.id === id);
    if (servicio) return { ...servicio, categoria };
  }
  return undefined;
}

/** Extras que se pueden sumar al servicio elegido. */
export function extrasFor(config: StudioDemoConfig, servicio: ServicioConCategoria | undefined): StudioExtra[] {
  if (!servicio) return [];
  return config.extras.filter((e) => !e.soloCategorias || e.soloCategorias.includes(servicio.categoria.id));
}

export function totalDuration(servicio: StudioServicio, extras: StudioExtra[]): number {
  return servicio.duracionMin + extras.reduce((sum, e) => sum + e.duracionMin, 0);
}

export type DayOption = {
  date: LocalDate;
  /** Abierto según el horario de la sede. */
  open: boolean;
  /** Cantidad de horarios libres para la duración elegida. */
  freeSlots: number;
};

export type Slot = { time: string; free: boolean };

export type AgendaInput = {
  sede: StudioSede;
  durationMin: number;
  stepMin: number;
  /** Horarios ocupados de ese día. */
  busy: Interval[];
  /** Fecha y minuto actuales en la zona del negocio. */
  today: LocalDate;
  nowMin: number;
  leadMin: number;
};

/**
 * Horarios de inicio del día, en bloques de `stepMin` desde la apertura.
 * Un horario aparece solo si el turno completo termina antes del cierre, y está libre
 * si no se superpone con ningún turno ocupado.
 */
export function slotsForDate(input: AgendaInput & { date: LocalDate }): Slot[] {
  const hours = input.sede.horarios[weekdayOf(input.date)];
  if (!hours) return [];
  const open = timeToMinutes(hours.open);
  const close = timeToMinutes(hours.close);
  const earliest = input.date === input.today ? input.nowMin + input.leadMin : -Infinity;
  if (input.date < input.today) return [];

  const slots: Slot[] = [];
  for (let start = open; start + input.durationMin <= close; start += input.stepMin) {
    if (start < earliest) continue;
    const end = start + input.durationMin;
    const overlaps = input.busy.some((b) => start < b.end && b.start < end);
    slots.push({ time: minutesToTime(start), free: !overlaps });
  }
  return slots;
}

/** Los próximos `days` días (desde hoy) con cuántos horarios libres tiene cada uno. */
export function dayOptions(
  input: AgendaInput & { days: number; busyFor: (date: LocalDate) => Interval[] },
): DayOption[] {
  return Array.from({ length: input.days }, (_, i) => {
    const date = addDaysLocal(input.today, i);
    const open = input.sede.horarios[weekdayOf(date)] !== null;
    const freeSlots = open ? slotsForDate({ ...input, date, busy: input.busyFor(date) }).filter((s) => s.free).length : 0;
    return { date, open, freeSlots };
  });
}

/** "jueves 16/10" */
export function formatMessageDate(date: LocalDate): string {
  return formatLocalDate(date, "EEEE d/MM");
}

/** "Kapping en gel + Nail art + French" */
export function servicioLabel(servicio: StudioServicio, extras: StudioExtra[]): string {
  return [servicio.nombre, ...extras.map((e) => e.nombre)].join(" + ");
}

export type ConfirmMessageInput = {
  sede: string;
  servicio: string;
  dia: string;
  hora: string;
  nombre: string;
};

export function buildConfirmMessage(i: ConfirmMessageInput): string {
  return `Hola! Quiero confirmar mi turno en la sede ${i.sede}: ${i.servicio} el ${i.dia} a las ${i.hora}. Soy ${i.nombre}.`;
}

export function mapsUrl(direccion: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`;
}

/** "1 h 15 min", "45 min", "2 h" */
export function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
