import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPanel } from "@/components/turnos/admin/AdminPanel";
import { getTenant } from "@/lib/tenants";

export const metadata: Metadata = { title: "Panel del negocio" };

export default async function AdminPage({ params }: PageProps<"/turnos/[slug]/admin">) {
  const { slug } = await params;
  const tenant = getTenant(slug);
  if (!tenant) notFound();
  return <AdminPanel config={tenant} />;
}
