"use client";

import { useState, type FormEvent } from "react";
import { TenantLogo } from "@/components/turnos/TenantLogo";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import type { TenantTurnosConfig } from "@/lib/types";

export function PinGate({ config, onUnlock }: { config: TenantTurnosConfig; onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | undefined>();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (pin === config.adminPin) onUnlock();
    else setError("PIN incorrecto. Probá de nuevo.");
  };

  return (
    <main className="mx-auto flex w-full max-w-sm flex-col px-4 py-10">
      <div className="flex flex-col items-center text-center">
        <TenantLogo tenant={config} size={64} />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Panel de {config.name}</h1>
        <p className="mt-1 text-slate-600">Ingresá el PIN para ver la agenda.</p>
      </div>
      <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
        <Input
          label="PIN"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          value={pin}
          onChange={(e) => {
            setPin(e.target.value);
            setError(undefined);
          }}
          error={error}
        />
        <Button type="submit" block className="min-h-12 text-lg">
          <Icon name="lock" />
          Entrar
        </Button>
      </form>
      <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-950 ring-1 ring-amber-200">
        <p className="font-semibold">Esto es una demo</p>
        <p className="mt-1">
          El PIN no es una autenticación real. En la versión final, cada negocio entra con su usuario y contraseña.
        </p>
        <p className="mt-2">
          PIN de esta demo: <strong className="font-mono">{config.adminPin}</strong>
        </p>
      </div>
    </main>
  );
}
