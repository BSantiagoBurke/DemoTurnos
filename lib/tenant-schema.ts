import { z } from "zod";
import type { TenantTurnosConfig } from "./types";

// Mensajes de error de zod en español.
z.config(z.locales.es());

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

const dayHours = z
  .object({
    open: z.string().regex(TIME, 'Usá formato "HH:mm", ej. "09:00"'),
    close: z.string().regex(TIME, 'Usá formato "HH:mm", ej. "20:00"'),
  })
  .refine((h) => minutes(h.close) > minutes(h.open), {
    message: "El cierre tiene que ser posterior a la apertura",
    path: ["close"],
  })
  .nullable();

const id = z.string().regex(SLUG, "Solo minúsculas, números y guiones");

export const tenantTurnosSchema = z
  .object({
    slug: id,
    type: z.literal("turnos"),
    name: z.string().min(1, "Falta el nombre del negocio"),
    tagline: z.string().optional(),
    logo: z.string().startsWith("/tenants/", 'El logo tiene que estar en "/tenants/<slug>/"'),
    colors: z.object({
      primary: z.string().regex(HEX, "Color hexadecimal, ej. #1f2937"),
      accent: z.string().regex(HEX, "Color hexadecimal, ej. #f59e0b"),
    }),
    whatsapp: z.string().regex(/^549\d{10}$/, "Formato 549 + área + número, sin + ni espacios (13 dígitos)"),
    adminPin: z.string().regex(/^\d{4,6}$/, "PIN de 4 a 6 dígitos"),
    slotStepMin: z.number().int().min(5).max(120),
    bookingWindowDays: z.number().int().min(1).max(60),
    showPrices: z.boolean().optional(),
    sedes: z
      .array(
        z.object({
          id,
          name: z.string().min(1),
          address: z.string().min(1),
          hours: z.object({
            "0": dayHours,
            "1": dayHours,
            "2": dayHours,
            "3": dayHours,
            "4": dayHours,
            "5": dayHours,
            "6": dayHours,
          }),
        }),
      )
      .min(1, "Tiene que haber al menos una sede"),
    profesionales: z
      .array(
        z.object({
          id,
          name: z.string().min(1),
          photo: z.string().optional(),
          sedeIds: z.array(z.string()).min(1, "Asigná al menos una sede"),
          servicioIds: z.array(z.string()).min(1, "Asigná al menos un servicio"),
        }),
      )
      .min(1, "Tiene que haber al menos un profesional"),
    servicios: z
      .array(
        z.object({
          id,
          name: z.string().min(1),
          durationMin: z.number().int().min(5),
          price: z.number().min(0),
          description: z.string().optional(),
        }),
      )
      .min(1, "Tiene que haber al menos un servicio"),
  })
  .superRefine((t, ctx) => {
    const checkUnique = (key: "sedes" | "profesionales" | "servicios") => {
      const seen = new Set<string>();
      t[key].forEach((item, i) => {
        if (seen.has(item.id)) {
          ctx.addIssue({ code: "custom", path: [key, i, "id"], message: `id repetido "${item.id}"` });
        }
        seen.add(item.id);
      });
    };
    checkUnique("sedes");
    checkUnique("profesionales");
    checkUnique("servicios");

    const sedeIds = new Set(t.sedes.map((s) => s.id));
    const servicioIds = new Set(t.servicios.map((s) => s.id));

    t.profesionales.forEach((p, i) => {
      p.sedeIds.forEach((sid, j) => {
        if (!sedeIds.has(sid)) {
          ctx.addIssue({ code: "custom", path: ["profesionales", i, "sedeIds", j], message: `La sede "${sid}" no existe` });
        }
      });
      p.servicioIds.forEach((sid, j) => {
        if (!servicioIds.has(sid)) {
          ctx.addIssue({
            code: "custom",
            path: ["profesionales", i, "servicioIds", j],
            message: `El servicio "${sid}" no existe`,
          });
        }
      });
    });

    t.servicios.forEach((s, i) => {
      if (!t.profesionales.some((p) => p.servicioIds.includes(s.id))) {
        ctx.addIssue({ code: "custom", path: ["servicios", i], message: `Ningún profesional hace "${s.name}"` });
      }
    });
  });

// Garantiza que el schema y el tipo del modelo no se desincronicen.
type SchemaOutput = z.infer<typeof tenantTurnosSchema>;
export type AssertSchemaMatches = SchemaOutput extends TenantTurnosConfig ? true : never;
const assertSchemaMatches: AssertSchemaMatches = true;
void assertSchemaMatches;

/** Errores de zod en una línea por campo: "profesionales.2.sedeIds.0: La sede ... no existe". */
export function formatTenantErrors(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length ? issue.path.join(".") : "(raíz)";
    return `${path}: ${issue.message}`;
  });
}

export type ValidationResult =
  | { ok: true; config: TenantTurnosConfig }
  | { ok: false; errors: string[] };

export function validateTenant(raw: unknown, expectedSlug?: string): ValidationResult {
  const parsed = tenantTurnosSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: formatTenantErrors(parsed.error) };
  if (expectedSlug && parsed.data.slug !== expectedSlug) {
    return { ok: false, errors: [`slug: es "${parsed.data.slug}" pero el archivo se llama "${expectedSlug}.json"`] };
  }
  return { ok: true, config: parsed.data };
}
