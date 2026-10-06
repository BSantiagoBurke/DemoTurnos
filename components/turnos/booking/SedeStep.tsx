import { ChoiceButton } from "@/components/ui/ChoiceButton";
import { Icon } from "@/components/ui/Icon";
import type { Sede } from "@/lib/types";

type Props = { sedes: Sede[]; selectedId: string | null; onSelect: (id: string) => void };

export function SedeStep({ sedes, selectedId, onSelect }: Props) {
  return (
    <ul className="space-y-3">
      {sedes.map((s) => (
        <li key={s.id}>
          <ChoiceButton onClick={() => onSelect(s.id)} selected={s.id === selectedId}>
            <Icon name="pin" className="size-6 shrink-0 text-slate-500" />
            <span className="min-w-0">
              <span className="block font-semibold text-slate-900">{s.name}</span>
              <span className="block text-sm text-slate-600">{s.address}</span>
            </span>
          </ChoiceButton>
        </li>
      ))}
    </ul>
  );
}
