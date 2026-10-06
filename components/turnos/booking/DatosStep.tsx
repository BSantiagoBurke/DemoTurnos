"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { normalizeArgentinePhone } from "@/lib/phone";

type Props = {
  summary: ReactNode;
  submitting: boolean;
  onSubmit: (data: { name: string; phone: string }) => void;
};

export function DatosStep({ summary, submitting, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);

  const nameError = name.trim().length < 2 ? "Escribí tu nombre" : undefined;
  const normalized = normalizeArgentinePhone(phone);
  const phoneError = normalized ? undefined : "Revisá el número: con código de área, ej. 381 123-4567";

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (nameError || !normalized) return;
    onSubmit({ name: name.trim(), phone: normalized });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {summary}
      <Input
        label="Nombre y apellido"
        name="name"
        autoComplete="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={touched ? nameError : undefined}
      />
      <Input
        label="Celular"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="381 123-4567"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        hint="Con código de área. Lo usamos solo para avisarte si hay cambios."
        error={touched ? phoneError : undefined}
      />
      <Button type="submit" block disabled={submitting} className="min-h-12 text-lg">
        {submitting ? "Confirmando…" : "Confirmar turno"}
      </Button>
    </form>
  );
}
