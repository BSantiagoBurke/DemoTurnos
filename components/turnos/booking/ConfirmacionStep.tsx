import type { ReactNode } from "react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { buildIcs, icsDataUri } from "@/lib/ics";
import { formatLongDate, toLocalDate, toLocalTime } from "@/lib/time";
import type { Booking, Profesional, Sede, Servicio, TenantTurnosConfig } from "@/lib/types";
import { buildBookingMessage, buildWhatsAppLink } from "@/lib/whatsapp";

type Props = {
  config: TenantTurnosConfig;
  booking: Booking;
  servicio: Servicio;
  sede: Sede;
  profesional: Profesional;
  summary: ReactNode;
  onRestart: () => void;
};

export function ConfirmacionStep({ config, booking, servicio, sede, profesional, summary, onRestart }: Props) {
  const fecha = formatLongDate(toLocalDate(booking.start));
  const hora = toLocalTime(booking.start);
  const firstName = booking.customerName.split(" ")[0];

  const ics = buildIcs({
    uid: `${booking.id}@beecodelab.com`,
    start: booking.start,
    end: booking.end,
    title: `${servicio.name} en ${config.name}`,
    location: `${sede.name}, ${sede.address}`,
    description: `Con ${profesional.name}.`,
  });
  const whatsapp = buildWhatsAppLink(
    config.whatsapp,
    buildBookingMessage({
      customerName: booking.customerName,
      servicio: servicio.name,
      profesional: profesional.name,
      sede: `${sede.name} (${sede.address})`,
      fecha,
      hora,
    }),
  );

  return (
    <div className="space-y-5">
      <div className="text-center">
        <span className="mx-auto inline-flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Icon name="check" className="size-9" />
        </span>
        <h2 className="mt-3 text-2xl font-bold text-slate-900">¡Listo, {firstName}!</h2>
        <p className="mt-1 text-slate-700">Tu turno quedó confirmado.</p>
      </div>
      {summary}
      <div className="space-y-3">
        <a href={icsDataUri(ics)} download={`turno-${config.slug}.ics`} className={buttonClasses("primary", true)}>
          <Icon name="calendar" />
          Agregar a mi calendario
        </a>
        <a href={whatsapp} target="_blank" rel="noopener" className={buttonClasses("secondary", true)}>
          <Icon name="whatsapp" className="size-5 text-emerald-600" />
          Avisar al negocio por WhatsApp
        </a>
      </div>
      <div className="flex flex-col items-center gap-1 pt-2 text-sm">
        <button type="button" onClick={onRestart} className="min-h-11 font-semibold text-slate-800 underline underline-offset-2">
          Sacar otro turno
        </button>
        <Link href={`/turnos/${config.slug}/admin`} className="min-h-11 content-center text-slate-600 underline underline-offset-2">
          Ver cómo lo recibe el negocio
        </Link>
      </div>
    </div>
  );
}
