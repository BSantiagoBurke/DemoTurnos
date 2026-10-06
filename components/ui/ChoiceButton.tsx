import type { ReactNode } from "react";
import { cn } from "./cn";

type ChoiceButtonProps = {
  onClick: () => void;
  selected?: boolean;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
};

/** Tarjeta seleccionable de ancho completo (servicios, sedes, profesionales). */
export function ChoiceButton({ onClick, selected, disabled, children, className }: ChoiceButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "flex min-h-14 w-full items-center gap-3 rounded-2xl border bg-white p-4 text-left transition",
        "hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50",
        selected ? "border-primary ring-2 ring-primary" : "border-slate-200",
        className,
      )}
    >
      {children}
    </button>
  );
}
