"use client";

import Link from "next/link";
import { useMemo, useReducer, useRef, useEffect, useState } from "react";
import { TenantLogo } from "@/components/turnos/TenantLogo";
import { Icon } from "@/components/ui/Icon";
import { Stepper } from "@/components/ui/Stepper";
import { dayOptions, slotsForDate } from "@/lib/availability";
import { STEP_LABELS, createFlowReducer, initialFlowState, sedesForServicio, visibleSteps } from "@/lib/booking-flow";
import { confirmBooking } from "@/lib/booking-service";
import { useBookingData } from "@/lib/hooks/useBookingData";
import { useNow } from "@/lib/hooks/useNow";
import { eligibleProfesionales } from "@/lib/slots";
import { findProfesional, findSede, findServicio } from "@/lib/tenant-lookup";
import { formatLongDate, toLocalDate, toLocalTime } from "@/lib/time";
import { ANY_PROFESIONAL, type TenantTurnosConfig } from "@/lib/types";
import { BookingSummary } from "./BookingSummary";
import { ConfirmacionStep } from "./ConfirmacionStep";
import { DatosStep } from "./DatosStep";
import { FechaStep } from "./FechaStep";
import { HorarioStep } from "./HorarioStep";
import { ProfesionalStep } from "./ProfesionalStep";
import { SedeStep } from "./SedeStep";
import { ServicioStep } from "./ServicioStep";

export function BookingFlow({ config }: { config: TenantTurnosConfig }) {
  const reducer = useMemo(() => createFlowReducer(config), [config]);
  const [state, dispatch] = useReducer(reducer, initialFlowState);
  const { bookings, blocks, loaded, repository, refresh } = useBookingData(config);
  const now = useNow();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Al cambiar de paso, el foco va al título (lectores de pantalla) y se vuelve arriba.
  useEffect(() => {
    window.scrollTo({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
  }, [state.step]);

  const steps = visibleSteps(config, state);
  const stepIndex = steps.indexOf(state.step);
  const servicio = findServicio(config, state.servicioId);
  const sede = findSede(config, state.sedeId);
  const showPrices = config.showPrices ?? true;

  const availability =
    now && state.servicioId && state.sedeId && state.profesionalId
      ? { config, servicioId: state.servicioId, sedeId: state.sedeId, profesionalId: state.profesionalId, bookings, blocks, now }
      : null;

  const summary =
    servicio && sede && state.slotStart ? (
      <BookingSummary
        servicio={servicio}
        sede={sede}
        profesional={
          state.booking
            ? findProfesional(config, state.booking.profesionalId)
            : state.profesionalId === ANY_PROFESIONAL
              ? undefined
              : findProfesional(config, state.profesionalId)
        }
        dateLabel={formatLongDate(toLocalDate(state.slotStart))}
        time={toLocalTime(state.slotStart)}
        showPrice={showPrices}
      />
    ) : null;

  const handleConfirm = async (customer: { name: string; phone: string }) => {
    if (!state.servicioId || !state.sedeId || !state.profesionalId || !state.slotStart) return;
    setSubmitting(true);
    setError(null);
    const input = {
      config,
      servicioId: state.servicioId,
      sedeId: state.sedeId,
      profesionalId: state.profesionalId,
      now: new Date(),
    };
    const result = await confirmBooking(repository, input, state.slotStart, customer);
    setSubmitting(false);
    if (result.ok) {
      await refresh();
      dispatch({ type: "confirmed", booking: result.booking });
    } else {
      await refresh();
      setError("Ese horario se acaba de ocupar. Elegí otro, por favor.");
      dispatch({ type: "goTo", step: "horario" });
    }
  };

  const renderStep = () => {
    switch (state.step) {
      case "servicio":
        return <ServicioStep config={config} selectedId={state.servicioId} onSelect={(id) => dispatch({ type: "selectServicio", id })} />;
      case "sede":
        return (
          <SedeStep
            sedes={state.servicioId ? sedesForServicio(config, state.servicioId) : config.sedes}
            selectedId={state.sedeId}
            onSelect={(id) => dispatch({ type: "selectSede", id })}
          />
        );
      case "profesional":
        return (
          <ProfesionalStep
            profesionales={
              state.sedeId && state.servicioId ? eligibleProfesionales(config.profesionales, state.sedeId, state.servicioId) : []
            }
            selectedId={state.profesionalId}
            onSelect={(id) => dispatch({ type: "selectProfesional", id })}
          />
        );
      case "fecha":
        if (!availability || !loaded || !now) return <LoadingBlock />;
        return (
          <FechaStep
            days={dayOptions(availability)}
            today={toLocalDate(now)}
            selected={state.date}
            onSelect={(date) => dispatch({ type: "selectDate", date })}
          />
        );
      case "horario":
        if (!availability || !state.date || !loaded) return <LoadingBlock />;
        return (
          <>
            {error ? (
              <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">
                {error}
              </p>
            ) : null}
            <p className="mb-4 text-slate-700">{formatLongDate(state.date)}</p>
            <HorarioStep
              slots={slotsForDate(availability, state.date)}
              selected={state.slotStart}
              onSelect={(start) => {
                setError(null);
                dispatch({ type: "selectSlot", start });
              }}
              onChangeDate={() => dispatch({ type: "goTo", step: "fecha" })}
            />
          </>
        );
      case "datos":
        return <DatosStep summary={summary} submitting={submitting} onSubmit={handleConfirm} />;
      case "confirmacion": {
        const pro = state.booking ? findProfesional(config, state.booking.profesionalId) : undefined;
        if (!state.booking || !servicio || !sede || !pro) return null;
        return (
          <ConfirmacionStep
            config={config}
            booking={state.booking}
            servicio={servicio}
            sede={sede}
            profesional={pro}
            summary={summary}
            onRestart={() => dispatch({ type: "restart" })}
          />
        );
      }
    }
  };

  const isDone = state.step === "confirmacion";

  return (
    <main className="mx-auto w-full max-w-lg px-4 pb-8 pt-4">
      <div className="flex items-center gap-3">
        {stepIndex > 0 && !isDone ? (
          <button
            type="button"
            onClick={() => dispatch({ type: "back" })}
            className="-ml-2 inline-flex size-11 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100"
            aria-label="Atrás"
          >
            <Icon name="back" className="size-6" />
          </button>
        ) : (
          <Link
            href={`/turnos/${config.slug}`}
            className="-ml-2 inline-flex size-11 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100"
            aria-label={`Volver a ${config.name}`}
          >
            <Icon name="back" className="size-6" />
          </Link>
        )}
        <TenantLogo tenant={config} size={36} />
        <p className="truncate font-semibold text-slate-900">{config.name}</p>
      </div>

      {!isDone ? (
        <div className="mt-4">
          <Stepper current={stepIndex} total={steps.length - 1} label={STEP_LABELS[state.step]} />
        </div>
      ) : null}

      <h1 ref={headingRef} tabIndex={-1} className={isDone ? "sr-only" : "mb-4 mt-5 text-2xl font-bold text-slate-900 outline-none"}>
        {STEP_LABELS[state.step]}
      </h1>

      <div className={isDone ? "mt-6" : ""}>{renderStep()}</div>
    </main>
  );
}

function LoadingBlock() {
  return (
    <div className="grid grid-cols-3 gap-2" aria-busy="true" aria-label="Cargando disponibilidad">
      {Array.from({ length: 9 }, (_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200" />
      ))}
    </div>
  );
}
