import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/components/ui/cn";
import { findServicio } from "@/lib/tenant-lookup";
import { minutesToTime, timeToMinutes, toLocalTime } from "@/lib/time";
import type { Block, Booking, Profesional, TenantTurnosConfig } from "@/lib/types";
import { STATUS_CARD } from "./status";

const PX_PER_MIN = 1.4;

type Props = {
  config: TenantTurnosConfig;
  profesionales: Profesional[];
  bookings: Booking[];
  blocks: Block[];
  range: { start: number; end: number };
  nowMinutes: number | null;
  onSelectBooking: (b: Booking) => void;
  onSelectBlock: (b: Block) => void;
};

/** Agenda del día en columnas por profesional, con línea de "ahora". Pensada para tablet y escritorio. */
export function DayAgendaGrid({ config, profesionales, bookings, blocks, range, nowMinutes, onSelectBooking, onSelectBlock }: Props) {
  const start = Math.floor(range.start / 60) * 60;
  const end = Math.ceil(range.end / 60) * 60;
  const PAD = 12;
  const height = (end - start) * PX_PER_MIN + PAD * 2;
  const hours = Array.from({ length: (end - start) / 60 + 1 }, (_, i) => start + i * 60);
  const y = (minutes: number) => (minutes - start) * PX_PER_MIN + PAD;
  const top = (iso: string) => y(timeToMinutes(toLocalTime(iso)));

  return (
    <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200">
      <div className="w-full min-w-fit">
        <div className="sticky top-0 z-10 flex border-b border-slate-200 bg-white">
          <div className="w-14 shrink-0" />
          {profesionales.map((p) => (
            <div key={p.id} className="flex min-w-44 flex-1 basis-44 items-center gap-2 border-l border-slate-100 p-3">
              <Avatar name={p.name} className="size-8 text-xs" />
              <span className="truncate font-semibold text-slate-900">{p.name}</span>
            </div>
          ))}
        </div>
        <div className="relative flex" style={{ height }}>
          <div className="relative w-14 shrink-0">
            {hours.map((m) => (
              <span key={m} className="absolute right-2 -translate-y-1/2 text-xs tabular-nums text-slate-500" style={{ top: y(m) }}>
                {minutesToTime(m)}
              </span>
            ))}
          </div>
          {hours.map((m) => (
            <div key={m} aria-hidden className="pointer-events-none absolute left-14 right-0 border-t border-slate-100" style={{ top: y(m) }} />
          ))}
          {nowMinutes !== null && nowMinutes >= start && nowMinutes <= end ? (
            <div aria-hidden className="pointer-events-none absolute left-14 right-0 z-[5] border-t-2 border-red-500" style={{ top: y(nowMinutes) }} />
          ) : null}
          {profesionales.map((p) => (
            <div key={p.id} className="relative min-w-44 flex-1 basis-44 border-l border-slate-100">
              {blocks
                .filter((bl) => bl.profesionalId === p.id)
                .map((bl) => (
                  <button
                    key={bl.id}
                    type="button"
                    onClick={() => onSelectBlock(bl)}
                    className="bg-stripes absolute inset-x-1 overflow-hidden rounded-lg p-1.5 text-left text-xs font-medium text-slate-700 ring-1 ring-slate-300"
                    style={{ top: top(bl.start), height: top(bl.end) - top(bl.start) }}
                  >
                    {bl.reason || "Bloqueado"} · {toLocalTime(bl.start)}
                  </button>
                ))}
              {bookings
                .filter((b) => b.profesionalId === p.id)
                .map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => onSelectBooking(b)}
                    className={cn(
                      "absolute inset-x-1 overflow-hidden rounded-lg border-l-4 p-1.5 text-left text-xs shadow-sm ring-1 ring-slate-200 hover:ring-slate-400",
                      STATUS_CARD[b.status],
                    )}
                    style={{ top: top(b.start), height: Math.max(top(b.end) - top(b.start), 28) }}
                  >
                    <span className={cn("block truncate font-semibold text-slate-900", b.status === "cancelled" && "line-through")}>
                      {toLocalTime(b.start)} {b.customerName}
                    </span>
                    {top(b.end) - top(b.start) >= 36 ? (
                      <span className="block truncate text-slate-600">{findServicio(config, b.servicioId)?.name}</span>
                    ) : null}
                  </button>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
