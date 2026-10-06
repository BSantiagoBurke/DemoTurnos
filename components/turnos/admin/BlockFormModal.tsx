"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { conflictingBookings } from "@/lib/agenda";
import type { NewBlock } from "@/lib/repositories";
import { minutesToTime, timeToMinutes, toZonedIso, weekdayOf, zonedDateTime, type LocalDate } from "@/lib/time";
import type { Booking, Profesional, TenantTurnosConfig } from "@/lib/types";

type Props = {
  open: boolean;
  config: TenantTurnosConfig;
  profesionales: Profesional[];
  date: LocalDate;
  bookings: Booking[];
  onClose: () => void;
  onSubmit: (block: NewBlock) => Promise<void>;
};

/** Horarios posibles para el profesional ese día, según las sedes donde trabaja. */
function timeOptions(config: TenantTurnosConfig, pro: Profesional | undefined, date: LocalDate): string[] {
  if (!pro) return [];
  const hours = config.sedes
    .filter((s) => pro.sedeIds.includes(s.id))
    .map((s) => s.hours[weekdayOf(date)])
    .filter((h): h is NonNullable<typeof h> => h !== null);
  if (hours.length === 0) return [];
  const from = Math.min(...hours.map((h) => timeToMinutes(h.open)));
  const to = Math.max(...hours.map((h) => timeToMinutes(h.close)));
  const options: string[] = [];
  for (let m = from; m <= to; m += config.slotStepMin) options.push(minutesToTime(m));
  return options;
}

export function BlockFormModal(props: Props) {
  return (
    <Modal open={props.open} title="Bloquear horario" onClose={props.onClose}>
      {/* El formulario se monta al abrir para arrancar siempre con valores frescos. */}
      {props.open ? <BlockForm {...props} /> : null}
    </Modal>
  );
}

function BlockForm({ config, profesionales, date: initialDate, bookings, onClose, onSubmit }: Props) {
  const [profesionalId, setProfesionalId] = useState(profesionales[0]?.id ?? "");
  const [date, setDate] = useState(initialDate);
  const pro = profesionales.find((p) => p.id === profesionalId);
  const options = timeOptions(config, pro, date);
  const [from, setFrom] = useState("13:00");
  const [to, setTo] = useState("14:00");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fromValue = options.includes(from) ? from : (options[0] ?? "");
  const toValue = options.includes(to) ? to : (options[1] ?? "");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!pro || !fromValue || !toValue) return;
    if (timeToMinutes(toValue) <= timeToMinutes(fromValue)) {
      setError("El horario de fin tiene que ser posterior al de inicio.");
      return;
    }
    const start = toZonedIso(zonedDateTime(date, fromValue));
    const end = toZonedIso(zonedDateTime(date, toValue));
    const conflicts = conflictingBookings(bookings, pro.id, start, end);
    if (conflicts.length > 0) {
      setError(
        `${pro.name} tiene ${conflicts.length} ${conflicts.length === 1 ? "turno" : "turnos"} en ese horario. Cancelalos primero o elegí otro rango.`,
      );
      return;
    }
    setSaving(true);
    await onSubmit({ profesionalId: pro.id, start, end, reason: reason.trim() || undefined });
    setSaving(false);
    onClose();
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Select
        label="Profesional"
        value={profesionalId}
        onChange={(e) => {
          setProfesionalId(e.target.value);
          setError(null);
        }}
        options={profesionales.map((p) => ({ value: p.id, label: p.name }))}
      />
      <Input label="Día" type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
      {options.length === 0 ? (
        <p className="rounded-xl bg-slate-100 p-3 text-sm text-slate-700">{pro?.name} no trabaja ese día.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Select label="Desde" value={fromValue} onChange={(e) => { setFrom(e.target.value); setError(null); }} options={options.map((o) => ({ value: o, label: o }))} />
          <Select label="Hasta" value={toValue} onChange={(e) => { setTo(e.target.value); setError(null); }} options={options.map((o) => ({ value: o, label: o }))} />
        </div>
      )}
      <Input label="Motivo (opcional)" placeholder="Almuerzo, trámite…" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={60} />
      {error ? (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button variant="secondary" onClick={onClose} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={saving || options.length === 0} className="flex-1">
          Bloquear
        </Button>
      </div>
    </form>
  );
}
