export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** "09:00" / "20:00". null = cerrado. */
export type DayHours = { open: string; close: string } | null;

export type Sede = {
  id: string;
  name: string;
  address: string;
  hours: Record<Weekday, DayHours>; // 0 = domingo
};

export type Profesional = {
  id: string;
  name: string;
  photo?: string;
  sedeIds: string[];
  servicioIds: string[];
};

export type Servicio = {
  id: string;
  name: string;
  durationMin: number;
  price: number; // ARS
  description?: string;
};

export type TenantTurnosConfig = {
  slug: string;
  type: "turnos";
  name: string;
  tagline?: string;
  logo: string; // ruta en /public/tenants/<slug>/
  colors: { primary: string; accent: string };
  whatsapp: string; // formato internacional sin "+", ej. 5493811234567
  adminPin: string; // solo demo
  slotStepMin: number;
  bookingWindowDays: number;
  showPrices?: boolean; // por defecto true
  sedes: Sede[];
  profesionales: Profesional[];
  servicios: Servicio[];
};

export type BookingStatus = "confirmed" | "done" | "cancelled";

export type Booking = {
  id: string;
  tenantSlug: string;
  servicioId: string;
  sedeId: string;
  profesionalId: string;
  start: string; // ISO con offset
  end: string;
  customerName: string;
  customerPhone: string;
  status: BookingStatus;
  createdAt: string;
};

export type Block = {
  id: string;
  tenantSlug: string;
  profesionalId: string;
  start: string;
  end: string;
  reason?: string;
};

export const ANY_PROFESIONAL = "any" as const;
export type ProfesionalChoice = string | typeof ANY_PROFESIONAL;
