/**
 * Missed-question tracking for the tenting quiz, saved in the browser's localStorage.
 *
 * Rules (any attempt counts, in Practice or Review mode):
 *   - wrong → added to the list (or its streak resets to 0)
 *   - right → if listed, streak + 1; two correct answers in a row clears it
 *   - blank → if listed, streak resets to 0 (it wasn't answered right)
 *
 * Pure functions only; the React hook that connects this to localStorage is in ./useMissed.ts.
 */

export const MISSED_KEY = "dukehoops:tenting:missed:v1";
export const CLEAR_AFTER = 2; // correct answers in a row needed to clear a miss

export type Outcome = "right" | "wrong" | "blank";

export interface MissedEntry {
  /** Correct answers in a row since the last miss (cleared at CLEAR_AFTER, so only 0 or 1 is stored). */
  streak: number;
  /** When it was first missed (since it was last cleared). Review shows the oldest first. */
  missedAt: string;
}

export type MissedStore = Record<string, MissedEntry>;

export function recordAttempt(store: MissedStore, id: string, outcome: Outcome, now: Date = new Date()): MissedStore {
  const cur = store[id];
  if (outcome === "wrong") {
    return { ...store, [id]: { streak: 0, missedAt: cur?.missedAt ?? now.toISOString() } };
  }
  if (!cur) return store; // right or blank on a question that isn't on the list: nothing to track
  if (outcome === "blank") {
    return cur.streak === 0 ? store : { ...store, [id]: { ...cur, streak: 0 } };
  }
  if (cur.streak + 1 >= CLEAR_AFTER) {
    const next = { ...store };
    delete next[id];
    return next;
  }
  return { ...store, [id]: { ...cur, streak: cur.streak + 1 } };
}

/** Parse the stored JSON. Anything malformed (bad JSON, wrong shape, bad entries) is dropped, never thrown. */
export function parseMissed(raw: string | null): MissedStore {
  if (!raw) return {};
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};
  const out: MissedStore = {};
  for (const [id, e] of Object.entries(data as Record<string, unknown>)) {
    if (!e || typeof e !== "object") continue;
    const { streak, missedAt } = e as Record<string, unknown>;
    if (typeof streak !== "number" || !Number.isInteger(streak) || streak < 0 || streak >= CLEAR_AFTER) continue;
    if (typeof missedAt !== "string" || Number.isNaN(Date.parse(missedAt))) continue;
    out[id] = { streak, missedAt };
  }
  return out;
}

export function serializeMissed(store: MissedStore): string {
  return JSON.stringify(store);
}

/** IDs to review, oldest miss first, limited to questions that still exist (generated questions change by season). */
export function reviewOrder(store: MissedStore, existingIds: Set<string>): string[] {
  return Object.entries(store)
    .filter(([id]) => existingIds.has(id))
    .sort(([a, x], [b, y]) => x.missedAt.localeCompare(y.missedAt) || a.localeCompare(b))
    .map(([id]) => id);
}

/** Read from a Storage-like object. Returns null if storage is unavailable or throws (private mode, blocked). */
export function readStorage(storage: Pick<Storage, "getItem"> | undefined): string | null {
  try {
    return storage?.getItem(MISSED_KEY) ?? null;
  } catch {
    return null;
  }
}

/** Write to a Storage-like object. Returns false if it fails (quota, private mode); the caller keeps an in-memory copy. */
export function writeStorage(storage: Pick<Storage, "setItem" | "removeItem"> | undefined, store: MissedStore): boolean {
  try {
    if (!storage) return false;
    if (Object.keys(store).length === 0) storage.removeItem(MISSED_KEY);
    else storage.setItem(MISSED_KEY, serializeMissed(store));
    return true;
  } catch {
    return false;
  }
}
