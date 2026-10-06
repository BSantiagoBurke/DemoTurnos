import { Avatar } from "@/components/ui/Avatar";
import { ChoiceButton } from "@/components/ui/ChoiceButton";
import { Icon } from "@/components/ui/Icon";
import { ANY_PROFESIONAL, type Profesional, type ProfesionalChoice } from "@/lib/types";

type Props = {
  profesionales: Profesional[];
  selectedId: ProfesionalChoice | null;
  onSelect: (id: ProfesionalChoice) => void;
};

export function ProfesionalStep({ profesionales, selectedId, onSelect }: Props) {
  return (
    <ul className="space-y-3">
      <li>
        <ChoiceButton onClick={() => onSelect(ANY_PROFESIONAL)} selected={selectedId === ANY_PROFESIONAL}>
          <span aria-hidden className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
            <Icon name="user" />
          </span>
          <span>
            <span className="block font-semibold text-slate-900">Cualquiera disponible</span>
            <span className="block text-sm text-slate-600">Te mostramos todos los horarios libres</span>
          </span>
        </ChoiceButton>
      </li>
      {profesionales.map((p) => (
        <li key={p.id}>
          <ChoiceButton onClick={() => onSelect(p.id)} selected={selectedId === p.id}>
            <Avatar name={p.name} />
            <span className="font-semibold text-slate-900">{p.name}</span>
          </ChoiceButton>
        </li>
      ))}
    </ul>
  );
}
