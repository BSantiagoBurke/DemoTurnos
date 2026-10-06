import { Badge } from "@/components/ui/Badge";
import { cn } from "@/components/ui/cn";
import { bookingsForDate, dayStats, isClosed, type SedeFilter } from "@/lib/agenda";
import { formatPrice } from "@/lib/format";
import { findProfesional, findServicio } from "@/lib/tenant-lookup";
import { formatLongDate, toLocalTime, type LocalDate } from "@/lib/time";
import type { Booking, TenantTurnosConfig } from "@/lib/types";
import { STATUS_LABEL, STATUS_TONE } from "./status";

type Props = {
  config: TenantTurnosConfig;
  dates: LocalDate[];
  today: LocalDate;
  bookings: Booking[];
  sede: SedeFilter;
  onSelectBooking: (b: Booking) => void;
  onSelectDate: (date: LocalDate) => void;
};

export function WeekList({ config, dates, today, bookings, sede, onSelectBooking, onSelectDate }: Props) {
  return (
    <div className="space-y-4">
      {dates.map((date) => {
        const list = bookingsForDate(bookings, date, sede);
        const stats = dayStats(config, list);
        const closed = isClosed(config, date, sede);
        return (
          <section key={date} className="rounded-2xl bg-white ring-1 ring-slate-200">
            <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
              <button type="button" onClick={() => onSelectDate(date)} className="min-h-11 text-left font-semibold text-slate-900 underline-offset-2 hover:underline">
                {formatLongDate(date)}
                {date === today ? <span className="ml-2 text-sm font-normal text-slate-600">(hoy)</span> : null}
              </button>
              <span className="shrink-0 text-sm text-slate-600">
                {closed && list.length === 0 ? "Cerrado" : `${stats.turnos} ${stats.turnos === 1 ? "turno" : "turnos"} · ${formatPrice(stats.facturacion)}`}
              </span>
            </header>
            {list.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {list.map((b) => (
                  <li key={b.id}>
                    <button type="button" onClick={() => onSelectBooking(b)} className="flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50">
                      <span className="w-12 shrink-0 font-semibold tabular-nums text-slate-900">{toLocalTime(b.start)}</span>
                      <span className="min-w-0 flex-1">
                        <span className={cn("block truncate font-medium text-slate-900", b.status === "cancelled" && "line-through")}>{b.customerName}</span>
                        <span className="block truncate text-sm text-slate-600">
                          {findServicio(config, b.servicioId)?.name} · {findProfesional(config, b.profesionalId)?.name}
                        </span>
                      </span>
                      <Badge tone={STATUS_TONE[b.status]}>{STATUS_LABEL[b.status]}</Badge>
                    </button>
                  </li>
                ))}
              </ul>
            ) : !closed ? (
              <p className="px-4 py-3 text-sm text-slate-600">Sin turnos.</p>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
