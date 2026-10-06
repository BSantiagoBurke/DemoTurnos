import { useId, type SelectHTMLAttributes } from "react";
import { cn } from "./cn";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: { value: string; label: string }[];
};

export function Select({ label, options, className, id, ...props }: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <div className={className}>
      <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-slate-800">
        {label}
      </label>
      <select
        id={selectId}
        className={cn("min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900")}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
