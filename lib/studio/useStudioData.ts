"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { timeToMinutes, toLocalDate, toLocalTime } from "../time";
import { LocalStorageStudioRepository, studioStorageKeys } from "./repository";
import type { StudioBlock, StudioBooking, StudioDemoConfig } from "./types";

type DataState = { bookings: StudioBooking[]; blocks: StudioBlock[]; loaded: boolean };

const tucumanClock = () => {
  const now = new Date();
  return { today: toLocalDate(now), nowMin: timeToMinutes(toLocalTime(now)), iso: now.toISOString() };
};

/** Turnos y bloqueos de la demo, siempre a través del repositorio (reserva y panel usan el mismo). */
export function useStudioData(config: StudioDemoConfig) {
  const repository = useMemo(() => new LocalStorageStudioRepository(config, tucumanClock), [config]);
  const [data, setData] = useState<DataState>({ bookings: [], blocks: [], loaded: false });

  const refresh = useCallback(async () => {
    const [bookings, blocks] = await Promise.all([repository.list(), repository.listBlocks()]);
    setData({ bookings, blocks, loaded: true });
  }, [repository]);

  useEffect(() => {
    let active = true;
    Promise.all([repository.list(), repository.listBlocks()]).then(([bookings, blocks]) => {
      if (active) setData({ bookings, blocks, loaded: true });
    });
    // Reserva y panel abiertos en dos pestañas: se mantienen sincronizados.
    const keys: string[] = Object.values(studioStorageKeys(config.slug));
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || keys.includes(e.key)) void refresh();
    };
    const onFocus = () => void refresh();
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, [repository, refresh, config.slug]);

  return { ...data, repository, refresh };
}
