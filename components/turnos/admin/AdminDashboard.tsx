"use client";

import Link from "next/link";
import { useState } from "react";
import { TenantLogo } from "@/components/turnos/TenantLogo";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import {
  blocksForDate,
  bookingsForDate,
  dayRange,
  dayStats,
  initialAgendaDate,
  profesionalesForSede,
  weekDates,
  type SedeFilter,
} from "@/lib/agenda";
import { useBookingData } from "@/lib/hooks/useBookingData";
import type { NewBlock } from "@/lib/repositories";
import { findProfesional } from "@/lib/tenant-lookup";
import { addDaysLocal, formatLocalDate, formatLongDate, timeToMinutes, toLocalDate, toLocalTime, type LocalDate } from "@/lib/time";
import type { Block, Booking, BookingStatus, TenantTurnosConfig } from "@/lib/types";
import { BlockFormModal } from "./BlockFormModal";
import { BookingDetailModal } from "./BookingDetailModal";
import { DayAgendaGrid } from "./DayAgendaGrid";
import { DayAgendaList } from "./DayAgendaList";
import { StatsBar } from "./StatsBar";
import { WeekList } from "./WeekList";

type View = "day" | "week";

export function AdminDashboard({ config, now, onLogout }: { config: TenantTurnosConfig; now: Date; onLogout: () => void }) {
  const { bookings, blocks, loaded, repository, refresh } = useBookingData(config);
  const today = toLocalDate(now);
  const [pickedDate, setPickedDate] = useState<LocalDate | null>(null);
  const [view, setView] = useState<View>("day");
  const [sede, setSede] = useState<SedeFilter>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [blockFormOpen, setBlockFormOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const date = pickedDate ?? (loaded ? initialAgendaDate(config, bookings, today) : today);
  const profesionales = profesionalesForSede(config, sede);
  const dayBookings = bookingsForDate(bookings, date, sede);
  const dayBlocks = blocksForDate(blocks, date, profesionales.map((p) => p.id));
  const range = dayRange(config, date, sede);

  const changeStatus = async (id: string, status: BookingStatus) => {
    await repository.updateStatus(id, status);
    await refresh();
  };
  const createBlock = async (block: NewBlock) => {
    await repository.createBlock(block);
    await refresh();
  };
  const deleteBlock = async (id: string) => {
    await repository.deleteBlock(id);
    await refresh();
    setSelectedBlock(null);
  };
  const resetDemo = async () => {
    await repository.reset();
    await refresh();
    setPickedDate(null);
    setResetOpen(false);
  };

  const step = view === "day" ? 1 : 7;
  const dateLabel =
    view === "day"
      ? formatLongDate(date)
      : `Semana del ${formatLocalDate(weekDates(date)[0], "d 'de' MMMM")}`;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-10 pt-4">
      <header className="flex flex-wrap items-center gap-3">
        <TenantLogo tenant={config} size={40} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2">
            <span className="truncate font-bold text-slate-900">{config.name}</span>
            <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-950">DEMO</span>
          </p>
          <p className="text-sm text-slate-600">Panel del negocio</p>
        </div>
        <Button variant="ghost" onClick={onLogout} className="text-sm">
          Salir
        </Button>
      </header>

      <div className="mt-5 flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={view === "day" ? "Día anterior" : "Semana anterior"}
            onClick={() => setPickedDate(addDaysLocal(date, -step))}
            className="inline-flex size-11 items-center justify-center rounded-xl bg-white ring-1 ring-slate-200 hover:bg-slate-50"
          >
            <Icon name="chevronLeft" />
          </button>
          <button
            type="button"
            aria-label={view === "day" ? "Día siguiente" : "Semana siguiente"}
            onClick={() => setPickedDate(addDaysLocal(date, step))}
            className="inline-flex size-11 items-center justify-center rounded-xl bg-white ring-1 ring-slate-200 hover:bg-slate-50"
          >
            <Icon name="chevronRight" />
          </button>
          <Button variant="secondary" onClick={() => setPickedDate(today)} disabled={date === today} className="ml-1">
            Hoy
          </Button>
        </div>
        <div role="tablist" aria-label="Vista" className="inline-flex rounded-xl bg-slate-200 p-1">
          {(["day", "week"] as const).map((v) => (
            <button
              key={v}
              role="tab"
              type="button"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={cn("min-h-9 rounded-lg px-4 text-sm font-semibold", view === v ? "bg-white text-slate-900 shadow-sm" : "text-slate-700")}
            >
              {v === "day" ? "Día" : "Semana"}
            </button>
          ))}
        </div>
        {config.sedes.length > 1 ? (
          <Select
            label="Sede"
            className="w-full sm:w-56"
            value={sede}
            onChange={(e) => setSede(e.target.value)}
            options={[{ value: "all", label: "Todas las sedes" }, ...config.sedes.map((s) => ({ value: s.id, label: s.name }))]}
          />
        ) : null}
      </div>

      <h1 className="mt-5 text-2xl font-bold text-slate-900">
        {dateLabel}
        {view === "day" && date === today ? <span className="ml-2 text-base font-normal text-slate-600">(hoy)</span> : null}
      </h1>

      {!loaded ? (
        <div className="mt-4 h-40 animate-pulse rounded-2xl bg-slate-200" aria-busy="true" aria-label="Cargando agenda" />
      ) : view === "day" ? (
        <>
          <div className="mt-4">
            <StatsBar stats={dayStats(config, dayBookings)} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setBlockFormOpen(true)}>
              <Icon name="ban" />
              Bloquear horario
            </Button>
            <Link href={`/turnos/${config.slug}/reservar`} className="inline-flex min-h-11 items-center rounded-xl px-4 font-semibold text-slate-700 hover:bg-slate-100">
              + Cargar turno
            </Link>
          </div>
          <div className="mt-4">
            {!range && dayBookings.length === 0 ? (
              <p className="rounded-2xl bg-white p-6 text-center text-slate-600 ring-1 ring-slate-200">El negocio está cerrado este día.</p>
            ) : (
              <>
                <div className="md:hidden">
                  <DayAgendaList
                    config={config}
                    profesionales={profesionales}
                    bookings={dayBookings}
                    blocks={dayBlocks}
                    onSelectBooking={setSelectedBooking}
                    onSelectBlock={setSelectedBlock}
                    onChangeStatus={changeStatus}
                  />
                </div>
                <div className="hidden md:block">
                  <DayAgendaGrid
                    config={config}
                    profesionales={profesionales}
                    bookings={dayBookings}
                    blocks={dayBlocks}
                    range={range ?? { start: 9 * 60, end: 20 * 60 }}
                    nowMinutes={date === today ? timeToMinutes(toLocalTime(now)) : null}
                    onSelectBooking={setSelectedBooking}
                    onSelectBlock={setSelectedBlock}
                  />
                </div>
              </>
            )}
          </div>
        </>
      ) : (
        <div className="mt-4">
          <WeekList
            config={config}
            dates={weekDates(date)}
            today={today}
            bookings={bookings}
            sede={sede}
            onSelectBooking={setSelectedBooking}
            onSelectDate={(d) => {
              setPickedDate(d);
              setView("day");
            }}
          />
        </div>
      )}

      <section className="mt-10 rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-700">
        <p>
          <strong>Demo:</strong> los turnos se guardan solo en este navegador. En la versión real, la agenda se ve desde cualquier
          dispositivo y en tiempo real.
        </p>
        <Button variant="secondary" onClick={() => setResetOpen(true)} className="mt-3">
          <Icon name="refresh" />
          Reiniciar demo
        </Button>
      </section>

      <BookingDetailModal
        config={config}
        booking={selectedBooking ? (bookings.find((b) => b.id === selectedBooking.id) ?? null) : null}
        onClose={() => setSelectedBooking(null)}
        onChangeStatus={changeStatus}
      />

      <BlockFormModal
        open={blockFormOpen}
        config={config}
        profesionales={profesionales}
        date={date}
        bookings={bookings}
        onClose={() => setBlockFormOpen(false)}
        onSubmit={createBlock}
      />

      <Modal open={selectedBlock !== null} title="Horario bloqueado" onClose={() => setSelectedBlock(null)}>
        {selectedBlock ? (
          <div className="space-y-4">
            <p className="text-slate-700">
              {findProfesional(config, selectedBlock.profesionalId)?.name}, {toLocalTime(selectedBlock.start)} a{" "}
              {toLocalTime(selectedBlock.end)}
              {selectedBlock.reason ? ` · ${selectedBlock.reason}` : ""}
            </p>
            <Button variant="danger" block onClick={() => deleteBlock(selectedBlock.id)}>
              Quitar bloqueo
            </Button>
          </div>
        ) : null}
      </Modal>

      <Modal open={resetOpen} title="¿Reiniciar la demo?" onClose={() => setResetOpen(false)}>
        <p className="text-slate-700">Se borran los turnos y bloqueos cargados y vuelven los datos de ejemplo.</p>
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setResetOpen(false)}>
            No
          </Button>
          <Button className="flex-1" onClick={resetDemo}>
            Sí, reiniciar
          </Button>
        </div>
      </Modal>
    </main>
  );
}
