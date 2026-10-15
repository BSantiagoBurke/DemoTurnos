import { timeToMinutes, weekdayOf, type LocalDate } from "../time";
import type { Interval } from "./booking";
import type { StudioProfesional, StudioSede } from "./types";

/** PRNG determinístico (mulberry32): misma semilla, mismos datos. */
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

const DURACIONES = [60, 60, 75, 90, 120];

export type ExampleBusyOptions = {
  /** Agenda de un profesional: cambia la semilla y usa su ocupación. */
  profesional?: StudioProfesional;
  /** Duraciones posibles de los turnos de ejemplo (por defecto, las de Nati Nails). */
  duraciones?: number[];
};

/**
 * Turnos ocupados de ejemplo para una sede (o un profesional) y un día. Solo en memoria: se
 * recalculan igual cada vez (la semilla es slug + sede [+ profesional] + fecha), así la clienta
 * ve siempre la misma agenda y cada sede o profesional tiene huecos distintos.
 * Sin profesional, la semilla y el resultado son los mismos de antes (Nati Nails no cambia).
 */
export function exampleBusy(
  slug: string,
  sede: StudioSede,
  date: LocalDate,
  stepMin = 30,
  options: ExampleBusyOptions = {},
): Interval[] {
  const hours = sede.horarios[weekdayOf(date)];
  if (!hours) return [];
  const open = timeToMinutes(hours.open);
  const close = timeToMinutes(hours.close);
  const { profesional } = options;
  const duraciones = options.duraciones?.length ? options.duraciones : DURACIONES;
  const random = createRandom(profesional ? `${slug}:${sede.id}:${profesional.id}:${date}` : `${slug}:${sede.id}:${date}`);
  const ocupacion = profesional ? profesional.ocupacionEjemplo : sede.ocupacionEjemplo;

  // Cuántos minutos del día ocupar, con algo de variación entre días.
  const dayLength = close - open;
  const target = dayLength * Math.min(0.5, Math.max(0, ocupacion * (0.7 + random() * 0.6)));

  const busy: Interval[] = [];
  let used = 0;
  for (let attempt = 0; used < target && attempt < 40; attempt++) {
    const duration = duraciones[Math.floor(random() * duraciones.length)];
    const steps = Math.floor((dayLength - duration) / stepMin);
    if (steps < 0) continue;
    const start = open + Math.floor(random() * (steps + 1)) * stepMin;
    const end = start + duration;
    if (busy.some((b) => start < b.end && b.start < end)) continue;
    busy.push({ start, end });
    used += duration;
  }
  return busy.sort((a, b) => a.start - b.start);
}
