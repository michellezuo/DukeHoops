import { useCallback, useMemo, useSyncExternalStore } from "react";
import { MISSED_KEY, parseMissed, readStorage, recordAttempt, serializeMissed, writeStorage, type MissedStore, type Outcome } from "./missed";

/**
 * React hook for the missed-question list in localStorage.
 *
 * Uses useSyncExternalStore (React's API for outside data sources) instead of useEffect + setState:
 *   - On the server and during hydration it reports an empty list (getServerSnapshot), so the server HTML
 *     and the first browser render match. React then re-renders with the stored data.
 *   - It stays in sync across tabs via the browser's "storage" event.
 *   - If localStorage is unavailable or full, it keeps working in memory for this visit.
 */

const listeners = new Set<() => void>();
let current: string | null = null; // serialized store; source of truth for the snapshot

function storage(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined; // accessing window.localStorage itself can throw when storage is blocked
  }
}

function getSnapshot(): string {
  if (current === null) current = readStorage(storage()) ?? "";
  return current;
}

const getServerSnapshot = () => "";

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== MISSED_KEY && e.key !== null) return; // key null = storage cleared
    current = readStorage(storage()) ?? "";
    onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function update(fn: (s: MissedStore) => MissedStore): void {
  const next = fn(parseMissed(getSnapshot()));
  current = Object.keys(next).length ? serializeMissed(next) : "";
  writeStorage(storage(), next); // if this fails, `current` still holds the list for this visit
  listeners.forEach((l) => l());
}

export function useMissed() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const store = useMemo(() => parseMissed(raw), [raw]);
  const record = useCallback((id: string, outcome: Outcome) => update((s) => recordAttempt(s, id, outcome)), []);
  const clear = useCallback(() => update(() => ({})), []);
  return { store, record, clear };
}
