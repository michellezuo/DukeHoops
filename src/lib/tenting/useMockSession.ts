import { useCallback, useMemo, useSyncExternalStore } from "react";
import { MOCK_SESSION_KEY, parseMockSession, type Grade, type MockSession } from "./mock";

/**
 * The in-progress mock test, saved in sessionStorage (this tab only; it ends when the tab closes) so a reload
 * or a click on a site link resumes the test. Same pattern as useMissed: useSyncExternalStore reports "no
 * session" on the server and during hydration, then the saved one. If storage is unavailable it still works
 * in memory, but then won't survive a reload.
 */

const listeners = new Set<() => void>();
let current: string | null = null;

function storage(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.sessionStorage;
  } catch {
    return undefined;
  }
}

function getSnapshot(): string {
  if (current === null) {
    try {
      current = storage()?.getItem(MOCK_SESSION_KEY) ?? "";
    } catch {
      current = "";
    }
  }
  return current;
}

const getServerSnapshot = () => "";

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function write(next: MockSession | null): void {
  current = next ? JSON.stringify(next) : "";
  try {
    const s = storage();
    if (s && next) s.setItem(MOCK_SESSION_KEY, current);
    else s?.removeItem(MOCK_SESSION_KEY);
  } catch {
    // quota or blocked storage: keep the in-memory copy for this page view
  }
  listeners.forEach((l) => l());
}

/** Current saved session, read fresh (for timers and callbacks that shouldn't capture a stale copy). */
export function readMockSession(): MockSession | null {
  return parseMockSession(getSnapshot());
}

function updateRunning(fn: (s: MockSession) => MockSession): void {
  const s = readMockSession();
  if (s && s.submittedAt === null) write(fn(s));
}

function updateSubmitted(fn: (s: MockSession) => MockSession): void {
  const s = readMockSession();
  if (s && s.submittedAt !== null) write(fn(s));
}

export function useMockSession() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const session = useMemo(() => parseMockSession(raw), [raw]);

  const start = useCallback((at: number) => write({ startedAt: at, answers: {}, submittedAt: null, grades: {} }), []);
  const setAnswer = useCallback((id: string, value: string) => updateRunning((s) => {
    const answers = { ...s.answers };
    if (value === "") delete answers[id];
    else answers[id] = value;
    return { ...s, answers };
  }), []);
  const submit = useCallback((at: number) => updateRunning((s) => ({ ...s, submittedAt: at })), []);
  const grade = useCallback((id: string, g: Grade) => updateSubmitted((s) => ({ ...s, grades: { ...s.grades, [id]: g } })), []);
  const clear = useCallback(() => write(null), []);

  return { session, start, setAnswer, submit, grade, clear };
}
