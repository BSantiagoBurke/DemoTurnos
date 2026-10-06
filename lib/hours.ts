import { WEEKDAY_SHORT } from "./time";
import type { DayHours, Sede, Weekday } from "./types";

const ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 0]; // lunes primero

function label(h: DayHours): string {
  return h ? `${h.open} a ${h.close}` : "Cerrado";
}

/** Agrupa días consecutivos con el mismo horario: "Lun a Vie: 09:00 a 20:00". */
export function summarizeHours(hours: Sede["hours"]): { days: string; hours: string }[] {
  const groups: { from: Weekday; to: Weekday; value: string }[] = [];
  for (const day of ORDER) {
    const value = label(hours[day]);
    const last = groups.at(-1);
    if (last && last.value === value) last.to = day;
    else groups.push({ from: day, to: day, value });
  }
  return groups.map((g) => ({
    days: g.from === g.to ? WEEKDAY_SHORT[g.from] : `${WEEKDAY_SHORT[g.from]} a ${WEEKDAY_SHORT[g.to]}`,
    hours: g.value,
  }));
}
