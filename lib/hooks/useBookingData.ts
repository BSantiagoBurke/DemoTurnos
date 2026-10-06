"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createBookingRepository } from "../repositories";
import { storageKeys } from "../repositories/booking";
import type { Block, Booking, TenantTurnosConfig } from "../types";

type DataState = { bookings: Booking[]; blocks: Block[]; loaded: boolean };

/** Turnos y bloqueos del tenant, siempre a través del repositorio. */
export function useBookingData(config: TenantTurnosConfig) {
  const repository = useMemo(() => createBookingRepository(config), [config]);
  const [data, setData] = useState<DataState>({ bookings: [], blocks: [], loaded: false });

  const refresh = useCallback(async () => {
    const [bookings, blocks] = await Promise.all([repository.list(), repository.listBlocks()]);
    setData({ bookings, blocks, loaded: true });
    return { bookings, blocks };
  }, [repository]);

  useEffect(() => {
    let active = true;
    Promise.all([repository.list(), repository.listBlocks()]).then(([bookings, blocks]) => {
      if (active) setData({ bookings, blocks, loaded: true });
    });
    // Si el panel y la reserva están abiertos en dos pestañas, se mantienen sincronizados.
    const keys = Object.values(storageKeys(config.slug));
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
