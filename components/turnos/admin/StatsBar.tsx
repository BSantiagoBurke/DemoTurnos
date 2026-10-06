import type { DayStats } from "@/lib/agenda";
import { formatPrice } from "@/lib/format";

export function StatsBar({ stats }: { stats: DayStats }) {
  const items = [
    { label: "Turnos", value: String(stats.turnos) },
    { label: "Atendidos", value: String(stats.atendidos) },
    { label: "Cancelados", value: String(stats.cancelados) },
    { label: "Facturación estimada", value: formatPrice(stats.facturacion) },
  ];
  return (
    <dl className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {items.map((item, i) => (
        <div
          key={item.label}
          className={`rounded-2xl bg-white p-3 ring-1 ring-slate-200 ${i === 3 ? "col-span-3 sm:col-span-1" : ""}`}
        >
          <dt className="text-xs font-medium text-slate-600">{item.label}</dt>
          <dd className="mt-0.5 text-2xl font-bold tabular-nums text-slate-900">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
