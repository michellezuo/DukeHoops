import { describe, expect, it } from "vitest";
import { MISSED_KEY, parseMissed, readStorage, recordAttempt, reviewOrder, serializeMissed, writeStorage, type MissedStore } from "./missed";

const T1 = new Date("2026-11-19T10:00:00Z");
const T2 = new Date("2026-11-20T10:00:00Z");

describe("recordAttempt", () => {
  it("adds a wrong answer with streak 0", () => {
    expect(recordAttempt({}, "q1", "wrong", T1)).toEqual({ q1: { streak: 0, missedAt: T1.toISOString() } });
  });

  it("clears a miss after two correct answers in a row", () => {
    let s = recordAttempt({}, "q1", "wrong", T1);
    s = recordAttempt(s, "q1", "right");
    expect(s.q1.streak).toBe(1);
    s = recordAttempt(s, "q1", "right");
    expect(s).toEqual({});
  });

  it("resets the streak on a wrong answer, keeping the original miss time", () => {
    let s = recordAttempt({}, "q1", "wrong", T1);
    s = recordAttempt(s, "q1", "right");
    s = recordAttempt(s, "q1", "wrong", T2);
    expect(s.q1).toEqual({ streak: 0, missedAt: T1.toISOString() });
    s = recordAttempt(s, "q1", "right");
    expect(s.q1.streak).toBe(1); // needs two more in a row, not one
  });

  it("resets the streak on a blank (not answered right)", () => {
    let s = recordAttempt({}, "q1", "wrong", T1);
    s = recordAttempt(s, "q1", "right");
    s = recordAttempt(s, "q1", "blank");
    expect(s.q1.streak).toBe(0);
  });

  it("ignores right and blank answers for questions that aren't on the list", () => {
    const s: MissedStore = {};
    expect(recordAttempt(s, "q1", "right")).toBe(s);
    expect(recordAttempt(s, "q1", "blank")).toBe(s);
  });

  it("doesn't modify the store it was given", () => {
    const s = recordAttempt({}, "q1", "wrong", T1);
    const copy = structuredClone(s);
    recordAttempt(s, "q1", "right");
    recordAttempt(s, "q2", "wrong", T2);
    expect(s).toEqual(copy);
  });
});

describe("parseMissed", () => {
  it("round-trips through serializeMissed", () => {
    const s = recordAttempt(recordAttempt({}, "a", "wrong", T1), "b", "wrong", T2);
    expect(parseMissed(serializeMissed(s))).toEqual(s);
  });

  it("returns an empty store for missing or corrupted data", () => {
    for (const raw of [null, "", "not json", "[]", "42", "null", '"text"']) expect(parseMissed(raw)).toEqual({});
  });

  it("drops malformed entries and keeps valid ones", () => {
    const raw = JSON.stringify({
      ok: { streak: 1, missedAt: T1.toISOString() },
      badStreak: { streak: 5, missedAt: T1.toISOString() },
      negative: { streak: -1, missedAt: T1.toISOString() },
      noDate: { streak: 0 },
      badDate: { streak: 0, missedAt: "yesterday" },
      notObject: "x",
    });
    expect(Object.keys(parseMissed(raw))).toEqual(["ok"]);
  });
});

describe("reviewOrder", () => {
  it("orders oldest miss first and skips questions that no longer exist", () => {
    let s = recordAttempt({}, "new", "wrong", T2);
    s = recordAttempt(s, "old", "wrong", T1);
    s = recordAttempt(s, "gone", "wrong", T1);
    expect(reviewOrder(s, new Set(["new", "old"]))).toEqual(["old", "new"]);
  });
});

describe("storage access", () => {
  const throwing = {
    getItem: () => { throw new Error("SecurityError"); },
    setItem: () => { throw new Error("QuotaExceededError"); },
    removeItem: () => { throw new Error("SecurityError"); },
  };

  it("returns null / false instead of throwing when storage fails", () => {
    expect(readStorage(throwing)).toBeNull();
    expect(writeStorage(throwing, { q: { streak: 0, missedAt: T1.toISOString() } })).toBe(false);
    expect(readStorage(undefined)).toBeNull();
    expect(writeStorage(undefined, {})).toBe(false);
  });

  it("writes under the versioned key and removes it when the list is empty", () => {
    const mem = new Map<string, string>();
    const storage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k) };
    const s = recordAttempt({}, "q1", "wrong", T1);
    expect(writeStorage(storage, s)).toBe(true);
    expect(parseMissed(readStorage(storage))).toEqual(s);
    writeStorage(storage, {});
    expect(mem.has(MISSED_KEY)).toBe(false);
  });
});
