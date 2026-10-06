/**
 * Crea un tenant nuevo a partir de la plantilla.
 * Uso: npm run new-tenant -- --slug tucuman-barberia --type turnos
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

const SUPPORTED_TYPES = ["turnos"] as const;
type TenantType = (typeof SUPPORTED_TYPES)[number];

const root = process.cwd();

function fail(message: string): never {
  console.error(`✖ ${message}`);
  process.exit(1);
}

const { values } = parseArgs({
  options: { slug: { type: "string" }, type: { type: "string", default: "turnos" } },
});

const slug = values.slug?.trim();
const type = values.type as TenantType;

if (!slug) fail('Falta --slug. Ej: npm run new-tenant -- --slug tucuman-barberia --type turnos');
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) fail(`Slug inválido "${slug}": solo minúsculas, números y guiones.`);
if (!SUPPORTED_TYPES.includes(type)) fail(`Tipo "${values.type}" no soportado. Disponibles: ${SUPPORTED_TYPES.join(", ")}.`);

const templatePath = path.join(root, "tenants", `_template-${type}.json`);
const tenantPath = path.join(root, "tenants", `${slug}.json`);
const publicDir = path.join(root, "public", "tenants", slug);

if (fs.existsSync(tenantPath)) fail(`Ya existe tenants/${slug}.json`);

const template = fs.readFileSync(templatePath, "utf8").replaceAll("__SLUG__", slug);
fs.writeFileSync(tenantPath, template);
fs.mkdirSync(publicDir, { recursive: true });
fs.copyFileSync(path.join(root, "tenants", "_template-logo.svg"), path.join(publicDir, "logo.svg"));

console.log(`✔ Tenant creado: tenants/${slug}.json
✔ Carpeta de assets: public/tenants/${slug}/ (con un logo provisorio)

Próximos pasos:
  1. Editá tenants/${slug}.json: nombre, colores, WhatsApp, servicios, profesionales, sedes y horarios.
  2. Reemplazá public/tenants/${slug}/logo.svg por el logo del negocio (o cambiá "logo" en el JSON si es .png).
  3. npm run validate-tenants
  4. npm run dev y abrí http://localhost:3000/turnos/${slug}`);
