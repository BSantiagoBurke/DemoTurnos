import type { Profesional, Sede, Servicio, TenantTurnosConfig } from "./types";

export const findServicio = (c: TenantTurnosConfig, id: string | null): Servicio | undefined =>
  c.servicios.find((s) => s.id === id);

export const findSede = (c: TenantTurnosConfig, id: string | null): Sede | undefined => c.sedes.find((s) => s.id === id);

export const findProfesional = (c: TenantTurnosConfig, id: string | null): Profesional | undefined =>
  c.profesionales.find((p) => p.id === id);
