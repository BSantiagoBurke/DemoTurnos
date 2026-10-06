import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/components/ui/cn";
import { findServicio } from "@/lib/tenant-lookup";
import { toLocalTime } from "@/lib/time";
import type { Block, Booking, BookingStatus, Profesional, TenantTurnosConfig } from "@/lib/types";
import { BookingActions } from "./BookingActions";
import { STATUS_CARD, STATUS_LABEL, STATUS_TONE } from "./status";

type Props = {
  config: TenantTurnosConfig;
  profesionales: Profesional[];
  bookings: Booking[];
  blocks: Block[];
  onSelectBooking: (b: Booking) => void;
  onSelectBlock: (b: Block) => void;
  onChangeStatus: (id: string, status: BookingStatus) => void;
};

type Item = { kind: "booking"; start: string; booking: Booking } | { kind: "block"; start: string; block: Block };

/** Agenda del día en mobile: lista agrupada por profesional, con acciones a mano. */
export function DayAgendaList({ config, profesionales, bookings, blocks, onSelectBooking, onSelectBlock, onChangeStatus }: Props) {
  return (
    <div className="space-y-6">
      {profesionales.map((p) => {
        const items: Item[] = [
          ...bookings.filter((b) => b.profesionalId === p.id).map((b) => ({ kind: "booking" as const, start: b.start, booking: b })),
          ...blocks.filter((b) => b.profesionalId === p.id).map((b) => ({ kind: "block" as const, start: b.start, block: b })),
        ].sort((a, b) => a.start.localeCompare(b.start));
        const active = items.filter((i) => i.kind === "booking" && i.booking.status !== "cancelled").length;
        return (
          <section key={p.id} aria-label={`Agenda de ${p.name}`}>
            <h3 className="mb-2 flex items-center gap-2 font-semibold text-slate-900">
              <Avatar name={p.name} className="size-8 text-xs" />
              {p.name}
              <span className="text-sm font-normal text-slate-600">
                · {active} {active === 1 ? "turno" : "turnos"}
              </span>
            </h3>
            {items.length === 0 ? (
              <p className="rounded-2xl bg-white p-3 text-sm text-slate-600 ring-1 ring-slate-200">Sin turnos.</p>
            ) : (
              <ul className="space-y-2">
                {items.map((item) =>
                  item.kind === "block" ? (
                    <li key={item.block.id}>
                      <button
                        type="button"
                        onClick={() => onSelectBlock(item.block)}
                        className="bg-stripes flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm text-slate-700 ring-1 ring-slate-300"
                      >
                        <span className="font-semibold tabular-nums">
                          {toLocalTime(item.block.start)} a {toLocalTime(item.block.end)}
                        </span>
                        <span>{item.block.reason || "Bloqueado"}</span>
                      </button>
                    </li>
                  ) : (
                    <li key={item.booking.id} className={cn("rounded-2xl border-l-4 p-3 ring-1 ring-slate-200", STATUS_CARD[item.booking.status])}>
                      <button type="button" onClick={() => onSelectBooking(item.booking)} className="block w-full text-left">
                        <span className="flex items-start justify-between gap-2">
                          <span className="font-bold tabular-nums text-slate-900">
                            {toLocalTime(item.booking.start)} a {toLocalTime(item.booking.end)}
                          </span>
                          <Badge tone={STATUS_TONE[item.booking.status]}>{STATUS_LABEL[item.booking.status]}</Badge>
                        </span>
                        <span className={cn("mt-0.5 block font-semibold text-slate-900", item.booking.status === "cancelled" && "line-through")}>
                          {item.booking.customerName}
                        </span>
                        <span className="block text-sm text-slate-600">{findServicio(config, item.booking.servicioId)?.name}</span>
                      </button>
                      <div className="mt-2">
                        <BookingActions booking={item.booking} onChangeStatus={onChangeStatus} compact />
                      </div>
                    </li>
                  ),
                )}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
