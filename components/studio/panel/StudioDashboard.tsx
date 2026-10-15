"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { formatArgentinePhone } from "@/lib/phone";
import { bookingInterval, busyIntervals, isActive } from "@/lib/studio/agenda";
import { findServicio, formatMessageDate } from "@/lib/studio/booking";
import { SlotTakenError } from "@/lib/studio/repository";
import type { StudioBlock, StudioBooking, StudioBookingStatus, StudioDemoConfig } from "@/lib/studio/types";
import { useStudioData } from "@/lib/studio/useStudioData";
import { addDaysLocal, minutesToTime, timeToMinutes, toLocalDate, toLocalTime, weekdayOf, type LocalDate } from "@/lib/time";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { NNMonogram } from "../NNMonogram";

type View = "dia" | "semana";

const capitalize = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export function StudioDashboard({ config, now, onLogout }: { config: StudioDemoConfig; now: Date; onLogout: () => void }) {
  const { bookings, blocks, loaded, repository, refresh } = useStudioData(config);
  const today = toLocalDate(now);
  const nowMin = timeToMinutes(toLocalTime(now));
  const [sedeFilter, setSedeFilter] = useState<string>("todas");
  const [view, setView] = useState<View>("dia");
  const [date, setDate] = useState<LocalDate>(today);
  const [openId, setOpenId] = useState<string | null>(null);
  const [blockFormOpen, setBlockFormOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const sedeName = (id: string) => config.sedes.find((s) => s.id === id)?.nombre ?? id;
  const inSede = <T extends { sedeId: string }>(x: T) => sedeFilter === "todas" || x.sedeId === sedeFilter;

  const dayBookings = bookings.filter((b) => b.date === date && inSede(b));
  const dayBlocks = blocks.filter((b) => b.date === date && inSede(b));
  const activos = dayBookings.filter(isActive);
  const porAtender = activos.filter(
    (b) => b.status === "confirmado" && (b.date > today || (b.date === today && bookingInterval(b).end > nowMin)),
  );
  const webNuevas = bookings
    .filter((b) => b.origen === "web" && b.status !== "cancelado" && b.date >= today && inSede(b))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const act = async (id: string, status: StudioBookingStatus) => {
    setNotice(null);
    try {
      await repository.updateStatus(id, status);
    } catch (e) {
      if (!(e instanceof SlotTakenError)) throw e;
      setNotice("No se puede reactivar: ese horario ya lo tomó otro turno.");
    }
    await refresh();
  };

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-6 pt-3">
      <header className="flex items-center gap-3">
        <NNMonogram size={36} />
        <div className="min-w-0 flex-1">
          <p className="st-display truncate text-lg leading-tight">{config.nombre}</p>
          <p className="text-xs text-(--st-muted)">Panel del estudio</p>
        </div>
        <button type="button" onClick={onLogout} className="min-h-11 rounded-full px-3 text-sm font-semibold text-(--st-muted) underline underline-offset-4">
          Salir
        </button>
      </header>

      {/* Sedes */}
      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filtrar por sede">
        {[{ id: "todas", nombre: "Todas" }, ...config.sedes].map((s) => {
          const active = sedeFilter === s.id;
          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={active}
              onClick={() => setSedeFilter(s.id)}
              className={`min-h-10 rounded-full border px-4 text-sm font-semibold ${
                active ? "st-btn border-transparent" : "border-(--st-border) bg-(--st-surface)"
              }`}
            >
              {s.nombre}
            </button>
          );
        })}
      </div>

      {/* Reservas web nuevas */}
      {loaded && webNuevas.length > 0 ? (
        <section aria-labelledby="web" className="mt-5 rounded-2xl border border-(--st-accent) bg-(--st-surface) p-4">
          <h2 id="web" className="flex items-center gap-2 font-bold">
            <span className="size-2 rounded-full bg-(--st-accent)" aria-hidden />
            Reservas desde la web ({webNuevas.length})
          </h2>
          <ul className="mt-2 divide-y divide-(--st-border)">
            {webNuevas.slice(0, 5).map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => {
                    setView("dia");
                    setDate(b.date);
                    setOpenId(b.id);
                  }}
                  className="flex min-h-12 w-full items-center justify-between gap-3 py-2 text-left"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{b.nombre}</span>
                    <span className="block truncate text-sm text-(--st-muted)">
                      {sedeName(b.sedeId)} · {capitalize(formatMessageDate(b.date))} {b.time} h
                    </span>
                  </span>
                  <Icon name="chevronRight" className="size-5 shrink-0 text-(--st-muted)" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Vista */}
      <div className="mt-5 grid grid-cols-2 gap-1 rounded-2xl bg-(--st-surface) p-1" role="tablist" aria-label="Vista de la agenda">
        {(["dia", "semana"] as const).map((v) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={view === v}
            onClick={() => setView(v)}
            className={`min-h-11 rounded-xl text-sm font-semibold ${view === v ? "bg-(--st-bg) text-(--st-text)" : "text-(--st-muted)"}`}
          >
            {v === "dia" ? "Día" : "Semana"}
          </button>
        ))}
      </div>

      {/* Navegación de fecha */}
      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setDate(addDaysLocal(date, view === "dia" ? -1 : -7))}
          className="inline-flex size-11 items-center justify-center rounded-full border border-(--st-border)"
          aria-label={view === "dia" ? "Día anterior" : "Semana anterior"}
        >
          <Icon name="chevronLeft" />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="st-display truncate text-lg">
            {view === "dia"
              ? capitalize(formatMessageDate(date))
              : `${capitalize(formatMessageDate(date))} al ${formatMessageDate(addDaysLocal(date, 6)).split(" ")[1]}`}
          </p>
          {date !== today ? (
            <button type="button" onClick={() => setDate(today)} className="text-xs font-semibold text-(--st-accent) underline underline-offset-2">
              Volver a hoy
            </button>
          ) : (
            <p className="text-xs text-(--st-muted)">Hoy</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setDate(addDaysLocal(date, view === "dia" ? 1 : 7))}
          className="inline-flex size-11 items-center justify-center rounded-full border border-(--st-border)"
          aria-label={view === "dia" ? "Día siguiente" : "Semana siguiente"}
        >
          <Icon name="chevronRight" />
        </button>
      </div>

      {notice ? (
        <p role="alert" className="mt-4 rounded-xl border border-(--st-error) px-3 py-2 text-sm text-(--st-error)">
          {notice}
        </p>
      ) : null}

      {!loaded ? (
        <div className="mt-4 h-48 animate-pulse rounded-2xl bg-(--st-surface)" aria-busy="true" />
      ) : view === "dia" ? (
        <>
          <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
            <Stat label="Turnos" value={activos.length} />
            <Stat label="Por atender" value={porAtender.length} />
            <Stat label="Desde la web" value={activos.filter((b) => b.origen === "web").length} accent />
          </dl>

          <DayList
            config={config}
            bookings={dayBookings}
            blocks={dayBlocks}
            showSede={sedeFilter === "todas"}
            openId={openId}
            onToggle={(id) => setOpenId(openId === id ? null : id)}
            onStatus={act}
            onDeleteBlock={async (id) => {
              await repository.deleteBlock(id);
              await refresh();
            }}
          />

          <div className="mt-5">
            {blockFormOpen ? (
              <BlockForm
                config={config}
                date={date}
                defaultSede={sedeFilter === "todas" ? config.sedes[0].id : sedeFilter}
                bookings={bookings}
                onCancel={() => setBlockFormOpen(false)}
                onCreate={async (input) => {
                  await repository.createBlock(input);
                  await refresh();
                  setBlockFormOpen(false);
                }}
              />
            ) : (
              <button
                type="button"
                onClick={() => setBlockFormOpen(true)}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-(--st-border) font-semibold"
              >
                <Icon name="ban" className="size-5" />
                Bloquear un horario
              </button>
            )}
          </div>
        </>
      ) : (
        <WeekList
          config={config}
          start={date}
          today={today}
          bookings={bookings.filter(inSede)}
          showSede={sedeFilter === "todas"}
          onOpenDay={(d) => {
            setDate(d);
            setView("dia");
          }}
        />
      )}

      <div className="mt-8 rounded-2xl border border-dashed border-(--st-border) p-4 text-sm text-(--st-muted)">
        <p>
          Los turnos marcados como <strong className="text-(--st-text)">ejemplo</strong> son inventados para mostrar la agenda llena. Lo que se
          reserva desde la página aparece como <strong className="text-(--st-accent)">web</strong>.
        </p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          <a href={`/demo/${config.slug}`} className="inline-flex min-h-11 items-center font-semibold text-(--st-text) underline underline-offset-4">
            Hacer una reserva de prueba
          </a>
          {confirmReset ? (
            <span className="inline-flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  await repository.reset();
                  await refresh();
                  setConfirmReset(false);
                  setOpenId(null);
                }}
                className="min-h-11 font-semibold text-(--st-error) underline underline-offset-4"
              >
                Sí, borrar reservas de prueba
              </button>
              <button type="button" onClick={() => setConfirmReset(false)} className="min-h-11 underline underline-offset-4">
                No
              </button>
            </span>
          ) : (
            <button type="button" onClick={() => setConfirmReset(true)} className="inline-flex min-h-11 items-center gap-1 underline underline-offset-4">
              <Icon name="refresh" className="size-4" />
              Reiniciar demo
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-2xl bg-(--st-surface) px-2 py-3">
      <dd className={`st-display text-2xl ${accent && value > 0 ? "text-(--st-accent)" : ""}`}>{value}</dd>
      <dt className="text-xs text-(--st-muted)">{label}</dt>
    </div>
  );
}

/* ---------- Lista del día ---------- */

type Row = { kind: "turno"; at: number; b: StudioBooking } | { kind: "bloqueo"; at: number; bl: StudioBlock };

function DayList({
  config,
  bookings,
  blocks,
  showSede,
  openId,
  onToggle,
  onStatus,
  onDeleteBlock,
}: {
  config: StudioDemoConfig;
  bookings: StudioBooking[];
  blocks: StudioBlock[];
  showSede: boolean;
  openId: string | null;
  onToggle: (id: string) => void;
  onStatus: (id: string, status: StudioBookingStatus) => void;
  onDeleteBlock: (id: string) => void;
}) {
  const rows: Row[] = [
    ...bookings.map((b) => ({ kind: "turno" as const, at: timeToMinutes(b.time), b })),
    ...blocks.map((bl) => ({ kind: "bloqueo" as const, at: timeToMinutes(bl.start), bl })),
  ].sort((a, b) => a.at - b.at);

  if (rows.length === 0) {
    return <p className="mt-4 rounded-2xl bg-(--st-surface) p-6 text-center text-(--st-muted)">Sin turnos para este día.</p>;
  }

  const sedeName = (id: string) => config.sedes.find((s) => s.id === id)?.nombre ?? id;

  return (
    <ul className="mt-4 space-y-2">
      {rows.map((row) =>
        row.kind === "bloqueo" ? (
          <li key={row.bl.id} className="flex items-center gap-3 rounded-2xl border border-dashed border-(--st-border) px-4 py-3 text-sm">
            <span className="w-14 shrink-0 font-semibold tabular-nums">{row.bl.start}</span>
            <span className="min-w-0 flex-1 text-(--st-muted)">
              Bloqueado hasta {row.bl.end}
              {row.bl.motivo ? ` · ${row.bl.motivo}` : ""}
              {showSede ? ` · ${sedeName(row.bl.sedeId)}` : ""}
            </span>
            <button type="button" onClick={() => onDeleteBlock(row.bl.id)} className="min-h-11 shrink-0 px-2 font-semibold underline underline-offset-4">
              Quitar
            </button>
          </li>
        ) : (
          <BookingRow
            key={row.b.id}
            config={config}
            b={row.b}
            sede={showSede ? sedeName(row.b.sedeId) : null}
            open={openId === row.b.id}
            onToggle={() => onToggle(row.b.id)}
            onStatus={onStatus}
          />
        ),
      )}
    </ul>
  );
}

function BookingRow({
  config,
  b,
  sede,
  open,
  onToggle,
  onStatus,
}: {
  config: StudioDemoConfig;
  b: StudioBooking;
  sede: string | null;
  open: boolean;
  onToggle: () => void;
  onStatus: (id: string, status: StudioBookingStatus) => void;
}) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const servicio = findServicio(config, b.servicioId);
  const extras = config.extras.filter((e) => b.extraIds.includes(e.id)).map((e) => e.nombre);
  const end = minutesToTime(bookingInterval(b).end);
  const cancelled = b.status === "cancelado";
  const msg = `Hola ${b.nombre.split(" ")[0]}! Te escribimos de ${config.nombre} por tu turno del ${formatMessageDate(b.date)} a las ${b.time} en ${
    config.sedes.find((s) => s.id === b.sedeId)?.nombre ?? ""
  }.`;

  return (
    <li className={`rounded-2xl border bg-(--st-surface) ${b.origen === "web" ? "border-(--st-accent)" : "border-(--st-border)"} ${cancelled ? "opacity-60" : ""}`}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-start gap-3 px-4 py-3 text-left">
        <span className="w-14 shrink-0 tabular-nums">
          <span className={`block font-bold ${cancelled ? "line-through" : ""}`}>{b.time}</span>
          <span className="block text-xs text-(--st-muted)">{end}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold">{b.nombre}</span>
            {b.origen === "web" ? <Badge tone="accent">web</Badge> : <Badge>ejemplo</Badge>}
            {b.status === "atendido" ? <Badge tone="ok">atendido</Badge> : null}
            {cancelled ? <Badge tone="error">cancelado</Badge> : null}
          </span>
          <span className="mt-0.5 block text-sm text-(--st-muted)">
            {[servicio?.nombre, ...extras].filter(Boolean).join(" + ")}
            {sede ? ` · ${sede}` : ""}
          </span>
        </span>
        <Icon name="chevronRight" className={`mt-1 size-5 shrink-0 text-(--st-muted) transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open ? (
        <div className="border-t border-(--st-border) px-4 py-3">
          <p className="text-sm">
            <span className="text-(--st-muted)">WhatsApp: </span>
            <a href={buildWhatsAppLink(b.telefono, msg)} target="_blank" rel="noopener" className="font-semibold underline underline-offset-4">
              {formatArgentinePhone(b.telefono)}
            </a>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {b.status === "confirmado" ? (
              <>
                <ActionButton onClick={() => onStatus(b.id, "atendido")} icon="check">
                  Marcar atendido
                </ActionButton>
                {confirmCancel ? (
                  <ActionButton onClick={() => onStatus(b.id, "cancelado")} icon="ban" danger>
                    Sí, cancelar
                  </ActionButton>
                ) : (
                  <ActionButton onClick={() => setConfirmCancel(true)} icon="ban">
                    Cancelar turno
                  </ActionButton>
                )}
              </>
            ) : (
              <ActionButton onClick={() => onStatus(b.id, "confirmado")} icon="refresh">
                {cancelled ? "Reactivar turno" : "Deshacer"}
              </ActionButton>
            )}
          </div>
          {confirmCancel && b.status === "confirmado" ? (
            <p className="mt-2 text-xs text-(--st-muted)">El horario queda libre para otra clienta.</p>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone?: "accent" | "ok" | "error" }) {
  const cls =
    tone === "accent"
      ? "bg-(--st-accent) text-(--st-on-accent)"
      : tone === "ok"
        ? "border border-(--st-border) text-(--st-text)"
        : tone === "error"
          ? "border border-(--st-error) text-(--st-error)"
          : "border border-(--st-border) text-(--st-muted)";
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${cls}`}>{children}</span>;
}

function ActionButton({
  children,
  onClick,
  icon,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  icon: "check" | "ban" | "refresh";
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold ${
        danger ? "border-(--st-error) text-(--st-error)" : "border-(--st-border)"
      }`}
    >
      <Icon name={icon} className="size-4" />
      {children}
    </button>
  );
}

/* ---------- Semana ---------- */

function WeekList({
  config,
  start,
  today,
  bookings,
  showSede,
  onOpenDay,
}: {
  config: StudioDemoConfig;
  start: LocalDate;
  today: LocalDate;
  bookings: StudioBooking[];
  showSede: boolean;
  onOpenDay: (d: LocalDate) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDaysLocal(start, i));
  return (
    <ul className="mt-4 space-y-2">
      {days.map((d) => {
        const list = bookings.filter((b) => b.date === d && isActive(b));
        const closed = config.sedes.every((s) => s.horarios[weekdayOf(d)] === null);
        const web = list.filter((b) => b.origen === "web").length;
        return (
          <li key={d}>
            <button
              type="button"
              onClick={() => onOpenDay(d)}
              className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-(--st-border) bg-(--st-surface) px-4 py-3 text-left"
            >
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">
                  {capitalize(formatMessageDate(d))}
                  {d === today ? <span className="ml-2 text-xs text-(--st-accent)">hoy</span> : null}
                </span>
                <span className="block text-sm text-(--st-muted)">
                  {closed
                    ? "Cerrado"
                    : showSede
                      ? config.sedes.map((s) => `${s.nombre.split(" ")[0]} ${list.filter((b) => b.sedeId === s.id).length}`).join(" · ")
                      : `${list.length} turnos`}
                </span>
              </span>
              {!closed ? (
                <span className="text-right">
                  <span className="st-display block text-xl">{list.length}</span>
                  {web > 0 ? <span className="block text-xs font-semibold text-(--st-accent)">{web} web</span> : null}
                </span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- Bloqueos ---------- */

function BlockForm({
  config,
  date,
  defaultSede,
  bookings,
  onCancel,
  onCreate,
}: {
  config: StudioDemoConfig;
  date: LocalDate;
  defaultSede: string;
  bookings: StudioBooking[];
  onCancel: () => void;
  onCreate: (input: { sedeId: string; date: LocalDate; start: string; end: string; motivo?: string }) => void;
}) {
  const [sedeId, setSedeId] = useState(defaultSede);
  const sede = config.sedes.find((s) => s.id === sedeId)!;
  const hours = sede.horarios[weekdayOf(date)];
  const step = config.reserva.bloqueMin;
  const options: string[] = [];
  if (hours) for (let m = timeToMinutes(hours.open); m <= timeToMinutes(hours.close); m += step) options.push(minutesToTime(m));
  const [start, setStart] = useState(options.includes("13:00") ? "13:00" : (options[0] ?? ""));
  const [end, setEnd] = useState(options.includes("14:00") ? "14:00" : (options[1] ?? ""));
  const [motivo, setMotivo] = useState("");

  const valid = !!hours && options.includes(start) && options.includes(end) && timeToMinutes(end) > timeToMinutes(start);
  const overlapping = valid
    ? busyIntervals(bookings, [], sedeId, date).filter((b) => timeToMinutes(start) < b.end && b.start < timeToMinutes(end)).length
    : 0;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onCreate({ sedeId, date, start, end, motivo: motivo.trim() || undefined });
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-(--st-border) bg-(--st-surface) p-4">
      <p className="font-semibold">Bloquear horario · {capitalize(formatMessageDate(date))}</p>
      <label className="block text-sm">
        <span className="mb-1 block text-(--st-muted)">Sede</span>
        <select value={sedeId} onChange={(e) => setSedeId(e.target.value)} className="st-input">
          {config.sedes.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </select>
      </label>
      {hours ? (
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="mb-1 block text-(--st-muted)">Desde</span>
            <select value={start} onChange={(e) => setStart(e.target.value)} className="st-input">
              {options.slice(0, -1).map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-(--st-muted)">Hasta</span>
            <select value={end} onChange={(e) => setEnd(e.target.value)} className="st-input">
              {options.slice(1).map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
        </div>
      ) : (
        <p className="text-sm text-(--st-muted)">Esta sede está cerrada ese día.</p>
      )}
      <label className="block text-sm">
        <span className="mb-1 block text-(--st-muted)">Motivo (opcional)</span>
        <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Almuerzo, curso, trámite…" className="st-input" />
      </label>
      {overlapping > 0 ? (
        <p className="text-sm text-(--st-error)">
          Hay {overlapping} {overlapping === 1 ? "turno" : "turnos"} en ese rango. El bloqueo no los cancela.
        </p>
      ) : null}
      {valid ? null : hours ? <p className="text-sm text-(--st-error)">El horario de fin tiene que ser posterior al de inicio.</p> : null}
      <div className="flex gap-2">
        <button type="submit" disabled={!valid} className="st-btn min-h-12 flex-1 rounded-xl font-bold disabled:opacity-50">
          Bloquear
        </button>
        <button type="button" onClick={onCancel} className="min-h-12 rounded-xl border border-(--st-border) px-4 font-semibold">
          Cancelar
        </button>
      </div>
    </form>
  );
}
