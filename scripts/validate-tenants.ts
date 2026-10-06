/**
 * Valida todos los tenants contra el schema zod y chequea que exista el logo.
 * Uso: npm run validate-tenants
 */
import fs from "node:fs";
import path from "node:path";
import { contrastRatio } from "../lib/color";
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

if (failed > 0) {
  console.error(`\n${failed} de ${files.length} tenants con errores.`);
  process.exit(1);
}
console.log(`\nTodos los tenants son válidos (${files.length}).`);
