import type { Outcome } from "./missed";
import type { QuizQuestion } from "./types";

/**
 * Timed mock test: pure helpers (question order, grading, scoring, clock, saved session).
 * Scoring follows test-day rules: right = +points, wrong = −points (0 on a bonus question), blank = 0.
 */

export const MOCK_DURATION_MS = 60 * 60 * 1000;
export const MOCK_WARN_MS = 5 * 60 * 1000; // timer turns red in the last 5 minutes

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * Every question, in a fixed order. Each question's position depends only on its own ID, so retakes see the
 * same order, and a new question (e.g. after a game) slots in without reshuffling the rest.
 */
export function mockOrder(questions: QuizQuestion[], seed = "mock-v1"): QuizQuestion[] {
  return [...questions].sort((a, b) => hash(`${seed}:${a.id}`) - hash(`${seed}:${b.id}`) || a.id.localeCompare(b.id));
}

export type Grade = "right" | "wrong";

/**
 * Points earned for one answer. Used by the mock test and by Practice's "test-day scoring" option.
 * Wrong answers lose points only when `penalty` is on, and never on a bonus question.
 */
export function pointsFor(q: Pick<QuizQuestion, "points" | "bonus">, outcome: Outcome | undefined, penalty = true): number {
  if (outcome === "right") return q.points;
  if (outcome === "wrong" && penalty && !q.bonus) return -q.points;
  return 0;
}

/** Written answers someone typed something for: these need self-grading after submit. */
export function needsGrading(questions: QuizQuestion[], answers: Record<string, string>): QuizQuestion[] {
  return questions.filter((q) => !q.choices && (answers[q.id] ?? "").trim() !== "");
}

/** Outcome for one question, or null if it's a written answer that hasn't been graded yet. */
export function outcomeFor(q: QuizQuestion, answer: string | undefined, grade: Grade | undefined): Outcome | null {
  const a = (answer ?? "").trim();
  if (!a) return "blank";
  if (q.choices) return a === q.answer ? "right" : "wrong";
  return grade ?? null;
}

export interface MockResult {
  score: number;
  possible: number;
  right: number;
  wrong: number;
  blank: number;
  ungraded: number;
  outcomes: Record<string, Outcome>;
}

export function scoreMock(questions: QuizQuestion[], answers: Record<string, string>, grades: Record<string, Grade>): MockResult {
  const r: MockResult = { score: 0, possible: 0, right: 0, wrong: 0, blank: 0, ungraded: 0, outcomes: {} };
  for (const q of questions) {
    r.possible += q.points;
    const o = outcomeFor(q, answers[q.id], grades[q.id]);
    if (o === null) {
      r.ungraded++;
      continue;
    }
    r.outcomes[q.id] = o;
    r[o]++;
    r.score += pointsFor(q, o);
  }
  return r;
}

export function remainingMs(startedAt: number, now: number, duration = MOCK_DURATION_MS): number {
  return Math.max(0, duration - (now - startedAt));
}

/** "mm:ss", rounding up so the clock reads 60:00 at the start and 0:00 only when time is actually up. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

// ---------------------------------------------------------------- saved session (sessionStorage)

export const MOCK_SESSION_KEY = "dukehoops:tenting:mock:v1";

/** An in-progress test: saved on every change so a reload or an in-app link resumes it. */
export interface MockSession {
  startedAt: number;
  answers: Record<string, string>;
  /** Set when submitted (or when time ran out); the session then stays saved through grading. */
  submittedAt: number | null;
  grades: Record<string, Grade>;
}

const isRecordOf = (v: unknown, ok: (x: unknown) => boolean): v is Record<string, never> =>
  !!v && typeof v === "object" && !Array.isArray(v) && Object.values(v).every(ok);

/** Parse a saved session. Anything malformed returns null (start fresh) instead of throwing. */
export function parseMockSession(raw: string | null): MockSession | null {
  if (!raw) return null;
  let d: unknown;
  try {
    d = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!d || typeof d !== "object") return null;
  const { startedAt, answers, submittedAt, grades } = d as Record<string, unknown>;
  if (typeof startedAt !== "number" || !Number.isFinite(startedAt) || startedAt <= 0) return null;
  if (submittedAt !== null && (typeof submittedAt !== "number" || submittedAt < startedAt)) return null;
  if (!isRecordOf(answers, (x) => typeof x === "string")) return null;
  if (!isRecordOf(grades, (x) => x === "right" || x === "wrong")) return null;
  return { startedAt, answers, submittedAt, grades };
}
