import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { BeeCodeFooter } from "@/components/ui/BeeCodeFooter";
import { tenantCssVars } from "@/lib/color";
import { getTenant, getTenantSlugs } from "@/lib/tenants";

// Solo existen los tenants definidos en /tenants: cualquier otro slug da 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getTenantSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: LayoutProps<"/turnos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const tenant = getTenant(slug);
  if (!tenant) return {};
  return {
    title: { default: tenant.name, template: `%s | ${tenant.name}` },
    description: tenant.tagline ?? `Reservá tu turno en ${tenant.name}.`,
    icons: { icon: tenant.logo },
  };
}

export default async function TenantLayout({ children, params }: LayoutProps<"/turnos/[slug]">) {
  const { slug } = await params;
  const tenant = getTenant(slug);
  if (!tenant) notFound();

  return (
    <div style={tenantCssVars(tenant.colors) as CSSProperties} className="flex min-h-dvh flex-1 flex-col">
      <div className="flex-1">{children}</div>
      <BeeCodeFooter />
    </div>
  );
}
