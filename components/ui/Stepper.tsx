type StepperProps = {
  current: number; // 0-based
  total: number;
  label: string;
};

/** Barra de progreso del flujo de reserva. */
export function Stepper({ current, total, label }: StepperProps) {
  return (
    <div>
      <p className="text-sm text-slate-600">
        Paso {current + 1} de {total} · <span className="font-medium text-slate-800">{label}</span>
      </p>
      <div
        className="mt-2 flex gap-1.5"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current + 1}
        aria-label="Progreso de la reserva"
      >
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= current ? "bg-primary" : "bg-slate-200"}`} />
        ))}
      </div>
    </div>
  );
}
