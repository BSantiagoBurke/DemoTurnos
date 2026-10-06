import { ChoiceButton } from "@/components/ui/ChoiceButton";
import { Icon } from "@/components/ui/Icon";
import { formatDuration, formatPrice } from "@/lib/format";
import type { TenantTurnosConfig } from "@/lib/types";

type Props = { config: TenantTurnosConfig; selectedId: string | null; onSelect: (id: string) => void };

export function ServicioStep({ config, selectedId, onSelect }: Props) {
  const showPrices = config.showPrices ?? true;
  return (
    <ul className="space-y-3">
      {config.servicios.map((s) => (
        <li key={s.id}>
          <ChoiceButton onClick={() => onSelect(s.id)} selected={s.id === selectedId}>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-slate-900">{s.name}</span>
              <span className="mt-0.5 inline-flex items-center gap-1 text-sm text-slate-600">
                <Icon name="clock" className="size-4" />
                {formatDuration(s.durationMin)}
              </span>
            </span>
            {showPrices ? <span className="shrink-0 font-semibold text-slate-900">{formatPrice(s.price)}</span> : null}
          </ChoiceButton>
        </li>
      ))}
    </ul>
  );
}
