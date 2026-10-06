import { cn } from "./cn";

export function BeeCodeFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("py-6 text-center text-xs text-slate-600", className)}>
      Demo creada por{" "}
      <a href="https://beecodelab.com" target="_blank" rel="noopener" className="font-semibold text-slate-800 underline underline-offset-2">
        BeeCode
      </a>
    </footer>
  );
}
