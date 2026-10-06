"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Sesión del panel de demo en sessionStorage. No es autenticación real. */
const listeners = new Set<() => void>();
const memory = new Set<string>();
const key = (slug: string) => `beecode:turnos:${slug}:admin`;

function read(slug: string): boolean {
  try {
    return window.sessionStorage.getItem(key(slug)) === "1";
  } catch {
    return memory.has(slug);
  }
}

function write(slug: string, value: boolean) {
  if (value) memory.add(slug);
  else memory.delete(slug);
  try {
    if (value) window.sessionStorage.setItem(key(slug), "1");
    else window.sessionStorage.removeItem(key(slug));
  } catch {
    // sessionStorage no disponible: queda en memoria
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAdminSession(slug: string) {
  const unlocked = useSyncExternalStore(
    subscribe,
    () => read(slug) || memory.has(slug),
    () => null,
  );
  const unlock = useCallback(() => write(slug, true), [slug]);
  const lock = useCallback(() => write(slug, false), [slug]);
  return { unlocked, unlock, lock };
}
