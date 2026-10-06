"use client";

import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { formatPrice } from "@/lib/format";
import { formatArgentinePhone } from "@/lib/phone";
import { findProfesional, findSede, findServicio } from "@/lib/tenant-lookup";
import { formatLongDate, toLocalDate, toLocalTime } from "@/lib/time";
import type { Booking, BookingStatus, TenantTurnosConfig } from "@/lib/types";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { BookingActions } from "./BookingActions";
import { STATUS_LABEL, STATUS_TONE } from "./status";

type Props = {
  config: TenantTurnosConfig;
  booking: Booking | null;
  onClose: () => void;
  onChangeStatus: (id: string, status: BookingStatus) => void;
};

export function BookingDetailModal({ config, booking, onClose, onChangeStatus }: Props) {
  const servicio = booking ? findServicio(config, booking.servicioId) : undefined;
  return (
    <Modal open={booking !== null} title={booking?.customerName ?? ""} onClose={onClose}>
      {booking ? (
        <div className="space-y-4">
          <Badge tone={STATUS_TONE[booking.status]}>{STATUS_LABEL[booking.status]}</Badge>
          <dl className="space-y-2 text-sm">
            <Row label="Cuándo" value={`${formatLongDate(toLocalDate(booking.start))}, ${toLocalTime(booking.start)} a ${toLocalTime(booking.end)}`} />
            <Row label="Servicio" value={`${servicio?.name ?? "-"}${servicio ? ` · ${formatPrice(servicio.price)}` : ""}`} />
            <Row label="Profesional" value={findProfesional(config, booking.profesionalId)?.name ?? "-"} />
            <Row label="Sede" value={findSede(config, booking.sedeId)?.name ?? "-"} />
            <Row label="Teléfono" value={formatArgentinePhone(booking.customerPhone)} />
          </dl>
          <div className="flex gap-2">
            <a
              href={buildWhatsAppLink(booking.customerPhone, `Hola ${booking.customerName.split(" ")[0]}, te escribimos de ${config.name} por tu turno.`)}
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-900"
            >
              <Icon name="whatsapp" className="size-4 text-emerald-600" /> WhatsApp
            </a>
            <a
              href={`tel:+${booking.customerPhone}`}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-900"
            >
              <Icon name="phone" className="size-4" /> Llamar
            </a>
          </div>
          <div className="border-t border-slate-100 pt-4">
            <BookingActions
              booking={booking}
              onChangeStatus={(id, status) => {
                onChangeStatus(id, status);
                onClose();
              }}
            />
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-600">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{value}</dd>
    </div>
  );
}
