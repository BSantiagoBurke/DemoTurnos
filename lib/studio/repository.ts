import { createSafeStore, type KeyValueStore } from "../repositories/storage";
import { assignProfesional, checkSlot, seedBookings, sortBookings } from "./agenda";
import type { StudioBlock, StudioBooking, StudioBookingStatus, StudioDemoConfig } from "./types";

export type NewStudioBooking = Omit<StudioBooking, "id" | "slug" | "status" | "origen" | "createdAt">;
export type NewStudioBlock = Omit<StudioBlock, "id" | "slug">;

/**
 * Contrato de persistencia de la plantilla estudio. La reserva y el panel solo conocen esta interfaz:
 * en producción se implementa contra una API (NestJS + PostgreSQL) sin tocar componentes.
 */
export interface StudioRepository {
  list(): Promise<StudioBooking[]>;
  listBlocks(): Promise<StudioBlock[]>;
  /**
   * Guarda el turno si el horario sigue libre. Si no, lanza SlotTakenError.
   * En demos con profesionales, sin `profesionalId` ("Sin preferencia") asigna al primero con lugar.
   */
  create(input: NewStudioBooking): Promise<StudioBooking>;
  updateStatus(id: string, status: StudioBookingStatus): Promise<StudioBooking>;
  createBlock(input: NewStudioBlock): Promise<StudioBlock>;
  deleteBlock(id: string): Promise<void>;
  reset(): Promise<void>;
}

export class SlotTakenError extends Error {
  constructor(public readonly reason: string) {
    super(`El horario ya no está disponible (${reason})`);
    this.name = "SlotTakenError";
  }
}

export class StudioBookingNotFoundError extends Error {
  constructor(id: string) {
    super(`No existe el turno ${id}`);
    this.name = "StudioBookingNotFoundError";
  }
}

export function studioStorageKeys(slug: string) {
  const base = `beecode:estudio:${slug}`;
  return { bookings: `${base}:bookings`, blocks: `${base}:blocks`, seededOn: `${base}:seeded-on` };
}

function newId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `${prefix}_${random}`;
}

type Clock = () => { today: string; nowMin: number; iso: string };

export class LocalStorageStudioRepository implements StudioRepository {
  private readonly keys: ReturnType<typeof studioStorageKeys>;

  constructor(
    private readonly config: StudioDemoConfig,
    private readonly clock: Clock,
    private readonly store: KeyValueStore = createSafeStore(),
  ) {
    this.keys = studioStorageKeys(config.slug);
  }

  private read<T>(key: string): T[] {
    const raw = this.store.get(key);
    if (!raw) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }

  private write<T>(key: string, items: T[]): void {
    this.store.set(key, JSON.stringify(items));
  }

  /**
   * Los turnos de ejemplo se regeneran una vez por día (para que la agenda siempre arranque hoy).
   * Las reservas hechas desde la web, sus cambios de estado y los bloqueos se conservan.
   */
  private ensureSeeded(): void {
    const { today, nowMin } = this.clock();
    if (this.store.get(this.keys.seededOn) === today) return;
    const kept = this.read<StudioBooking>(this.keys.bookings).filter((b) => b.origen === "web");
    const seed = seedBookings(this.config, today, nowMin, this.config.reserva.diasVisibles);
    this.write(this.keys.bookings, sortBookings([...seed, ...kept]));
    this.store.set(this.keys.seededOn, today);
  }

  async list(): Promise<StudioBooking[]> {
    this.ensureSeeded();
    return sortBookings(this.read<StudioBooking>(this.keys.bookings));
  }

  async listBlocks(): Promise<StudioBlock[]> {
    this.ensureSeeded();
    return this.read<StudioBlock>(this.keys.blocks).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  }

  async create(input: NewStudioBooking): Promise<StudioBooking> {
    this.ensureSeeded();
    const bookings = this.read<StudioBooking>(this.keys.bookings);
    const blocks = this.read<StudioBlock>(this.keys.blocks);
    let profesionalId = input.profesionalId;
    if (this.config.profesionales?.length && !profesionalId) {
      profesionalId = assignProfesional(this.config, bookings, blocks, input) ?? undefined;
      if (!profesionalId) throw new SlotTakenError("ocupado");
    }
    const withPro = profesionalId ? { ...input, profesionalId } : input;
    const check = checkSlot(this.config, bookings, blocks, withPro);
    if (!check.ok) throw new SlotTakenError(check.reason);
    const booking: StudioBooking = {
      ...withPro,
      id: newId("tn"),
      slug: this.config.slug,
      status: "confirmado",
      origen: "web",
      createdAt: this.clock().iso,
    };
    this.write(this.keys.bookings, sortBookings([...bookings, booking]));
    return booking;
  }

  async updateStatus(id: string, status: StudioBookingStatus): Promise<StudioBooking> {
    this.ensureSeeded();
    const bookings = this.read<StudioBooking>(this.keys.bookings);
    const index = bookings.findIndex((b) => b.id === id);
    if (index === -1) throw new StudioBookingNotFoundError(id);
    const current = bookings[index];
    // Reactivar un cancelado solo si el horario sigue libre.
    if (current.status === "cancelado" && status !== "cancelado") {
      const others = bookings.filter((b) => b.id !== id);
      const check = checkSlot(this.config, others, this.read<StudioBlock>(this.keys.blocks), current);
      if (!check.ok) throw new SlotTakenError(check.reason);
    }
    const updated = { ...current, status };
    bookings[index] = updated;
    this.write(this.keys.bookings, bookings);
    return updated;
  }

  async createBlock(input: NewStudioBlock): Promise<StudioBlock> {
    this.ensureSeeded();
    const block: StudioBlock = { ...input, id: newId("bl"), slug: this.config.slug };
    this.write(this.keys.blocks, [...this.read<StudioBlock>(this.keys.blocks), block]);
    return block;
  }

  async deleteBlock(id: string): Promise<void> {
    this.ensureSeeded();
    this.write(
      this.keys.blocks,
      this.read<StudioBlock>(this.keys.blocks).filter((b) => b.id !== id),
    );
  }

  async reset(): Promise<void> {
    this.store.remove(this.keys.bookings);
    this.store.remove(this.keys.blocks);
    this.store.remove(this.keys.seededOn);
    this.ensureSeeded();
  }
}
