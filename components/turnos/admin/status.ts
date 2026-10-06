import type { BookingStatus } from "@/lib/types";

export const STATUS_LABEL: Record<BookingStatus, string> = {
  confirmed: "Confirmado",
  done: "Atendido",
  cancelled: "Cancelado",
};

export const STATUS_TONE = {
  confirmed: "info",
  done: "success",
  cancelled: "danger",
} as const;

/** Clases de la tarjeta de turno según estado (grilla y lista). */
export const STATUS_CARD: Record<BookingStatus, string> = {
  confirmed: "border-l-primary bg-white",
  done: "border-l-emerald-600 bg-emerald-50",
  cancelled: "border-l-red-400 bg-slate-50 opacity-70",
};
