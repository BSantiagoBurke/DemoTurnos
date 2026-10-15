/**
 * URL base absoluta para metadata (Open Graph necesita URLs absolutas).
 * Orden: NEXT_PUBLIC_SITE_URL > dominio de producción de Vercel > URL del deploy > localhost.
 */
export function siteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return new URL(explicit);
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (production) return new URL(`https://${production}`);
  const deploy = process.env.VERCEL_URL;
  if (deploy) return new URL(`https://${deploy}`);
  return new URL(`http://localhost:${process.env.PORT ?? 3000}`);
}
