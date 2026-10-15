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
  servicioLabel,
  slotsForDate,
  totalDuration,
} from "@/lib/studio/booking";
import { exampleBusy } from "@/lib/studio/busy";
import type { StudioDemoConfig } from "@/lib/studio/types";
import { useNow } from "@/lib/hooks/useNow";
import { formatArgentinePhone } from "@/lib/phone";
import { timeToMinutes, toLocalDate, toLocalTime, type LocalDate } from "@/lib/time";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { NNMonogram } from "./NNMonogram";
import { StudioFooter } from "./StudioFooter";
import { AgendaStep, DatosStep, ExtrasStep, PrimaryButton, Resumen, SedeStep, ServicioStep } from "./StudioSteps";

type Step = "portada" | "sede" | "servicio" | "extras" | "agenda" | "datos" | "confirmacion";

const FLOW: Exclude<Step, "portada">[] = ["sede", "servicio", "extras", "agenda", "datos", "confirmacion"];

const TITLES: Record<Exclude<Step, "portada">, string> = {
  sede: "¿En qué sede?",
  servicio: "Elegí el servicio",
  extras: "¿Sumás algo?",
  agenda: "Elegí día y horario",
  datos: "Tus datos",
  confirmacion: "Revisá y confirmá",
};

export function StudioBooking({ config }: { config: StudioDemoConfig }) {
  // El paso vive en la URL (?paso=...): así el "atrás" del celular vuelve un paso.
  const searchParams = useSearchParams();
  const pasoParam = searchParams.get("paso");
  const requestedStep: Step = FLOW.includes(pasoParam as (typeof FLOW)[number]) ? (pasoParam as Step) : "portada";
  const [sedeId, setSedeId] = useState<string | null>(null);
  const [servicioId, setServicioId] = useState<string | null>(null);
  const [extraIds, setExtraIds] = useState<string[]>([]);
  const [date, setDate] = useState<LocalDate | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [cliente, setCliente] = useState({ nombre: "", telefono: "" });
  const headingRef = useRef<HTMLHeadingElement>(null);
  const now = useNow();

  const sede = config.sedes.find((s) => s.id === sedeId);
  const servicio = findServicio(config, servicioId);
  const availableExtras = extrasFor(config, servicio);
  const extras = availableExtras.filter((e) => extraIds.includes(e.id));
  const duration = servicio ? totalDuration(servicio, extras) : 0;
  // Si falta un dato necesario (por ej. tras el "atrás" o "adelante" del navegador),
  // se muestra el primer paso incompleto.
  const step: Step = (() => {
    const pos = (s: Step) => FLOW.indexOf(s as (typeof FLOW)[number]);
    const need: [Step, boolean][] = [
      ["sede", !!sede],
      ["servicio", !!servicio],
      ["agenda", !!date && !!time],
      ["datos", !!cliente.nombre],
    ];
    for (const [s, ok] of need) if (!ok && pos(requestedStep) > pos(s)) return s;
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
    sede && servicio && today
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

  const busyFor = (d: LocalDate) => (sede ? exampleBusy(config.slug, sede, d, config.reserva.bloqueMin) : []);
  const days = agendaBase ? dayOptions({ ...agendaBase, days: config.reserva.diasVisibles, busyFor }) : [];

  // Día elegido; si no hay ninguno (o dejó de tener lugar), el primero con horarios libres.
  const firstFree = days.find((d) => d.open && d.freeSlots > 0)?.date ?? null;
  const selectedDay = days.find((d) => d.date === date && d.freeSlots > 0) ? date : firstFree;
  const slots = agendaBase && selectedDay ? slotsForDate({ ...agendaBase, date: selectedDay, busy: busyFor(selectedDay) }) : [];

  const resumenRows =
    sede && servicio && date && time
      ? [
          { label: "Sede", value: sede.nombre },
          { label: "Servicio", value: servicio.nombre },
          ...(extras.length ? [{ label: "Extras", value: extras.map((e) => e.nombre).join(", ") }] : []),
          { label: "Día", value: capitalizeFirst(formatMessageDate(date)) },
          { label: "Hora", value: `${time} h` },
          { label: "Duración", value: `${extras.some((e) => e.desde) ? "aprox. " : ""}${formatMinutes(duration)}` },
        ]
      : [];

  const whatsappHref =
    sede && servicio && date && time && cliente.nombre
      ? buildWhatsAppLink(
          config.whatsapp,
          buildConfirmMessage({
            sede: sede.nombre,
            servicio: servicioLabel(servicio, extras),
            dia: formatMessageDate(date),
            hora: time,
            nombre: cliente.nombre,
          }),
        )
      : null;

  const restart = () => {
    setSedeId(null);
    setServicioId(null);
    setExtraIds([]);
    setDate(null);
    setTime(null);
    go("sede");
  };

  if (step === "portada") {
    return <Portada config={config} onStart={() => go("sede")} />;
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
            onSelect={(id) => {
              if (id !== servicioId) {
                setTime(null);
                const next = findServicio(config, id);
                const allowed = new Set(extrasFor(config, next).map((e) => e.id));
                setExtraIds((prev) => prev.filter((x) => allowed.has(x)));
              }
              setServicioId(id);
              go(extrasFor(config, findServicio(config, id)).length ? "extras" : "agenda");
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
            onContinue={() => go("agenda")}
          />
        ) : null;
      case "agenda":
        if (!agendaBase) return <div className="h-64 animate-pulse rounded-2xl bg-(--st-surface)" aria-busy="true" />;
        return (
          <>
            <p className="mb-4 text-sm text-(--st-muted)">
              {sede?.nombre} · {servicio ? servicioLabel(servicio, extras) : ""} ·{" "}
              <strong className="text-(--st-text)">{formatMinutes(duration)}</strong>
            </p>
            {sede?.horarioAConfirmar ? (
              <p className="mb-4 rounded-xl border border-(--st-border) px-3 py-2 text-xs text-(--st-muted)">
                Horario de esta sede a confirmar. Mientras tanto usamos el de San Martín.
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
            summary={<Resumen rows={resumenRows} />}
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
            <Resumen rows={[...resumenRows, { label: "A nombre de", value: cliente.nombre }, { label: "WhatsApp", value: formatArgentinePhone(cliente.telefono) }]} />
            {whatsappHref ? (
              <a href={whatsappHref} target="_blank" rel="noopener" className="st-btn flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl px-6 text-lg font-bold">
                <Icon name="whatsapp" className="size-6" />
                Confirmar por WhatsApp
              </a>
            ) : null}
            <p className="text-center text-sm text-(--st-muted)">
              Se abre WhatsApp con el mensaje listo. El estudio te responde para confirmar.
            </p>
            <button type="button" onClick={restart} className="mx-auto block min-h-11 px-4 text-sm font-semibold underline underline-offset-4">
              Hacer otra reserva
            </button>
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
            onClick={() => window.history.back()}
            className="-ml-2 inline-flex size-11 items-center justify-center rounded-full hover:bg-(--st-surface)"
            aria-label="Volver"
          >
            <Icon name="back" className="size-6" />
          </button>
          <NNMonogram size={32} />
          <p className="st-display truncate text-base">{config.nombre}</p>
        </div>

        <div className="mt-4" role="progressbar" aria-label="Progreso de la reserva" aria-valuemin={1} aria-valuemax={FLOW.length} aria-valuenow={index + 1}>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-(--st-muted)">
            Paso {index + 1} de {FLOW.length}
          </p>
          <div className="mt-2 flex gap-1.5">
            {FLOW.map((s, i) => (
              <span key={s} className={`h-1 flex-1 rounded-full ${i <= index ? "bg-(--st-accent)" : "bg-(--st-border)"}`} />
            ))}
          </div>
        </div>

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
        {/* Forma abstracta: brillo de esmalte detrás del logo */}
        <div aria-hidden className="st-glow pointer-events-none absolute -right-24 -top-16 size-72 rounded-full" />

        <div className="relative flex flex-col items-center text-center">
          <NNMonogram size={112} title="Logo Nati Nails" />
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-(--st-muted)">Nati Nails | Artist</p>

          <h1 className="st-display mt-8 text-[2.75rem] leading-[0.95]">
            <NombreConRayo nombre={config.nombre} />
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
          {["Elegí tu sede", "Elegí servicio y extras", "Elegí día y horario"].map((t, i) => (
            <li key={t} className="flex items-center gap-3 rounded-2xl border border-(--st-border) bg-(--st-surface) px-4 py-3">
              <span className="st-display flex size-8 shrink-0 items-center justify-center rounded-full border border-(--st-accent) text-sm text-(--st-accent)">
                {i + 1}
              </span>
              <span className="font-medium">{t}</span>
            </li>
          ))}
        </ol>
        <p className="relative mt-3 text-center text-sm text-(--st-muted)">Confirmás por WhatsApp en un toque.</p>

        <div className="relative mt-8">
          <PrimaryButton type="button" onClick={onStart}>
            Reservar turno
          </PrimaryButton>
        </div>

        <p className="relative mt-6 text-center text-xs text-(--st-muted)">{zonas.join(" · ")}</p>
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
