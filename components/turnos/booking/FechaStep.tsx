import { cn } from "@/components/ui/cn";
import type { DayOption } from "@/lib/availability";
import { capitalize, formatLocalDate } from "@/lib/time";

type Props = { days: DayOption[]; today: string; selected: string | null; onSelect: (date: string) => void };

export function FechaStep({ days, today, selected, onSelect }: Props) {
  if (days.every((d) => d.slots === 0)) {
    return <p className="rounded-2xl bg-white p-4 text-slate-700 ring-1 ring-slate-200">No hay horarios disponibles en los próximos días. Probá con otro profesional o servicio.</p>;
  }
  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {days.map((d) => {
        const disabled = d.slots === 0;
        const isToday = d.date === today;
        return (
          <li key={d.date}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelect(d.date)}
              aria-pressed={selected === d.date}
              aria-label={`${capitalize(formatLocalDate(d.date, "EEEE d 'de' MMMM"))}${disabled ? (d.closed ? ", cerrado" : ", sin horarios") : `, ${d.slots} horarios`}`}
              className={cn(
                "flex min-h-20 w-full flex-col items-center justify-center rounded-2xl border bg-white px-1 py-2 text-center transition",
                "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500",
                selected === d.date ? "border-primary ring-2 ring-primary" : "border-slate-200 hover:border-slate-400",
              )}
            >
              <span className="text-xs font-medium uppercase">{isToday ? "Hoy" : formatLocalDate(d.date, "EEE")}</span>
              <span className="text-xl font-bold">{formatLocalDate(d.date, "d")}</span>
              <span className="text-xs">{disabled ? (d.closed ? "Cerrado" : "Completo") : formatLocalDate(d.date, "MMM")}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
