"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import {
  buildConfirmMessage,
  dayOptions,
  extrasFor,
  findServicio,
  formatMessageDate,
  formatMinutes,
  mapsUrl,
  mergeSlots,
  servicioLabel,
  slotsForDate,
  studioFlow,
  type StudioFlowStep,
  totalDuration,
} from "@/lib/studio/booking";
import { busyIntervals } from "@/lib/studio/agenda";
import { SlotTakenError } from "@/lib/studio/repository";
import { useStudioData } from "@/lib/studio/useStudioData";
import type { StudioBooking as StudioBookingRecord, StudioDemoConfig } from "@/lib/studio/types";
import { useNow } from "@/lib/hooks/useNow";
import { formatArgentinePhone } from "@/lib/phone";
import { timeToMinutes, toLocalDate, toLocalTime, type LocalDate } from "@/lib/time";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { Marca } from "./Marca";
import { StudioFooter } from "./StudioFooter";
import {
  AgendaStep,
  DatosStep,
  ExtrasStep,
  NotaConsulta,
  PrimaryButton,
  ProfesionalStep,
  Resumen,
  SedeStep,
  ServicioStep,
  SIN_PREFERENCIA,
} from "./StudioSteps";

type Step = "portada" | StudioFlowStep;
type FlowStep = StudioFlowStep;

const TITLES: Record<FlowStep, string> = {
  sede: "¿En qué sede?",
  servicio: "Elegí el servicio",
  extras: "¿Sumás algo?",
  profesional: "¿Con quién?",
  agenda: "Elegí día y horario",
  datos: "Tus datos",
  confirmacion: "Revisá y confirmá",
  listo: "¡Turno reservado!",
};

export function StudioBooking({ config }: { config: StudioDemoConfig }) {
  const FLOW = studioFlow(config);
  /** Pasos que cuentan en la barra de progreso ("listo" es la pantalla final). */
  const PROGRESS = FLOW.length - 1;
  const profesionales = config.profesionales ?? [];
  const unaSede = config.sedes.length === 1;
  // El paso vive en la URL (?paso=...): así el "atrás" del celular vuelve un paso.
  const searchParams = useSearchParams();
  const pasoParam = searchParams.get("paso");
  const requestedStep: Step = FLOW.includes(pasoParam as FlowStep) ? (pasoParam as Step) : "portada";
  const [sedeId, setSedeId] = useState<string | null>(unaSede ? config.sedes[0].id : null);
  /** Id del profesional, SIN_PREFERENCIA o null (todavía no eligió). */
  const [profesionalSel, setProfesionalSel] = useState<string | null>(null);
  const [servicioId, setServicioId] = useState<string | null>(null);
  const [extraIds, setExtraIds] = useState<string[]>([]);
  const [date, setDate] = useState<LocalDate | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [cliente, setCliente] = useState({ nombre: "", telefono: "" });
  const [booked, setBooked] = useState<StudioBookingRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { bookings, blocks, loaded, repository, refresh } = useStudioData(config);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const now = useNow();

  const sede = config.sedes.find((s) => s.id === sedeId);
  const servicio = findServicio(config, servicioId);
  const availableExtras = extrasFor(config, servicio);
  const extras = availableExtras.filter((e) => extraIds.includes(e.id));
  const duration = servicio ? totalDuration(servicio, extras) : 0;
  const profesional = profesionales.find((p) => p.id === profesionalSel);
  const sinPreferencia = profesionalSel === SIN_PREFERENCIA;
  // Si falta un dato necesario (por ej. tras el "atrás" o "adelante" del navegador),
  // se muestra el primer paso incompleto.
  const step: Step = (() => {
    const pos = (s: Step) => FLOW.indexOf(s as FlowStep);
    const need: [Step, boolean][] = [
      ["sede", !!sede],
      ["servicio", !!servicio],
      ["profesional", profesionales.length === 0 || !!profesional || sinPreferencia],
      ["agenda", !!date && !!time],
      ["datos", !!cliente.nombre],
      ["confirmacion", !!booked],
    ];
    for (const [s, ok] of need) if (!ok && pos(s) >= 0 && pos(requestedStep) > pos(s)) return s;
    return requestedStep;
  })();
  const hasEjemplos = config.categorias.some((c) => c.servicios.some((s) => s.ejemplo));

  const go = (next: Step) => {
    window.history.pushState(null, "", next === "portada" ? window.location.pathname : `?paso=${next}`);
  };

  useEffect(() => {
    window.scrollTo({ top: 0 });
    if (step !== "portada") headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  const today = now ? toLocalDate(now) : null;
  const nowMin = now ? timeToMinutes(toLocalTime(now)) : 0;

  const agendaBase =
    sede && servicio && today && loaded
      ? {
          sede,
          durationMin: duration,
          stepMin: config.reserva.bloqueMin,
          today,
          nowMin,
          leadMin: config.reserva.anticipacionMin,
          busy: [],
        }
      : null;

  // Con profesional elegido, su agenda; con "Sin preferencia", la unión de huecos libres de todos.
  const busyFor = (d: LocalDate, proId = profesional?.id) => (sede ? busyIntervals(bookings, blocks, sede.id, d, proId) : []);
  const slotsFor = (d: LocalDate) =>
    agendaBase
      ? sinPreferencia
        ? mergeSlots(profesionales.map((p) => slotsForDate({ ...agendaBase, date: d, busy: busyFor(d, p.id) })))
        : slotsForDate({ ...agendaBase, date: d, busy: busyFor(d) })
      : [];
  const days = agendaBase ? dayOptions({ ...agendaBase, days: config.reserva.diasVisibles, busyFor, slotsFor }) : [];

  // Día elegido; si no hay ninguno (o dejó de tener lugar), el primero con horarios libres.
  const firstFree = days.find((d) => d.open && d.freeSlots > 0)?.date ?? null;
  const selectedDay = days.find((d) => d.date === date && d.freeSlots > 0) ? date : firstFree;
  const slots = selectedDay ? slotsFor(selectedDay) : [];

  // Después de confirmar se muestra el profesional asignado (también con "Sin preferencia").
  const profesionalNombre =
    profesionales.find((p) => p.id === booked?.profesionalId)?.nombre ?? profesional?.nombre ?? (sinPreferencia ? "Sin preferencia" : null);
  const requiereConsulta = !!servicio?.requiereConsulta && !!config.textos.notaConsulta;

  const resumenRows =
    sede && servicio && date && time
      ? [
          ...(unaSede ? [] : [{ label: "Sede", value: sede.nombre }]),
          { label: "Servicio", value: servicio.nombre },
          ...(profesionalNombre ? [{ label: "Estilista", value: profesionalNombre }] : []),
          ...(extras.length ? [{ label: "Extras", value: extras.map((e) => e.nombre).join(", ") }] : []),
          { label: "Día", value: capitalizeFirst(formatMessageDate(date)) },
          { label: "Hora", value: time },
          { label: "Duración", value: `${extras.some((e) => e.desde) ? "aprox. " : ""}${formatMinutes(duration)}` },
        ]
      : [];

  const whatsappHref =
    sede && servicio && date && time && cliente.nombre
      ? buildWhatsAppLink(
          config.whatsapp,
          buildConfirmMessage({
            sede: unaSede ? undefined : sede.nombre,
            profesional: profesionales.find((p) => p.id === booked?.profesionalId)?.nombre,
            servicio: servicioLabel(servicio, extras),
            dia: formatMessageDate(date),
            hora: time,
            nombre: cliente.nombre,
          }),
        )
      : null;

  const confirmar = async () => {
    if (!sede || !servicio || !date || !time) return;
    setSaving(true);
    setError(null);
    try {
      const b = await repository.create({
        sedeId: sede.id,
        // Sin preferencia: el repositorio asigna al primero con lugar.
        ...(profesional ? { profesionalId: profesional.id } : {}),
        servicioId: servicio.id,
        extraIds: extras.map((e) => e.id),
        date,
        time,
        durationMin: duration,
        nombre: cliente.nombre,
        telefono: cliente.telefono,
      });
      setBooked(b);
      await refresh();
      // Se reemplaza la entrada del historial: volver atrás no repite la confirmación.
      window.history.replaceState(null, "", "?paso=listo");
    } catch (e) {
      if (!(e instanceof SlotTakenError)) throw e;
      await refresh();
      setTime(null);
      setError("Ese horario se acaba de ocupar. Elegí otro, por favor.");
      go("agenda");
    } finally {
      setSaving(false);
    }
  };

  const restart = () => {
    setBooked(null);
    setError(null);
    setSedeId(unaSede ? config.sedes[0].id : null);
    setServicioId(null);
    setExtraIds([]);
    setProfesionalSel(null);
    setDate(null);
    setTime(null);
    go(FLOW[0]);
  };

  /** Paso que sigue a `current` en el flujo (para saltear los que no aplican). */
  const after = (current: FlowStep): FlowStep => FLOW[FLOW.indexOf(current) + 1];

  if (step === "portada") {
    return <Portada config={config} onStart={() => go(FLOW[0])} />;
  }

  const index = FLOW.indexOf(step);

  const renderStep = () => {
    switch (step) {
      case "sede":
        return (
          <SedeStep
            sedes={config.sedes}
            selectedId={sedeId}
            onSelect={(id) => {
              if (id !== sedeId) setTime(null);
              setSedeId(id);
              go("servicio");
            }}
          />
        );
      case "servicio":
        return (
          <ServicioStep
            categorias={config.categorias}
            selectedId={servicioId}
            showEjemploNote={hasEjemplos}
            notaConsulta={config.textos.notaConsulta}
            onSelect={(id) => {
              if (id !== servicioId) {
                setTime(null);
                const next = findServicio(config, id);
                const allowed = new Set(extrasFor(config, next).map((e) => e.id));
                setExtraIds((prev) => prev.filter((x) => allowed.has(x)));
              }
              setServicioId(id);
              const hasExtras = extrasFor(config, findServicio(config, id)).length > 0;
              go(hasExtras ? "extras" : after(FLOW.includes("extras") ? "extras" : "servicio"));
            }}
          />
        );
      case "extras":
        return servicio ? (
          <ExtrasStep
            extras={availableExtras}
            selectedIds={extraIds}
            baseMin={servicio.duracionMin}
            totalMin={duration}
            onToggle={(id) => {
              setTime(null);
              setExtraIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
            }}
            onContinue={() => go(after("extras"))}
          />
        ) : null;
      case "profesional":
        return (
          <ProfesionalStep
            profesionales={profesionales}
            selectedId={profesionalSel}
            onSelect={(id) => {
              if (id !== profesionalSel) setTime(null);
              setProfesionalSel(id);
              go("agenda");
            }}
          />
        );
      case "agenda":
        if (!agendaBase) return <div className="h-64 animate-pulse rounded-2xl bg-(--st-surface)" aria-busy="true" />;
        return (
          <>
            <p className="mb-4 text-sm text-(--st-muted)">
              {profesionales.length ? profesionalNombre : sede?.nombre} · {servicio ? servicioLabel(servicio, extras) : ""} ·{" "}
              <strong className="text-(--st-text)">{formatMinutes(duration)}</strong>
            </p>
            {error ? (
              <p role="alert" className="mb-4 rounded-xl border border-(--st-error) px-3 py-2 text-sm text-(--st-error)">
                {error}
              </p>
            ) : null}
            {sede?.horarioAConfirmar ? (
              <p className="mb-4 rounded-xl border border-(--st-border) px-3 py-2 text-xs text-(--st-muted)">
                Horario de esta sede a confirmar.{sede.notaHorario ? ` ${sede.notaHorario}` : ""}
              </p>
            ) : null}
            <AgendaStep
              days={days}
              selectedDate={selectedDay}
              slots={slots}
              onSelectDate={(d) => {
                setDate(d);
                setTime(null);
              }}
              onSelectSlot={(t) => {
                setError(null);
                setDate(selectedDay);
                setTime(t);
                go("datos");
              }}
            />
          </>
        );
      case "datos":
        return (
          <DatosStep
            summary={
              <div className="space-y-2">
                <Resumen rows={resumenRows} />
                {requiereConsulta ? <NotaConsulta texto={config.textos.notaConsulta!} /> : null}
              </div>
            }
            hint={config.textos.ayudaTelefono}
            initial={cliente}
            onSubmit={(data) => {
              setCliente(data);
              go("confirmacion");
            }}
          />
        );
      case "confirmacion":
        return (
          <div className="space-y-5">
            <Resumen
              rows={[
                ...resumenRows,
                { label: "A nombre de", value: cliente.nombre },
                { label: "WhatsApp", value: formatArgentinePhone(cliente.telefono) },
              ]}
            />
            {requiereConsulta ? <NotaConsulta texto={config.textos.notaConsulta!} /> : null}
            <PrimaryButton type="button" onClick={confirmar} disabled={saving} aria-busy={saving}>
              {saving ? "Reservando…" : "Confirmar turno"}
            </PrimaryButton>
            <p className="text-center text-sm text-(--st-muted)">El horario queda reservado al confirmar.</p>
          </div>
        );
      case "listo":
        return (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="st-btn flex size-12 shrink-0 items-center justify-center rounded-full">
                <Icon name="check" className="size-7" />
              </span>
              <p className="text-lg">
                <strong>¡Listo, {cliente.nombre}!</strong>
                <br />
                <span className="text-(--st-muted)">Tu turno quedó reservado.</span>
              </p>
            </div>
            <Resumen rows={resumenRows} />
            {requiereConsulta ? <NotaConsulta texto={config.textos.notaConsulta!} /> : null}
            {whatsappHref && config.avisoWhatsApp !== false ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener"
                className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-(--st-border) bg-(--st-surface) px-6 text-base font-semibold"
              >
                <Icon name="whatsapp" className="size-5" />
                Avisar por WhatsApp (opcional)
              </a>
            ) : null}
            <button type="button" onClick={restart} className="mx-auto block min-h-11 px-4 text-sm font-semibold underline underline-offset-4">
              Hacer otra reserva
            </button>
            <div className="rounded-2xl border border-dashed border-(--st-accent) p-4 text-sm">
              <p className="font-semibold">Para la demo</p>
              <p className="mt-1 text-(--st-muted)">{config.textos.comoLlega}</p>
              {config.avisoWhatsApp === false ? (
                <a
                  href={`/demo/${config.slug}/panel`}
                  className="st-btn mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl px-6 text-base font-bold"
                >
                  Ver cómo lo recibe {config.textos.duenio}
                  <Icon name="chevronRight" className="size-5" />
                </a>
              ) : (
                <a href={`/demo/${config.slug}/panel`} className="mt-3 inline-flex min-h-11 items-center gap-1 font-semibold underline decoration-(--st-accent) decoration-2 underline-offset-4">
                  Ver cómo lo recibe {config.textos.duenio}
                  <Icon name="chevronRight" className="size-4" />
                </a>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-6 pt-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => (step === "listo" ? restart() : window.history.back())}
            className="-ml-2 inline-flex size-11 items-center justify-center rounded-full hover:bg-(--st-surface)"
            aria-label={step === "listo" ? "Hacer otra reserva" : "Volver"}
          >
            <Icon name="back" className="size-6" />
          </button>
          {config.marca.tipo === "wordmark" ? (
            <>
              <Marca marca={config.marca} size={30} />
              <span className="sr-only">{config.nombre}</span>
            </>
          ) : (
            <>
              <Marca marca={config.marca} size={32} />
              <p className="st-display truncate text-base">{config.nombre}</p>
            </>
          )}
        </div>

        {step !== "listo" ? (
          <div className="mt-4" role="progressbar" aria-label="Progreso de la reserva" aria-valuemin={1} aria-valuemax={PROGRESS} aria-valuenow={index + 1}>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-(--st-muted)">
              Paso {index + 1} de {PROGRESS}
            </p>
            <div className="mt-2 flex gap-1.5">
              {FLOW.slice(0, PROGRESS).map((s, i) => (
                <span key={s} className={`h-1 flex-1 rounded-full ${i <= index ? "bg-(--st-accent)" : "bg-(--st-border)"}`} />
              ))}
            </div>
          </div>
        ) : null}

        <h1 ref={headingRef} tabIndex={-1} className="st-display mb-5 mt-6 text-[2rem] leading-[1.05] outline-none">
          {TITLES[step]}
        </h1>

        {renderStep()}
      </main>
      <StudioFooter aviso={config.avisoDemo} />
    </div>
  );
}

export function Portada({ config, onStart }: { config: StudioDemoConfig; onStart?: () => void }) {
  const zonas = [...new Set(config.sedes.map((s) => s.nombre))];
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="relative mx-auto flex w-full max-w-lg flex-1 flex-col overflow-hidden px-5 pb-6 pt-10">
        {config.marca.tipo === "nn" ? (
          // Forma abstracta: brillo de esmalte detrás del logo
          <div aria-hidden className="st-glow pointer-events-none absolute -right-24 -top-16 size-72 rounded-full" />
        ) : null}

        <div className="relative flex flex-col items-center text-center">
          <Marca marca={config.marca} size={112} title={`Logo ${config.nombre}`} />
          {config.marca.tipo === "wordmark" ? <span aria-hidden className="mt-4 block h-px w-16 bg-(--st-accent)" /> : null}
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-(--st-muted)">{config.marca.etiqueta}</p>

          <h1 className="st-display mt-8 text-[2.75rem] leading-[0.95]">
            {config.marca.tipo === "nn" && config.marca.rayo ? <NombreConRayo nombre={config.nombre} /> : config.nombre}
          </h1>
          <p className="mt-4 text-xl font-semibold">{config.subtitulo}</p>
          <p className="mt-2 max-w-xs text-(--st-muted)">{config.bajada}</p>

          {config.rating ? (
            <p className="mt-4 text-xs text-(--st-muted)">
              {config.rating.valor.toLocaleString("es-AR")} <span className="text-(--st-accent)">★</span> en {config.rating.fuente} ({config.rating.resenas}{" "}
              reseñas)
            </p>
          ) : null}
        </div>

        <ol className="relative mt-10 space-y-2">
          {config.textos.pasosPortada.map((t, i) => (
            <li key={t} className="flex items-center gap-3 rounded-2xl border border-(--st-border) bg-(--st-surface) px-4 py-3">
              <span className="st-display flex size-8 shrink-0 items-center justify-center rounded-full border border-(--st-accent) text-sm text-(--st-accent)">
                {i + 1}
              </span>
              <span className="font-medium">{t}</span>
            </li>
          ))}
        </ol>
        <p className="relative mt-3 text-center text-sm text-(--st-muted)">Tu turno queda reservado al instante.</p>

        <div className="relative mt-8">
          <PrimaryButton type="button" onClick={onStart}>
            Reservar turno
          </PrimaryButton>
        </div>

        {config.sedes.length === 1 ? (
          // Una sola sede: no hay paso de sede, así que la dirección y "Cómo llegar" van en la portada.
          <p className="relative mt-6 text-center text-xs text-(--st-muted)">
            {config.sedes[0].nombre}, {config.sedes[0].zona} ·{" "}
            <a href={mapsUrl(config.sedes[0].direccion)} target="_blank" rel="noopener" className="font-semibold text-(--st-text) underline underline-offset-2">
              Cómo llegar
            </a>
          </p>
        ) : (
          <p className="relative mt-6 text-center text-xs text-(--st-muted)">{zonas.join(" · ")}</p>
        )}
        {config.instagram ? (
          <p className="relative mt-2 text-center text-xs">
            <a href={config.instagram.url} target="_blank" rel="noopener" className="text-(--st-muted) underline underline-offset-2">
              @{config.instagram.usuario}
            </a>
          </p>
        ) : null}
      </main>
      <StudioFooter aviso={config.avisoDemo} />
    </div>
  );
}

function capitalizeFirst(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** El rayo de su Instagram ("NatiNails ⚡") pegado a la última palabra, en el color de acento. */
function NombreConRayo({ nombre }: { nombre: string }) {
  const words = nombre.split(" ");
  const last = words.pop();
  return (
    <>
      {words.join(" ")}{" "}
      <span className="whitespace-nowrap">
        {last}
        <svg aria-hidden viewBox="0 0 24 24" className="ml-1.5 inline-block size-7 -translate-y-4 fill-(--st-accent)">
          <path d="M13.5 2 4 13.5h6.5L9.5 22 20 9.5h-6.6L13.5 2z" />
        </svg>
      </span>
    </>
  );
}
