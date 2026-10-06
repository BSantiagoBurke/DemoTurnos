"use client";

import { useAdminSession } from "@/lib/hooks/useAdminSession";
import { useNow } from "@/lib/hooks/useNow";
import type { TenantTurnosConfig } from "@/lib/types";
import { AdminDashboard } from "./AdminDashboard";
import { PinGate } from "./PinGate";

export function AdminPanel({ config }: { config: TenantTurnosConfig }) {
  const { unlocked, unlock, lock } = useAdminSession(config.slug);
  const now = useNow();

  // En el servidor no se sabe si hay sesión ni qué hora es: se muestra un placeholder.
  if (unlocked === null || now === null) {
    return <div className="mx-auto mt-16 h-40 w-full max-w-sm animate-pulse rounded-2xl bg-slate-200" aria-busy="true" />;
  }
  if (!unlocked) return <PinGate config={config} onUnlock={unlock} />;
  return <AdminDashboard config={config} now={now} onLogout={lock} />;
}
