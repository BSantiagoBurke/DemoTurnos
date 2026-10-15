/**
 * Valida todos los tenants contra el schema zod y chequea que exista el logo.
 * Uso: npm run validate-tenants
 */
import fs from "node:fs";
import path from "node:path";
import { studioDemos } from "../demos";
import { contrastRatio } from "../lib/color";
import { validateStudioDemo } from "../lib/studio/schema";
import { validateTenant } from "../lib/tenant-schema";

const root = process.cwd();
const dir = path.join(root, "tenants");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json") && !f.startsWith("_")).sort();

let failed = 0;

for (const file of files) {
  const slug = file.replace(/\.json$/, "");
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
  } catch (error) {
    failed++;
    console.error(`✖ ${file}\n  - JSON mal formado: ${(error as Error).message}`);
    continue;
  }

  const result = validateTenant(raw, slug);
  const errors = result.ok ? [] : [...result.errors];
  const warnings: string[] = [];

  if (result.ok) {
    const logo = path.join(root, "public", result.config.logo);
    if (!fs.existsSync(logo)) errors.push(`logo: no existe el archivo public${result.config.logo}`);
    if (result.config.whatsapp === "5493810000000") warnings.push("whatsapp: sigue el número de ejemplo");
    const { primary } = result.config.colors;
    if (contrastRatio(primary, "#ffffff") < 4.5) {
      warnings.push(`colors.primary: ${primary} tiene poco contraste con blanco; los botones van a usar texto oscuro`);
    }
  }

  if (errors.length > 0) {
    failed++;
    console.error(`✖ ${file}\n${errors.map((e) => `  - ${e}`).join("\n")}`);
  } else {
    console.log(`✔ ${file}`);
  }
  warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
}

// Demos con plantilla "estudio" (demos/*.ts, ruta /demo/<slug>).
const studioSlugs = new Set<string>();
for (const demo of studioDemos) {
  const label = `demos/${demo.slug}.ts`;
  const result = validateStudioDemo(demo);
  const errors = result.ok ? [] : [...result.errors];
  if (studioSlugs.has(demo.slug)) errors.push(`slug repetido "${demo.slug}"`);
  studioSlugs.add(demo.slug);
  if (!fs.existsSync(path.join(root, "app", "demo", demo.slug, "page.tsx"))) {
    errors.push(`falta la ruta app/demo/${demo.slug}/page.tsx`);
  }
  if (errors.length > 0) {
    failed++;
    console.error(`✖ ${label}\n${errors.map((e) => `  - ${e}`).join("\n")}`);
  } else {
    console.log(`✔ ${label}`);
  }
  result.warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
}

const total = files.length + studioDemos.length;
if (failed > 0) {
  console.error(`\n${failed} de ${total} demos con errores.`);
  process.exit(1);
}
console.log(`\nTodas las demos son válidas (${files.length} tenants + ${studioDemos.length} estudio).`);
