import { describe, expect, it } from "vitest";
import { formatClock, mockOrder, needsGrading, outcomeFor, parseMockSession, pointsFor, remainingMs, scoreMock, MOCK_DURATION_MS } from "./mock";
import type { QuizQuestion } from "./types";

const q = (id: string, points: number, choices?: string[]): QuizQuestion => ({
  id, points, choices, category: "Roster", prompt: `Q ${id}`, answer: choices ? choices[0] : `answer ${id}`,
  source: { label: "test", href: "/" },
});

const mc = q("mc", 2, ["A", "B", "C"]); // answer "A"
const written = q("w", 3);
const mc1 = q("mc1", 1, ["X", "Y"]); // answer "X"

describe("mockOrder", () => {
  it("is the same every time and contains every question once", () => {
    const qs = Array.from({ length: 30 }, (_, i) => q(`q${i}`, 1));
    const a = mockOrder(qs).map((x) => x.id);
    expect(mockOrder([...qs].reverse()).map((x) => x.id)).toEqual(a);
    expect([...a].sort()).toEqual(qs.map((x) => x.id).sort());
  });

  it("keeps the existing order when a new question is added", () => {
    const qs = Array.from({ length: 30 }, (_, i) => q(`q${i}`, 1));
    const before = mockOrder(qs).map((x) => x.id);
    const after = mockOrder([...qs, q("new-game", 1)]).map((x) => x.id).filter((id) => id !== "new-game");
    expect(after).toEqual(before);
  });
});

describe("outcomeFor", () => {
  it("grades multiple choice automatically", () => {
    expect(outcomeFor(mc, "A", undefined)).toBe("right");
    expect(outcomeFor(mc, "B", undefined)).toBe("wrong");
  });

  it("treats empty or whitespace answers as blank", () => {
    expect(outcomeFor(mc, undefined, undefined)).toBe("blank");
    expect(outcomeFor(written, "   ", undefined)).toBe("blank");
  });

  it("uses the self-grade for written answers, or null until graded", () => {
    expect(outcomeFor(written, "my answer", undefined)).toBeNull();
    expect(outcomeFor(written, "my answer", "right")).toBe("right");
    expect(outcomeFor(written, "my answer", "wrong")).toBe("wrong");
  });
});

describe("needsGrading", () => {
  it("lists only written questions with an answer typed in", () => {
    expect(needsGrading([mc, written, q("w2", 1)], { mc: "A", w: "something", w2: " " }).map((x) => x.id)).toEqual(["w"]);
  });
});

describe("scoreMock", () => {
  it("uses test-day scoring: right +points, wrong −points, blank 0", () => {
    const r = scoreMock([mc, written, mc1], { mc: "A", w: "guess", mc1: "" }, { w: "wrong" });
    expect(r).toMatchObject({ score: 2 - 3, possible: 6, right: 1, wrong: 1, blank: 1, ungraded: 0 });
    expect(r.outcomes).toEqual({ mc: "right", w: "wrong", mc1: "blank" });
  });

  it("counts ungraded written answers separately and leaves them out of the score", () => {
    const r = scoreMock([mc, written], { mc: "A", w: "guess" }, {});
    expect(r).toMatchObject({ score: 2, possible: 5, ungraded: 1 });
    expect(r.outcomes.w).toBeUndefined();
  });

  it("can go negative, like the real test", () => {
    expect(scoreMock([mc, mc1], { mc: "B", mc1: "Y" }, {}).score).toBe(-3);
  });
});

describe("clock", () => {
  it("counts down from the start time and stops at 0", () => {
    expect(remainingMs(1000, 1000)).toBe(MOCK_DURATION_MS);
    expect(remainingMs(0, 10 * 60 * 1000)).toBe(50 * 60 * 1000);
    expect(remainingMs(0, MOCK_DURATION_MS + 5000)).toBe(0);
  });

  it("formats as m:ss, rounding up", () => {
    expect(formatClock(MOCK_DURATION_MS)).toBe("60:00");
    expect(formatClock(59_001)).toBe("1:00");
    expect(formatClock(9_000)).toBe("0:09");
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(-5)).toBe("0:00");
  });
});

describe("bonus questions", () => {
  const bonus: QuizQuestion = { ...q("bonus", 4, ["A", "B"]), bonus: true }; // answer "A"

  it("score 0, not negative, for a wrong answer", () => {
    expect(scoreMock([bonus], { bonus: "B" }, {})).toMatchObject({ score: 0, wrong: 1, possible: 4 });
  });

  it("still earn their points when right", () => {
    expect(scoreMock([bonus], { bonus: "A" }, {}).score).toBe(4);
  });

  it("don't change scoring for regular questions in the same test", () => {
    expect(scoreMock([bonus, mc], { bonus: "B", mc: "B" }, {}).score).toBe(-2);
  });
});

describe("pointsFor", () => {
  it("applies the penalty only when it's on, and never to bonus questions", () => {
    expect(pointsFor({ points: 3 }, "right")).toBe(3);
    expect(pointsFor({ points: 3 }, "wrong")).toBe(-3);
    expect(pointsFor({ points: 3 }, "wrong", false)).toBe(0);
    expect(pointsFor({ points: 3, bonus: true }, "wrong")).toBe(0);
    expect(pointsFor({ points: 3 }, "blank")).toBe(0);
    expect(pointsFor({ points: 3 }, undefined)).toBe(0);
  });
});

describe("parseMockSession", () => {
  const ok = { startedAt: 1_700_000_000_000, answers: { a: "x" }, submittedAt: null, grades: {} };

  it("round-trips a valid session", () => {
    expect(parseMockSession(JSON.stringify(ok))).toEqual(ok);
    const graded = { ...ok, submittedAt: ok.startedAt + 1000, grades: { a: "right" } };
    expect(parseMockSession(JSON.stringify(graded))).toEqual(graded);
  });

  it("returns null for missing or malformed data", () => {
    for (const raw of [null, "", "nope", "[]", "null"]) expect(parseMockSession(raw)).toBeNull();
    for (const bad of [
      { ...ok, startedAt: "soon" },
      { ...ok, startedAt: -1 },
      { ...ok, answers: { a: 5 } },
      { ...ok, answers: null },
      { ...ok, grades: { a: "maybe" } },
      { ...ok, submittedAt: ok.startedAt - 1 },
    ]) expect(parseMockSession(JSON.stringify(bad))).toBeNull();
  });
});
