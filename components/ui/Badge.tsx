import type { ReactNode } from "react";
import { cn } from "./cn";

type Tone = "neutral" | "success" | "danger" | "info" | "warning";

const tones: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700",
  success: "bg-emerald-100 text-emerald-800",
  danger: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
  warning: "bg-amber-100 text-amber-900",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}
