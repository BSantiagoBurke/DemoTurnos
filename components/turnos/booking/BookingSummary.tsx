import { formatDuration, formatPrice } from "@/lib/format";
import type { Profesional, Sede, Servicio } from "@/lib/types";

type Props = {
  servicio: Servicio;
  sede: Sede;
  profesional?: Profesional;
  dateLabel: string;
  time: string;
  showPrice: boolean;
};

export function BookingSummary({ servicio, sede, profesional, dateLabel, time, showPrice }: Props) {
  return (
    <dl className="space-y-2 rounded-2xl bg-white p-4 text-sm ring-1 ring-slate-200">
      <div className="flex justify-between gap-3">
        <dt className="text-slate-600">Servicio</dt>
        <dd className="text-right font-semibold text-slate-900">
          {servicio.name} · {formatDuration(servicio.durationMin)}
        </dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="text-slate-600">Cuándo</dt>
        <dd className="text-right font-semibold text-slate-900">
          {dateLabel}, {time} h
        </dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="text-slate-600">Con</dt>
        <dd className="text-right font-semibold text-slate-900">{profesional?.name ?? "Cualquiera disponible"}</dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="text-slate-600">Dónde</dt>
        <dd className="text-right text-slate-900">
          <span className="font-semibold">{sede.name}</span>
          <span className="block text-slate-600">{sede.address}</span>
        </dd>
      </div>
      {showPrice ? (
        <div className="flex justify-between gap-3 border-t border-slate-100 pt-2">
          <dt className="text-slate-600">Precio</dt>
          <dd className="font-semibold text-slate-900">{formatPrice(servicio.price)}</dd>
        </div>
      ) : null}
    </dl>
  );
}
