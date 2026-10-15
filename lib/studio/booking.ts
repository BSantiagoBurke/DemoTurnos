import { addDaysLocal, formatLocalDate, minutesToTime, timeToMinutes, weekdayOf, type LocalDate } from "../time";
import type { StudioCategoria, StudioDemoConfig, StudioExtra, StudioSede, StudioServicio } from "./types";

/** Intervalo en minutos desde la medianoche, [inicio, fin). */
export type Interval = { start: number; end: number };

export type StudioFlowStep = "sede" | "servicio" | "extras" | "profesional" | "agenda" | "datos" | "confirmacion" | "listo";

/**
 * Pasos de la reserva según la config: "sede" solo con más de una sede, "extras" solo si hay
 * extras y "profesional" solo si hay profesionales.
 */
export function studioFlow(config: StudioDemoConfig): StudioFlowStep[] {
  return [
    ...(config.sedes.length > 1 ? (["sede"] as const) : []),
    "servicio",
    ...(config.extras.length > 0 ? (["extras"] as const) : []),
    ...(config.profesionales?.length ? (["profesional"] as const) : []),
    "agenda",
    "datos",
    "confirmacion",
    "listo",
  ];
}

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
  input: AgendaInput & {
    days: number;
    busyFor: (date: LocalDate) => Interval[];
    /** Si está, reemplaza el cálculo de horarios del día (ej. "Sin preferencia"). */
    slotsFor?: (date: LocalDate) => Slot[];
  },
): DayOption[] {
  return Array.from({ length: input.days }, (_, i) => {
    const date = addDaysLocal(input.today, i);
    const open = input.sede.horarios[weekdayOf(date)] !== null;
    const slots = input.slotsFor ? input.slotsFor(date) : slotsForDate({ ...input, date, busy: input.busyFor(date) });
    const freeSlots = open ? slots.filter((s) => s.free).length : 0;
    return { date, open, freeSlots };
  });
}

/**
 * "Sin preferencia": unión de los horarios de varios profesionales.
 * Un horario está libre si al menos uno lo tiene libre.
 */
export function mergeSlots(lists: Slot[][]): Slot[] {
  const byTime = new Map<string, boolean>();
  for (const list of lists) for (const s of list) byTime.set(s.time, (byTime.get(s.time) ?? false) || s.free);
  return [...byTime.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([time, free]) => ({ time, free }));
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
  /** Vacío en negocios con una sola sede. */
  sede?: string;
  profesional?: string;
  servicio: string;
  dia: string;
  hora: string;
  nombre: string;
};

export function buildConfirmMessage(i: ConfirmMessageInput): string {
  const donde = i.sede ? ` en la sede ${i.sede}` : "";
  const con = i.profesional ? ` con ${i.profesional}` : "";
  return `Hola! Reservé mi turno por la web${donde}: ${i.servicio}${con} el ${i.dia} a las ${i.hora}. Soy ${i.nombre}.`;
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
