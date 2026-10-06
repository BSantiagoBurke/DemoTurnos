import { slotsForDate, type AvailabilityInput } from "./availability";
import type { BookingRepository } from "./repositories";
import { assignProfesional } from "./slots";
import { toLocalDate } from "./time";
import type { Booking } from "./types";

export type ConfirmResult = { ok: true; booking: Booking } | { ok: false; reason: "slot_taken" };

/**
 * Confirma un turno volviendo a leer el estado actual: si alguien tomó el horario
 * mientras el cliente completaba sus datos, no se crea un turno superpuesto.
 */
export async function confirmBooking(
  repository: BookingRepository,
  input: Omit<AvailabilityInput, "bookings" | "blocks">,
  slotStart: string,
  customer: { name: string; phone: string },
): Promise<ConfirmResult> {
  const [bookings, blocks] = await Promise.all([repository.list(), repository.listBlocks()]);
  const slot = slotsForDate({ ...input, bookings, blocks }, toLocalDate(slotStart)).find((s) => s.start === slotStart);
  const profesionalId = slot ? assignProfesional(slot, input.profesionalId) : null;
  if (!slot || !profesionalId) return { ok: false, reason: "slot_taken" };

  const booking = await repository.create({
    servicioId: input.servicioId,
    sedeId: input.sedeId,
    profesionalId,
    start: slot.start,
    end: slot.end,
    customerName: customer.name.trim(),
    customerPhone: customer.phone,
  });
  return { ok: true, booking };
}
