import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingFlow } from "@/components/turnos/booking/BookingFlow";
import { getTenant } from "@/lib/tenants";

export const metadata: Metadata = { title: "Reservar turno" };

export default async function ReservarPage({ params }: PageProps<"/turnos/[slug]/reservar">) {
  const { slug } = await params;
  const tenant = getTenant(slug);
  if (!tenant) notFound();
  return <BookingFlow config={tenant} />;
}
