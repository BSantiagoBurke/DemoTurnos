"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { formatMinutes, mapsUrl, type DayOption, type Slot } from "@/lib/studio/booking";
import type { StudioCategoria, StudioExtra, StudioProfesional, StudioSede } from "@/lib/studio/types";
import { normalizeArgentinePhone } from "@/lib/phone";
import { formatLocalDate, weekdayOf, WEEKDAY_SHORT, type LocalDate } from "@/lib/time";

const card =
  "w-full rounded-2xl border border-(--st-border) bg-(--st-surface) p-4 text-left transition-colors";
const cardSelected = "border-(--st-accent) ring-1 ring-(--st-accent)";

export function PrimaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`st-btn flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl px-6 text-lg font-bold ${className}`}
    >
      {children}
    </button>
  );
}

/* ---------- Sede ---------- */

export function SedeStep({
  sedes,
  selectedId,
  onSelect,
}: {
  sedes: StudioSede[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="space-y-3">
      {sedes.map((sede) => {
        const selected = sede.id === selectedId;
        return (
          <li
            key={sede.id}
            className={`rounded-2xl border border-(--st-border) bg-(--st-surface) ${selected ? cardSelected : ""}`}
          >
            <button
              type="button"
              onClick={() => onSelect(sede.id)}
              aria-pressed={selected}
              className="flex w-full items-center gap-3 rounded-2xl p-4 text-left"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-(--st-bg) text-(--st-accent)">
                <Icon name="pin" className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="st-display block text-xl leading-tight">{sede.nombre}</span>
                <span className="mt-0.5 block text-sm text-(--st-muted)">{sede.zona}</span>
              </span>
              <Icon name="chevronRight" className="size-5 shrink-0 text-(--st-muted)" />
            </button>
            <div className="flex items-center justify-between gap-3 border-t border-(--st-border) px-4 py-2.5 text-sm">
              <a
                href={mapsUrl(sede.direccion)}
                target="_blank"
                rel="noopener"
                className="inline-flex min-h-9 items-center gap-1.5 font-semibold text-(--st-text) underline decoration-(--st-accent) decoration-2 underline-offset-4"
              >
                Cómo llegar
              </a>
              {sede.horarioAConfirmar ? <span className="text-xs text-(--st-muted)">Horario a confirmar</span> : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- Profesional ---------- */

/** Valor de "Sin preferencia": el repositorio asigna al primero con lugar. */
export const SIN_PREFERENCIA = "sin-preferencia";

export function ProfesionalStep({
  profesionales,
  selectedId,
  onSelect,
}: {
  profesionales: StudioProfesional[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const options = [
    { id: SIN_PREFERENCIA, nombre: "Sin preferencia", detalle: "Te asignamos quien tenga lugar", marca: null },
    ...profesionales.map((p, i) => ({ id: p.id, nombre: p.nombre, detalle: null, marca: String(i + 1) })),
  ];
  return (
    <ul className="space-y-2">
      {options.map((o) => {
        const selected = o.id === selectedId;
        return (
          <li key={o.id}>
            <button
              type="button"
              onClick={() => onSelect(o.id)}
              aria-pressed={selected}
              className={`${card} flex min-h-16 items-center gap-3 ${selected ? cardSelected : ""}`}
            >
              <span
                aria-hidden
                className="st-display flex size-11 shrink-0 items-center justify-center rounded-full border border-(--st-accent) text-lg text-(--st-accent)"
              >
                {o.marca ?? <Icon name="users" className="size-5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{o.nombre}</span>
                {o.detalle ? <span className="block text-sm text-(--st-muted)">{o.detalle}</span> : null}
              </span>
              <Icon name="chevronRight" className="size-5 shrink-0 text-(--st-muted)" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Aviso para servicios con `requiereConsulta` (ej. color: depende del largo y del estado del pelo). */
export function NotaConsulta({ texto }: { texto: string }) {
  return (
    <p className="flex items-start gap-2 text-sm text-(--st-muted)">
      <Icon name="info" className="mt-0.5 size-4 shrink-0 text-(--st-accent)" />
      <span>{texto}</span>
    </p>
  );
}

/* ---------- Servicio ---------- */

export function ServicioStep({
  categorias,
  selectedId,
  showEjemploNote,
  notaConsulta,
  onSelect,
}: {
  categorias: StudioCategoria[];
  selectedId: string | null;
  showEjemploNote: boolean;
  /** Se muestra debajo de los servicios con `requiereConsulta`. */
  notaConsulta?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      {categorias.map((cat) => (
        <section key={cat.id} aria-labelledby={`cat-${cat.id}`}>
          <h2 id={`cat-${cat.id}`} className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-(--st-muted)">
            {cat.nombre}
          </h2>
          <ul className="space-y-2">
            {cat.servicios.map((s) => {
              const selected = s.id === selectedId;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(s.id)}
                    aria-pressed={selected}
                    className={`${card} flex min-h-16 items-center justify-between gap-3 ${selected ? cardSelected : ""}`}
                  >
                    <span className="min-w-0">
                      <span className="block font-semibold">{s.nombre}</span>
                      {s.requiereConsulta && notaConsulta ? (
                        <span className="mt-0.5 block text-sm text-(--st-muted)">{notaConsulta}</span>
                      ) : null}
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1 text-sm text-(--st-muted)">
                      <Icon name="clock" className="size-4" />
                      {formatMinutes(s.duracionMin)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {showEjemploNote ? (
        <p className="text-xs text-(--st-muted)">Servicios y duraciones de ejemplo, para ajustar con la lista real del estudio.</p>
      ) : null}
    </div>
  );
}

/* ---------- Extras ---------- */

export function ExtrasStep({
  extras,
  selectedIds,
  baseMin,
  totalMin,
  onToggle,
  onContinue,
}: {
  extras: StudioExtra[];
  selectedIds: string[];
  baseMin: number;
  totalMin: number;
  onToggle: (id: string) => void;
  onContinue: () => void;
}) {
  return (
    <div>
      <p className="mb-4 text-(--st-muted)">Opcional. Cada extra suma tiempo al turno.</p>
      <ul className="space-y-2">
        {extras.map((e) => {
          const checked = selectedIds.includes(e.id);
          return (
            <li key={e.id}>
              <label className={`${card} flex min-h-16 cursor-pointer items-center gap-3 ${checked ? cardSelected : ""}`}>
                <input
                  type="checkbox"
                  name="extras"
                  value={e.id}
                  checked={checked}
                  onChange={() => onToggle(e.id)}
                  className="st-check size-6 shrink-0"
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{e.nombre}</span>
                  {e.descripcion ? <span className="block text-sm text-(--st-muted)">{e.descripcion}</span> : null}
                </span>
                <span className="shrink-0 text-sm text-(--st-muted)">
                  + {e.desde ? "desde " : ""}
                  {formatMinutes(e.duracionMin)}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <div className="mt-6 rounded-2xl bg-(--st-surface) px-4 py-3 text-sm">
        <span className="text-(--st-muted)">Duración total: </span>
        <strong>{formatMinutes(totalMin)}</strong>
        {totalMin !== baseMin ? <span className="text-(--st-muted)"> (servicio {formatMinutes(baseMin)} + extras)</span> : null}
      </div>
      <PrimaryButton type="button" onClick={onContinue} className="mt-4">
        {selectedIds.length ? "Continuar" : "Continuar sin extras"}
      </PrimaryButton>
    </div>
  );
}

/* ---------- Día y horario ---------- */

export function AgendaStep({
  days,
  selectedDate,
  slots,
  onSelectDate,
  onSelectSlot,
}: {
  days: DayOption[];
  selectedDate: LocalDate | null;
  slots: Slot[];
  onSelectDate: (date: LocalDate) => void;
  onSelectSlot: (time: string) => void;
}) {
  const free = slots.filter((s) => s.free).length;
  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5" role="group" aria-label="Elegí el día">
        {days.map((d) => {
          const disabled = !d.open || d.freeSlots === 0;
          const selected = d.date === selectedDate;
          const wd = WEEKDAY_SHORT[weekdayOf(d.date)];
          return (
            <button
              key={d.date}
              type="button"
              disabled={disabled}
              onClick={() => onSelectDate(d.date)}
              aria-pressed={selected}
              aria-label={`${formatLocalDate(d.date, "EEEE d 'de' MMMM")}${!d.open ? ", cerrado" : d.freeSlots === 0 ? ", completo" : ""}`}
              className={`flex min-h-16 flex-col items-center justify-center rounded-xl border text-center ${
                selected
                  ? "st-btn border-transparent"
                  : disabled
                    ? "border-transparent bg-transparent text-(--st-muted) opacity-45"
                    : "border-(--st-border) bg-(--st-surface)"
              }`}
            >
              <span className="text-[11px] font-medium uppercase leading-none">{wd}</span>
              <span className="mt-1 text-lg font-bold leading-none">{formatLocalDate(d.date, "d")}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-(--st-muted)">Los días apagados están cerrados o completos.</p>

      {selectedDate ? (
        <section aria-labelledby="horarios" className="mt-6">
          <h2 id="horarios" className="st-display text-xl">
            {capitalizeFirst(formatLocalDate(selectedDate, "EEEE d 'de' MMMM"))}
          </h2>
          <p className="mt-1 text-sm text-(--st-muted)">
            {free} {free === 1 ? "horario libre" : "horarios libres"} · los tachados ya están ocupados
          </p>
          <ul className="mt-3 grid grid-cols-3 gap-2">
            {slots.map((s) => (
              <li key={s.time}>
                <button
                  type="button"
                  disabled={!s.free}
                  onClick={() => onSelectSlot(s.time)}
                  aria-label={s.free ? `${s.time}` : `${s.time}, ocupado`}
                  className={`min-h-12 w-full rounded-xl border text-base font-semibold tabular-nums ${
                    s.free
                      ? "border-(--st-border) bg-(--st-surface) hover:border-(--st-accent)"
                      : "border-transparent text-(--st-muted) line-through opacity-50"
                  }`}
                >
                  {s.time}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function capitalizeFirst(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/* ---------- Datos ---------- */

export function DatosStep({
  summary,
  hint,
  initial,
  onSubmit,
}: {
  summary: ReactNode;
  /** Ayuda debajo del campo WhatsApp. */
  hint: string;
  initial: { nombre: string; telefono: string };
  onSubmit: (data: { nombre: string; telefono: string }) => void;
}) {
  const [nombre, setNombre] = useState(initial.nombre);
  const [telefono, setTelefono] = useState(initial.telefono);
  const [touched, setTouched] = useState(false);

  const nombreError = nombre.trim().length < 2 ? "Escribí tu nombre" : undefined;
  const normalized = normalizeArgentinePhone(telefono);
  const telError = normalized ? undefined : "Revisá el número: celular con código de área, ej. 381 555-1234";

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (nombreError) return document.getElementById("nombre")?.focus();
    if (!normalized) return document.getElementById("telefono")?.focus();
    onSubmit({ nombre: nombre.trim(), telefono: normalized });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {summary}
      <Field
        id="nombre"
        label="Tu nombre"
        error={touched ? nombreError : undefined}
        input={
          <input
            id="nombre"
            name="name"
            autoComplete="name"
            enterKeyHint="next"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            aria-invalid={touched && !!nombreError}
            aria-describedby={touched && nombreError ? "nombre-error" : undefined}
            className="st-input"
          />
        }
      />
      <Field
        id="telefono"
        label="Tu WhatsApp"
        hint={hint}
        error={touched ? telError : undefined}
        input={
          <input
            id="telefono"
            name="tel"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            enterKeyHint="done"
            required
            placeholder="381 555-1234"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            aria-invalid={touched && !!telError}
            aria-describedby={touched && telError ? "telefono-error" : "telefono-hint"}
            className="st-input"
          />
        }
      />
      <PrimaryButton type="submit">Revisar turno</PrimaryButton>
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  input,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  input: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block font-semibold">
        {label}
      </label>
      {input}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-(--st-error)">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-(--st-muted)">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/* ---------- Resumen ---------- */

export function Resumen({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <dl className="divide-y divide-(--st-border) rounded-2xl border border-(--st-border) bg-(--st-surface) px-4">
      {rows.map((r) => (
        <div key={r.label} className="flex items-baseline justify-between gap-4 py-3">
          <dt className="shrink-0 text-sm text-(--st-muted)">{r.label}</dt>
          <dd className="text-right font-semibold">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
