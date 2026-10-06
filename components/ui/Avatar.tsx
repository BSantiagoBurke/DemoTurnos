import { initials } from "@/lib/format";
import { cn } from "./cn";

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-on-accent",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
