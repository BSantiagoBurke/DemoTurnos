"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Booking, BookingStatus } from "@/lib/types";

type Props = { booking: Booking; onChangeStatus: (id: string, status: BookingStatus) => void; compact?: boolean };

/** Atender, cancelar (con confirmación en el mismo lugar) o volver a confirmado. */
export function BookingActions({ booking, onChangeStatus, compact }: Props) {
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const size = compact ? "min-h-11 px-3 text-sm" : "";

  if (booking.status !== "confirmed") {
    return (
      <Button variant="ghost" className={size} onClick={() => onChangeStatus(booking.id, "confirmed")}>
        Deshacer
      </Button>
    );
  }
  if (confirmingCancel) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-700">¿Cancelar el turno?</span>
        <Button variant="danger" className={size} onClick={() => onChangeStatus(booking.id, "cancelled")}>
          Sí, cancelar
        </Button>
        <Button variant="ghost" className={size} onClick={() => setConfirmingCancel(false)}>
          No
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      <Button className={size} onClick={() => onChangeStatus(booking.id, "done")}>
        Marcar atendido
      </Button>
      <Button variant="danger" className={size} onClick={() => setConfirmingCancel(true)}>
        Cancelar
      </Button>
    </div>
  );
}
