"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { useAdminSession } from "@/lib/hooks/useAdminSession";
import { useNow } from "@/lib/hooks/useNow";
import type { StudioDemoConfig } from "@/lib/studio/types";
import { NNMonogram } from "../NNMonogram";
import { StudioFooter } from "../StudioFooter";
import { PrimaryButton } from "../StudioSteps";
import { StudioDashboard } from "./StudioDashboard";

/** Panel del estudio: PIN de demo y agenda. */
export function StudioPanel({ config }: { config: StudioDemoConfig }) {
  const { unlocked, unlock, lock } = useAdminSession(`estudio:${config.slug}`);
  const now = useNow();

  // En el servidor no se sabe si hay sesión ni qué hora es.
  if (unlocked === null || now === null) {
    return <div className="mx-auto mt-16 h-40 w-full max-w-sm animate-pulse rounded-2xl bg-(--st-surface)" aria-busy="true" />;
  }
  return (
    <div className="flex min-h-dvh flex-col">
      {unlocked ? <StudioDashboard config={config} now={now} onLogout={lock} /> : <PinGate config={config} onUnlock={unlock} />}
      <StudioFooter aviso={config.avisoDemo} />
    </div>
  );
}

function PinGate({ config, onUnlock }: { config: StudioDemoConfig; onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (pin === config.adminPin) onUnlock();
    else setError("PIN incorrecto. Probá de nuevo.");
  };

  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-5 py-10">
      <div className="flex flex-col items-center text-center">
        <NNMonogram size={72} />
        <h1 className="st-display mt-5 text-3xl">Panel del estudio</h1>
        <p className="mt-2 text-(--st-muted)">Turnos de las 3 sedes en un solo lugar.</p>
      </div>
      <form onSubmit={submit} noValidate className="mt-8 space-y-4">
        <div>
          <label htmlFor="pin" className="mb-1.5 block font-semibold">
            PIN
          </label>
          <input
            id="pin"
            name="pin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            enterKeyHint="go"
            autoFocus
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError(null);
            }}
            aria-invalid={!!error}
            aria-describedby={error ? "pin-error" : undefined}
            className="st-input"
          />
          {error ? (
            <p id="pin-error" className="mt-1.5 text-sm font-medium text-(--st-error)">
              {error}
            </p>
          ) : null}
        </div>
        <PrimaryButton type="submit">
          <Icon name="lock" />
          Entrar
        </PrimaryButton>
      </form>
      <div className="mt-6 rounded-2xl border border-dashed border-(--st-accent) p-4 text-sm">
        <p className="font-semibold">Esto es una demo</p>
        <p className="mt-1 text-(--st-muted)">
          El PIN no es una autenticación real. En la versión final, el estudio entra con su usuario y contraseña.
        </p>
        <p className="mt-2">
          PIN de esta demo: <strong className="font-mono text-base">{config.adminPin}</strong>
        </p>
      </div>
      <p className="mt-6 text-center text-sm">
        <a href={`/demo/${config.slug}`} className="text-(--st-muted) underline underline-offset-4">
          Ir a la página de reservas
        </a>
      </p>
    </main>
  );
}
