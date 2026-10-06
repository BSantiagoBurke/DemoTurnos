import type { Block, Booking, BookingStatus } from "../types";
import { createSafeStore, type KeyValueStore } from "./storage";

export type NewBooking = Omit<Booking, "id" | "tenantSlug" | "status" | "createdAt">;
export type NewBlock = Omit<Block, "id" | "tenantSlug">;
export type SeedData = { bookings: Booking[]; blocks: Block[] };

/**
 * Contrato de persistencia de turnos. La UI solo conoce esta interfaz:
 * para pasar a producción se implementa con una API (NestJS + PostgreSQL) sin tocar componentes.
 */
export interface BookingRepository {
  list(): Promise<Booking[]>;
  create(input: NewBooking): Promise<Booking>;
  updateStatus(id: string, status: BookingStatus): Promise<Booking>;
  createBlock(input: NewBlock): Promise<Block>;
  listBlocks(): Promise<Block[]>;
  deleteBlock(id: string): Promise<void>;
  reset(): Promise<void>;
}

export class BookingNotFoundError extends Error {
  constructor(id: string) {
    super(`No existe el turno ${id}`);
    this.name = "BookingNotFoundError";
  }
}

export function storageKeys(slug: string) {
  const base = `beecode:turnos:${slug}`;
  return { bookings: `${base}:bookings`, blocks: `${base}:blocks` };
}

function newId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `${prefix}_${random}`;
}

export class LocalStorageBookingRepository implements BookingRepository {
  private readonly keys: ReturnType<typeof storageKeys>;

  constructor(
    private readonly slug: string,
    private readonly seed: () => SeedData,
    private readonly store: KeyValueStore = createSafeStore(),
    private readonly clock: () => Date = () => new Date(),
  ) {
    this.keys = storageKeys(slug);
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

  /** La primera vez que se abre la demo se cargan los datos semilla. */
  private ensureSeeded(): void {
    if (this.store.get(this.keys.bookings) !== null) return;
    const data = this.seed();
    this.write(this.keys.bookings, data.bookings);
    this.write(this.keys.blocks, data.blocks);
  }

  async list(): Promise<Booking[]> {
    this.ensureSeeded();
    return this.read<Booking>(this.keys.bookings).sort((a, b) => a.start.localeCompare(b.start));
  }

  async create(input: NewBooking): Promise<Booking> {
    this.ensureSeeded();
    const booking: Booking = {
      ...input,
      id: newId("bk"),
      tenantSlug: this.slug,
      status: "confirmed",
      createdAt: this.clock().toISOString(),
    };
    this.write(this.keys.bookings, [...this.read<Booking>(this.keys.bookings), booking]);
    return booking;
  }

  async updateStatus(id: string, status: BookingStatus): Promise<Booking> {
    this.ensureSeeded();
    const bookings = this.read<Booking>(this.keys.bookings);
    const index = bookings.findIndex((b) => b.id === id);
    if (index === -1) throw new BookingNotFoundError(id);
    const updated = { ...bookings[index], status };
    bookings[index] = updated;
    this.write(this.keys.bookings, bookings);
    return updated;
  }

  async createBlock(input: NewBlock): Promise<Block> {
    this.ensureSeeded();
    const block: Block = { ...input, id: newId("bl"), tenantSlug: this.slug };
    this.write(this.keys.blocks, [...this.read<Block>(this.keys.blocks), block]);
    return block;
  }

  async listBlocks(): Promise<Block[]> {
    this.ensureSeeded();
    return this.read<Block>(this.keys.blocks).sort((a, b) => a.start.localeCompare(b.start));
  }

  async deleteBlock(id: string): Promise<void> {
    this.ensureSeeded();
    this.write(
      this.keys.blocks,
      this.read<Block>(this.keys.blocks).filter((b) => b.id !== id),
    );
  }

  async reset(): Promise<void> {
    this.store.remove(this.keys.bookings);
    this.store.remove(this.keys.blocks);
    this.ensureSeeded();
  }
}
