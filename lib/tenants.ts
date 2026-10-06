import fs from "node:fs";
import path from "node:path";
import { validateTenant } from "./tenant-schema";
import type { TenantTurnosConfig } from "./types";

/**
 * Carga de tenants desde /tenants/*.json (solo en el servidor / build).
 * Los archivos que empiezan con "_" son plantillas y se ignoran.
 */
const TENANTS_DIR = path.join(process.cwd(), "tenants");

export class TenantValidationError extends Error {
  constructor(file: string, errors: string[]) {
    super(`Tenant inválido en tenants/${file}:\n  - ${errors.join("\n  - ")}`);
    this.name = "TenantValidationError";
  }
}

export function listTenantFiles(): string[] {
  return fs
    .readdirSync(TENANTS_DIR)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .sort();
}

export function loadTenantFile(file: string): TenantTurnosConfig {
  const raw: unknown = JSON.parse(fs.readFileSync(path.join(TENANTS_DIR, file), "utf8"));
  const result = validateTenant(raw, file.replace(/\.json$/, ""));
  if (!result.ok) throw new TenantValidationError(file, result.errors);
  return result.config;
}

let cache: Map<string, TenantTurnosConfig> | null = null;

function allTenants(): Map<string, TenantTurnosConfig> {
  if (!cache) {
    cache = new Map(listTenantFiles().map((f) => {
      const config = loadTenantFile(f);
      return [config.slug, config] as const;
    }));
  }
  return cache;
}

export function getTenantSlugs(): string[] {
  return [...allTenants().keys()];
}

export function getTenant(slug: string): TenantTurnosConfig | null {
  return allTenants().get(slug) ?? null;
}
