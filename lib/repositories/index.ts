import { generateSeedData } from "../seed/turnos";
import type { TenantTurnosConfig } from "../types";
import { LocalStorageBookingRepository, type BookingRepository } from "./booking";

/**
 * Punto único donde se elige la implementación del repositorio.
 * Para producción: devolver acá un ApiBookingRepository (NestJS + PostgreSQL).
 */
export function createBookingRepository(config: TenantTurnosConfig): BookingRepository {
  return new LocalStorageBookingRepository(config.slug, () => generateSeedData(config, new Date()));
}

export type { BookingRepository, NewBlock, NewBooking } from "./booking";
