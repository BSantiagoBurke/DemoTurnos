"use client";

import { useSyncExternalStore } from "react";

const TICK_MS = 30_000;

function subscribe(callback: () => void) {
  const id = window.setInterval(callback, TICK_MS);
  return () => window.clearInterval(id);
}

// Se redondea al tick para que el snapshot sea estable entre renders.
const getSnapshot = () => Math.floor(Date.now() / TICK_MS) * TICK_MS;
const getServerSnapshot = () => null;

/** Hora actual en el cliente (null durante el render del servidor). */
export function useNow(): Date | null {
  const ms = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return ms === null ? null : new Date(ms);
}
