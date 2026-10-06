import { cn } from "@/components/ui/cn";
import type { Slot } from "@/lib/slots";
import { timeToMinutes } from "@/lib/time";

type Props = { slots: Slot[]; selected: string | null; onSelect: (start: string) => void; onChangeDate: () => void };

const PERIODS = [
  { label: "Mañana", from: 0, to: 12 * 60 },
  { label: "Tarde", from: 12 * 60, to: 19 * 60 },
  { label: "Noche", from: 19 * 60, to: 24 * 60 },
];

export function HorarioStep({ slots, selected, onSelect, onChangeDate }: Props) {
  if (slots.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <p className="text-slate-700">Ya no quedan horarios libres para este día.</p>
        <button type="button" onClick={onChangeDate} className="mt-3 min-h-11 font-semibold text-slate-900 underline">
          Elegir otro día
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-5">
      {PERIODS.map((period) => {
        const group = slots.filter((s) => {
          const m = timeToMinutes(s.time);
          return m >= period.from && m < period.to;
        });
        if (group.length === 0) return null;
        return (
          <section key={period.label} aria-label={period.label}>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">{period.label}</h3>
            <ul className="grid grid-cols-4 gap-2">
              {group.map((s) => (
                <li key={s.start}>
                  <button
                    type="button"
                    onClick={() => onSelect(s.start)}
                    aria-pressed={selected === s.start}
                    className={cn(
                      "min-h-11 w-full rounded-xl border text-base font-semibold transition",
                      selected === s.start
                        ? "border-primary bg-primary text-on-primary"
                        : "border-slate-200 bg-white text-slate-900 hover:border-slate-400",
                    )}
                  >
                    {s.time}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
