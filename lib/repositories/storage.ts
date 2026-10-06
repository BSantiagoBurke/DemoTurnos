/** Almacenamiento clave-valor que nunca rompe: usa localStorage si está disponible y, si no, memoria. */
export type KeyValueStore = {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
};

export function createMemoryStore(): KeyValueStore {
  const map = new Map<string, string>();
  return {
    get: (key) => map.get(key) ?? null,
    set: (key, value) => void map.set(key, value),
    remove: (key) => void map.delete(key),
  };
}

export function createSafeStore(): KeyValueStore {
  const memory = createMemoryStore();
  const local = (): Storage | null => {
    try {
      return typeof window !== "undefined" ? window.localStorage : null;
    } catch {
      return null;
    }
  };
  return {
    get(key) {
      try {
        const ls = local();
        if (ls) return ls.getItem(key) ?? memory.get(key);
      } catch {
        // localStorage bloqueado: seguimos en memoria
      }
      return memory.get(key);
    },
    set(key, value) {
      memory.set(key, value);
      try {
        local()?.setItem(key, value);
      } catch {
        // cuota llena o modo privado: queda en memoria
      }
    },
    remove(key) {
      memory.remove(key);
      try {
        local()?.removeItem(key);
      } catch {
        // ignorar
      }
    },
  };
}
