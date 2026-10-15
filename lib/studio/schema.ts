import { z } from "zod";
import { contrastRatio } from "../color";
import type { StudioDemoConfig } from "./types";

z.config(z.locales.es());

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const HEX = /^#[0-9a-fA-F]{6}$/;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

const id = z.string().regex(SLUG, "Solo minúsculas, números y guiones");
const hex = z.string().regex(HEX, "Color hexadecimal de 6 dígitos, ej. #e8335a");

const dayHours = z
  .object({ open: z.string().regex(TIME), close: z.string().regex(TIME) })
  .refine((h) => minutes(h.close) > minutes(h.open), { message: "El cierre tiene que ser posterior a la apertura" })
  .nullable();

export const studioDemoSchema = z
  .object({
    slug: id,
    plantilla: z.literal("estudio"),
    nombre: z.string().min(1),
    subtitulo: z.string().min(1),
    bajada: z.string().min(1),
    rating: z
      .object({ valor: z.number().min(1).max(5), resenas: z.number().int().min(1), fuente: z.string().min(1) })
      .optional(),
    instagram: z.object({ usuario: z.string().min(1), url: z.url() }).optional(),
    whatsapp: z.string().regex(/^549\d{10}$/, "Formato 549 + área + número, sin + ni espacios"),
    adminPin: z.string().regex(/^\d{4,6}$/, "PIN de 4 a 6 dígitos"),
    colores: z.object({
      fondo: hex,
      superficie: hex,
      borde: hex,
      texto: hex,
      textoSuave: hex,
      acento: hex,
      textoSobreAcento: hex,
    }),
    reserva: z.object({
      diasVisibles: z.number().int().min(1).max(60),
      bloqueMin: z.number().int().min(5).max(120),
      anticipacionMin: z.number().int().min(0),
    }),
    sedes: z
      .array(
        z.object({
          id,
          nombre: z.string().min(1),
          zona: z.string().min(1),
          direccion: z.string().min(1),
          horarios: z.object({
            0: dayHours,
            1: dayHours,
            2: dayHours,
            3: dayHours,
            4: dayHours,
            5: dayHours,
            6: dayHours,
          }),
          horarioAConfirmar: z.boolean().optional(),
          ocupacionEjemplo: z.number().min(0).max(1),
        }),
      )
      .min(1),
    categorias: z
      .array(
        z.object({
          id,
          nombre: z.string().min(1),
          servicios: z
            .array(
              z.object({
                id,
                nombre: z.string().min(1),
                duracionMin: z.number().int().min(5),
                descripcion: z.string().optional(),
                ejemplo: z.boolean().optional(),
              }),
            )
            .min(1),
        }),
      )
      .min(1),
    extras: z.array(
      z.object({
        id,
        nombre: z.string().min(1),
        duracionMin: z.number().int().min(5),
        desde: z.boolean().optional(),
        descripcion: z.string().optional(),
        soloCategorias: z.array(z.string()).optional(),
        ejemplo: z.boolean().optional(),
      }),
    ),
    og: z.object({ titulo: z.string().min(1), descripcion: z.string().min(1) }),
    avisoDemo: z.string().min(1),
  })
  .superRefine((c, ctx) => {
    const unique = (path: string, ids: string[]) => {
      const seen = new Set<string>();
      for (const value of ids) {
        if (seen.has(value)) ctx.addIssue({ code: "custom", path: [path], message: `id repetido "${value}"` });
        seen.add(value);
      }
    };
    unique("sedes", c.sedes.map((s) => s.id));
    unique("categorias", c.categorias.map((s) => s.id));
    unique("servicios", c.categorias.flatMap((cat) => cat.servicios.map((s) => s.id)));
    unique("extras", c.extras.map((e) => e.id));

    const categoriaIds = new Set(c.categorias.map((cat) => cat.id));
    c.extras.forEach((e, i) => {
      e.soloCategorias?.forEach((cat) => {
        if (!categoriaIds.has(cat)) {
          ctx.addIssue({ code: "custom", path: ["extras", i, "soloCategorias"], message: `La categoría "${cat}" no existe` });
        }
      });
    });
  });

type SchemaOutput = z.infer<typeof studioDemoSchema>;
export type AssertStudioSchemaMatches = SchemaOutput extends StudioDemoConfig ? true : never;
const assertMatches: AssertStudioSchemaMatches = true;
void assertMatches;

export type StudioValidation = { ok: true; warnings: string[] } | { ok: false; errors: string[]; warnings: string[] };

/** Valida la config y chequea contraste (AA) de los pares de color que usa la plantilla. */
export function validateStudioDemo(raw: unknown): StudioValidation {
  const parsed = studioDemoSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((i) => `${i.path.join(".") || "(raíz)"}: ${i.message}`),
      warnings: [],
    };
  }
  const c = parsed.data.colores;
  const errors: string[] = [];
  const pairs: [string, string, string, number][] = [
    ["texto sobre fondo", c.texto, c.fondo, 4.5],
    ["texto sobre superficie", c.texto, c.superficie, 4.5],
    ["textoSuave sobre fondo", c.textoSuave, c.fondo, 4.5],
    ["textoSuave sobre superficie", c.textoSuave, c.superficie, 4.5],
    // Botones: texto en negrita de 18px o más, alcanza con 3:1 (AA texto grande).
    ["textoSobreAcento sobre acento", c.textoSobreAcento, c.acento, 3],
    ["acento sobre fondo", c.acento, c.fondo, 3],
  ];
  for (const [label, fg, bg, min] of pairs) {
    const ratio = contrastRatio(fg, bg);
    if (ratio < min) errors.push(`colores: ${label} tiene contraste ${ratio.toFixed(2)}:1 (mínimo ${min}:1)`);
  }

  const warnings: string[] = [];
  const ejemplos = parsed.data.categorias.flatMap((cat) => cat.servicios).filter((s) => s.ejemplo).length;
  if (ejemplos > 0) warnings.push(`${ejemplos} servicios marcados como ejemplo (a confirmar)`);
  const aConfirmar = parsed.data.sedes.filter((s) => s.horarioAConfirmar).map((s) => s.nombre);
  if (aConfirmar.length > 0) warnings.push(`horario a confirmar: ${aConfirmar.join(", ")}`);

  return errors.length ? { ok: false, errors, warnings } : { ok: true, warnings };
}
