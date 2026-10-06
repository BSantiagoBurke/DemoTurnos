import { eligibleProfesionales } from "./slots";
import { ANY_PROFESIONAL, type Booking, type ProfesionalChoice, type TenantTurnosConfig } from "./types";
import type { LocalDate } from "./time";

export type StepName = "servicio" | "sede" | "profesional" | "fecha" | "horario" | "datos" | "confirmacion";

export const STEP_LABELS: Record<StepName, string> = {
  servicio: "Elegí el servicio",
  sede: "Elegí la sede",
  profesional: "Elegí con quién",
  fecha: "Elegí el día",
  horario: "Elegí tu horario",
  datos: "Tus datos",
  confirmacion: "Listo",
};

export type FlowState = {
  step: StepName;
  servicioId: string | null;
  sedeId: string | null;
  profesionalId: ProfesionalChoice | null;
  date: LocalDate | null;
  slotStart: string | null;
  booking: Booking | null;
};

export type FlowAction =
  | { type: "selectServicio"; id: string }
  | { type: "selectSede"; id: string }
  | { type: "selectProfesional"; id: ProfesionalChoice }
  | { type: "selectDate"; date: LocalDate }
  | { type: "selectSlot"; start: string }
  | { type: "goTo"; step: StepName }
  | { type: "back" }
  | { type: "confirmed"; booking: Booking }
  | { type: "restart" };

export const initialFlowState: FlowState = {
  step: "servicio",
  servicioId: null,
  sedeId: null,
  profesionalId: null,
  date: null,
  slotStart: null,
  booking: null,
};

/** Sedes donde al menos un profesional hace el servicio. */
export function sedesForServicio(config: TenantTurnosConfig, servicioId: string) {
  return config.sedes.filter((s) => eligibleProfesionales(config.profesionales, s.id, servicioId).length > 0);
}

/** Pasos visibles: sede y profesional se omiten cuando hay una sola opción. */
export function visibleSteps(config: TenantTurnosConfig, state: FlowState): StepName[] {
  const steps: StepName[] = ["servicio"];
  const sedes = state.servicioId ? sedesForServicio(config, state.servicioId) : config.sedes;
  if (sedes.length > 1) steps.push("sede");
  const pros =
    state.servicioId && state.sedeId ? eligibleProfesionales(config.profesionales, state.sedeId, state.servicioId) : [];
  if (!state.servicioId || !state.sedeId || pros.length > 1) steps.push("profesional");
  steps.push("fecha", "horario", "datos", "confirmacion");
  return steps;
}

function nextStep(config: TenantTurnosConfig, state: FlowState): StepName {
  const steps = visibleSteps(config, state);
  const i = steps.indexOf(state.step);
  return steps[Math.min(i + 1, steps.length - 1)];
}

/** Completa automáticamente sede y profesional cuando hay una sola opción. */
function autofill(config: TenantTurnosConfig, state: FlowState): FlowState {
  if (!state.servicioId) return state;
  let next = state;
  const sedes = sedesForServicio(config, state.servicioId);
  if (sedes.length === 1) next = { ...next, sedeId: sedes[0].id };
  if (next.sedeId) {
    const pros = eligibleProfesionales(config.profesionales, next.sedeId, state.servicioId);
    if (pros.length === 1) next = { ...next, profesionalId: pros[0].id };
  }
  return next;
}

/** ¿La elección de profesional sigue siendo válida para el servicio y sede actuales? */
function keepProfesional(config: TenantTurnosConfig, state: FlowState): ProfesionalChoice | null {
  const { profesionalId, sedeId, servicioId } = state;
  if (!profesionalId || !sedeId || !servicioId) return null;
  if (profesionalId === ANY_PROFESIONAL) return profesionalId;
  const ok = eligibleProfesionales(config.profesionales, sedeId, servicioId).some((p) => p.id === profesionalId);
  return ok ? profesionalId : null;
}

export function createFlowReducer(config: TenantTurnosConfig) {
  return function flowReducer(state: FlowState, action: FlowAction): FlowState {
    switch (action.type) {
      case "selectServicio": {
        let next: FlowState = { ...state, servicioId: action.id, slotStart: null };
        if (next.sedeId && !sedesForServicio(config, action.id).some((s) => s.id === next.sedeId)) {
          next = { ...next, sedeId: null };
        }
        next = { ...next, profesionalId: keepProfesional(config, next) };
        next = autofill(config, next);
        return { ...next, step: nextStep(config, next) };
      }
      case "selectSede": {
        let next: FlowState = { ...state, sedeId: action.id, slotStart: null };
        next = { ...next, profesionalId: keepProfesional(config, next) };
        next = autofill(config, next);
        return { ...next, step: nextStep(config, next) };
      }
      case "selectProfesional": {
        const next: FlowState = { ...state, profesionalId: action.id, slotStart: null };
        return { ...next, step: nextStep(config, next) };
      }
      case "selectDate": {
        const next: FlowState = { ...state, date: action.date, slotStart: action.date === state.date ? state.slotStart : null };
        return { ...next, step: nextStep(config, next) };
      }
      case "selectSlot": {
        const next: FlowState = { ...state, slotStart: action.start };
        return { ...next, step: nextStep(config, next) };
      }
      case "goTo":
        return { ...state, step: action.step };
      case "back": {
        const steps = visibleSteps(config, state);
        const i = steps.indexOf(state.step);
        return { ...state, step: steps[Math.max(i - 1, 0)] };
      }
      case "confirmed":
        return { ...state, booking: action.booking, step: "confirmacion" };
      case "restart":
        return initialFlowState;
    }
  };
}
