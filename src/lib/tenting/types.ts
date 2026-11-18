export const QUIZ_CATEGORIES = [
  "Roster",
  "This season",
  "Awards & records",
  "History & traditions",
  "Coaches",
  "The Brotherhood",
] as const;

export type QuizCategory = (typeof QUIZ_CATEGORIES)[number];

export interface QuizQuestion {
  id: string;
  category: QuizCategory;
  prompt: string;
  /** The answer to show on reveal. For multiple choice it must equal one of `choices`. */
  answer: string;
  /** If present, the question is multiple choice. Includes the answer. */
  choices?: string[];
  /** Point value, matching the [n pts] scale the real tests use. */
  points: number;
  explanation?: string;
  source: { label: string; href: string };
  /** True if built from this app's live dataset rather than written by hand. */
  generated?: boolean;
}

/** Deterministic shuffle, so server and client render the same order. */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const rand = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
