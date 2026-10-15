import { addDaysLocal, timeToMinutes, weekdayOf, type LocalDate } from "../time";
import type { Interval } from "./booking";
import { exampleBusy } from "./busy";
import type { StudioBlock, StudioBooking, StudioDemoConfig, StudioSede, StudioServicio } from "./types";

/** Turnos que ocupan lugar en la agenda (los cancelados liberan el horario). */
export const isActive = (b: StudioBooking) => b.status !== "cancelado";

export function bookingInterval(b: Pick<StudioBooking, "time" | "durationMin">): Interval {
  const start = timeToMinutes(b.time);
  return { start, end: start + b.durationMin };
}

/**
 * Horarios ocupados de una sede en un día: turnos activos + bloqueos.
 * Con `profesionalId`, solo los de ese profesional y los bloqueos de toda la sede.
 */
export function busyIntervals(
  bookings: StudioBooking[],
  blocks: StudioBlock[],
  sedeId: string,
  date: LocalDate,
  profesionalId?: string,
): Interval[] {
  const mine = (x: { profesionalId?: string }) => profesionalId === undefined || x.profesionalId === profesionalId;
  const blockApplies = (x: { profesionalId?: string }) =>
    profesionalId === undefined || x.profesionalId === undefined || x.profesionalId === profesionalId;
  return [
    ...bookings.filter((b) => isActive(b) && b.sedeId === sedeId && b.date === date && mine(b)).map(bookingInterval),
    ...blocks
      .filter((b) => b.sedeId === sedeId && b.date === date && blockApplies(b))
      .map((b) => ({ start: timeToMinutes(b.start), end: timeToMinutes(b.end) })),
  ].sort((a, b) => a.start - b.start);
}

export type SlotCheck =
  | { ok: true }
  | { ok: false; reason: "cerrado" | "fuera-de-horario" | "ocupado" | "sin-profesional" };

export type SlotInput = { sedeId: string; profesionalId?: string; date: LocalDate; time: string; durationMin: number };

/** ¿Entra un turno de `durationMin` que empieza a `time` en esa sede (y profesional) y día? */
export function checkSlot(
  config: StudioDemoConfig,
  bookings: StudioBooking[],
  blocks: StudioBlock[],
  input: SlotInput,
): SlotCheck {
  const sede = config.sedes.find((s) => s.id === input.sedeId);
  const hours = sede?.horarios[weekdayOf(input.date)];
  if (!sede || !hours) return { ok: false, reason: "cerrado" };
  if (config.profesionales?.length && !config.profesionales.some((p) => p.id === input.profesionalId)) {
    return { ok: false, reason: "sin-profesional" };
  }
  const start = timeToMinutes(input.time);
  const end = start + input.durationMin;
  if (start < timeToMinutes(hours.open) || end > timeToMinutes(hours.close)) {
    return { ok: false, reason: "fuera-de-horario" };
  }
  const busy = busyIntervals(bookings, blocks, input.sedeId, input.date, input.profesionalId);
  if (busy.some((b) => start < b.end && b.start < end)) return { ok: false, reason: "ocupado" };
  return { ok: true };
}

/** "Sin preferencia": el primer profesional (en el orden de la config) que tiene ese horario libre. */
export function assignProfesional(
  config: StudioDemoConfig,
  bookings: StudioBooking[],
  blocks: StudioBlock[],
  input: Omit<SlotInput, "profesionalId">,
): string | null {
  for (const p of config.profesionales ?? []) {
    if (checkSlot(config, bookings, blocks, { ...input, profesionalId: p.id }).ok) return p.id;
  }
  return null;
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

const NOMBRES_CABALLERO = [
  "Matías Paz", "Nicolás Ruiz", "Joaquín Herrera", "Tomás Sosa", "Facundo Díaz", "Lucas Ledesma", "Ignacio Juárez",
];

/** Para demos con profesionales: un servicio de la config que dure exactamente lo del hueco. */
function servicioDeConfig(config: StudioDemoConfig, minutes: number, pick: number): StudioServicio | undefined {
  const matches = config.categorias.flatMap((c) => c.servicios).filter((s) => s.duracionMin === minutes);
  return matches.length ? matches[pick % matches.length] : undefined;
}

/** Duraciones distintas de los servicios de la config (para generar huecos que coincidan con servicios reales). */
export function duracionesDeServicios(config: StudioDemoConfig): number[] {
  return [...new Set(config.categorias.flatMap((c) => c.servicios.map((s) => s.duracionMin)))].sort((a, b) => a - b);
}

/** Agendas de ejemplo de una sede: una por profesional, o una sola para toda la sede. */
export function exampleAgendas(config: StudioDemoConfig, sede: StudioSede, date: LocalDate) {
  const step = config.reserva.bloqueMin;
  if (!config.profesionales?.length) {
    return [{ profesionalId: undefined, busy: exampleBusy(config.slug, sede, date, step) }];
  }
  const duraciones = duracionesDeServicios(config);
  return config.profesionales.map((p) => ({
    profesionalId: p.id,
    busy: exampleBusy(config.slug, sede, date, step, { profesional: p, duraciones }),
  }));
}

/**
 * Turnos de ejemplo para los próximos días, con nombres inventados (origen "ejemplo").
 * Salen de los mismos ocupados determinísticos que usa la agenda, así el panel y la página coinciden.
 */
export function seedBookings(config: StudioDemoConfig, today: LocalDate, nowMin: number, days: number): StudioBooking[] {
  const out: StudioBooking[] = [];
  const conProfesionales = !!config.profesionales?.length;
  let n = 0;
  for (let i = 0; i < days; i++) {
    const date = addDaysLocal(today, i);
    for (const sede of config.sedes) {
      for (const agenda of exampleAgendas(config, sede, date)) {
        for (const interval of agenda.busy) {
          const durationMin = interval.end - interval.start;
          // Si el servicio no existe en esta config, se usa el primero.
          const fallback = config.categorias[0].servicios[0];
          let servicio: StudioServicio | undefined;
          let extraIds: string[] = [];
          if (conProfesionales) {
            servicio = servicioDeConfig(config, durationMin, n);
          } else {
            const elegido = servicioPara(durationMin, n);
            servicio = config.categorias.flatMap((c) => c.servicios).find((s) => s.id === elegido.servicioId);
            extraIds = elegido.extraIds;
          }
          const servicioId = servicio?.id ?? fallback.id;
          const nombre = servicioId.includes("caballero")
            ? NOMBRES_CABALLERO[n % NOMBRES_CABALLERO.length]
            : NOMBRES[n % NOMBRES.length];
          const hh = String(Math.floor(interval.start / 60)).padStart(2, "0");
          const mm = String(interval.start % 60).padStart(2, "0");
          const pasado = i === 0 && interval.end <= nowMin;
          out.push({
            id: agenda.profesionalId
              ? `ej_${config.slug}_${date}_${sede.id}_${agenda.profesionalId}_${interval.start}`
              : `ej_${config.slug}_${date}_${sede.id}_${interval.start}`,
            slug: config.slug,
            sedeId: sede.id,
            ...(agenda.profesionalId ? { profesionalId: agenda.profesionalId } : {}),
            servicioId,
            extraIds,
            date,
            time: `${hh}:${mm}`,
            durationMin,
            nombre,
            telefono: `549381555${String(1000 + ((n * 7919) % 9000))}`,
            status: pasado ? "atendido" : "confirmado",
            origen: "ejemplo",
            createdAt: new Date(Date.UTC(2026, 0, 1)).toISOString(),
          });
          n++;
        }
      }
    }
  }
  return out;
}

export function sortBookings(list: StudioBooking[]): StudioBooking[] {
  return [...list].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}
