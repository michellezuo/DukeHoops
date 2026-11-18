"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, ExternalLink, MinusCircle, RotateCcw, Shuffle, X } from "lucide-react";
import { QUIZ_CATEGORIES, seededShuffle, type QuizCategory, type QuizQuestion } from "@/lib/tenting/types";
import { Badge, cn } from "@/components/ui/primitives";

type Outcome = "right" | "wrong" | "blank";

export function PracticeQuiz({ questions }: { questions: QuizQuestion[] }) {
  const counts = useMemo(() => Object.fromEntries(QUIZ_CATEGORIES.map((c) => [c, questions.filter((q) => q.category === c).length])) as Record<QuizCategory, number>, [questions]);
  const available = QUIZ_CATEGORIES.filter((c) => counts[c] > 0);

  const [cats, setCats] = useState<Set<QuizCategory>>(() => new Set(available));
  const [penalty, setPenalty] = useState(true);
  const [order, setOrder] = useState<string[]>(() => seededShuffle(questions, "start").map((q) => q.id));
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<Record<string, Outcome>>({});
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [draft, setDraft] = useState("");

  const byId = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions]);
  const deck = useMemo(() => order.map((id) => byId.get(id)!).filter((q) => q && cats.has(q.category)), [order, byId, cats]);
  const q = deck[idx];
  const done = idx >= deck.length;

  const score = deck.reduce((acc, d) => acc + (results[d.id] === "right" ? d.points : results[d.id] === "wrong" && penalty ? -d.points : 0), 0);
  const possible = deck.reduce((acc, d) => acc + d.points, 0);
  const answered = deck.filter((d) => results[d.id]).length;

  const resetCard = () => { setPicked(null); setRevealed(false); setDraft(""); };
  const restart = (ids: string[]) => { setOrder(ids); setIdx(0); setResults({}); resetCard(); };
  const record = (o: Outcome) => setResults((r) => ({ ...r, [q.id]: o }));
  const next = () => { setIdx((i) => i + 1); resetCard(); };

  const toggleCat = (c: QuizCategory) => {
    setCats((s) => {
      const n = new Set(s);
      if (n.has(c)) n.delete(c); else n.add(c);
      return n.size ? n : s;
    });
    setIdx(0); setResults({}); resetCard();
  };

  const missed = deck.filter((d) => results[d.id] === "wrong");

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
        <div>
          <p className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">Categories</p>
          <div className="flex flex-wrap gap-2">
            {available.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={cats.has(c)}
                onClick={() => toggleCat(c)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
                  cats.has(c) ? "border-brand bg-brand text-on-brand" : "border-border bg-surface text-muted hover:text-fg",
                )}
              >
                {c} <span className="opacity-75">({counts[c]})</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <label className="inline-flex cursor-pointer items-center gap-2 font-semibold text-fg">
            <input type="checkbox" checked={penalty} onChange={(e) => setPenalty(e.target.checked)} className="h-4 w-4 accent-[var(--brand)]" />
            Test-day scoring (wrong answers lose points)
          </label>
          <button type="button" onClick={() => restart(seededShuffle(questions, String(Math.random())).map((x) => x.id))} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 font-semibold hover:bg-surface-2">
            <Shuffle className="h-4 w-4" /> Shuffle &amp; restart
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-base font-bold text-fg">
          {done ? "Finished" : `Question ${idx + 1} of ${deck.length}`}
        </p>
        <p className="tabular text-base text-muted">
          Score <span className="text-xl font-extrabold text-fg">{score}</span> / {possible} pts · {answered} answered
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden>
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${deck.length ? (Math.min(idx, deck.length) / deck.length) * 100 : 0}%` }} />
      </div>

      {done ? (
        <Summary score={score} possible={possible} missed={missed} penalty={penalty} results={results} deck={deck}
          onRetryMissed={() => { const ids = missed.map((m) => m.id); setOrder(ids.concat(order.filter((id) => !ids.includes(id)))); setIdx(0); setResults({}); resetCard(); setCats(new Set(available)); }}
          onRestart={() => restart(order)} />
      ) : (
        <article className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">{q.category}</Badge>
            <Badge>{q.points} pt{q.points === 1 ? "" : "s"}</Badge>
            {q.generated && <Badge tone="success">Live data</Badge>}
          </div>
          <h3 className="mt-4 text-xl font-bold leading-snug text-fg sm:text-2xl">{q.prompt}</h3>

          {q.choices ? (
            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {q.choices.map((c, i) => {
                const isAnswer = c === q.answer;
                const chosen = picked === c;
                return (
                  <button
                    key={c}
                    type="button"
                    disabled={revealed}
                    onClick={() => { setPicked(c); setRevealed(true); record(isAnswer ? "right" : "wrong"); }}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-base font-semibold transition-colors",
                      !revealed && "border-border hover:border-brand hover:bg-brand-soft",
                      revealed && isAnswer && "border-success bg-success/10 text-fg",
                      revealed && chosen && !isAnswer && "border-danger bg-danger/10 text-fg",
                      revealed && !isAnswer && !chosen && "border-border opacity-60",
                    )}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-bold text-muted">{String.fromCharCode(65 + i)}</span>
                    <span className="flex-1">{c}</span>
                    {revealed && isAnswer && <Check className="h-5 w-5 text-success" aria-label="Correct answer" />}
                    {revealed && chosen && !isAnswer && <X className="h-5 w-5 text-danger" aria-label="Your answer" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-5">
              <label htmlFor="draft" className="text-sm font-semibold text-muted">Your answer (optional: write it down before you check)</label>
              <textarea id="draft" value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} disabled={revealed}
                className="mt-1.5 w-full rounded-lg border border-border bg-bg px-3 py-2 text-base text-fg focus:outline-none focus:ring-2 focus:ring-accent" />
              {!revealed && (
                <button type="button" onClick={() => setRevealed(true)} className="mt-3 rounded-lg bg-brand px-5 py-2.5 text-base font-bold text-on-brand hover:bg-brand-strong">
                  Show answer
                </button>
              )}
            </div>
          )}

          {revealed && (
            <div className="mt-5 rounded-xl bg-surface-2 p-4">
              <p className="text-sm font-bold uppercase tracking-wide text-muted">Answer</p>
              <p className="mt-1 text-lg font-bold text-fg">{q.answer}</p>
              {q.explanation && <p className="mt-2 text-base text-fg/85">{q.explanation}</p>}
              <p className="mt-2 text-sm text-muted">
                Source:{" "}
                {q.source.href.startsWith("/") ? (
                  <Link href={q.source.href} className="font-semibold text-accent hover:underline">{q.source.label}</Link>
                ) : (
                  <a href={q.source.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-accent hover:underline">{q.source.label}<ExternalLink className="h-3.5 w-3.5" /></a>
                )}
              </p>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {!q.choices && revealed && !results[q.id] && (
              <>
                <button type="button" onClick={() => { record("right"); next(); }} className="inline-flex items-center gap-1.5 rounded-lg bg-success px-4 py-2.5 text-base font-bold text-white hover:opacity-90"><Check className="h-5 w-5" /> I got it</button>
                <button type="button" onClick={() => { record("wrong"); next(); }} className="inline-flex items-center gap-1.5 rounded-lg bg-danger px-4 py-2.5 text-base font-bold text-white hover:opacity-90"><X className="h-5 w-5" /> I missed it</button>
                <button type="button" onClick={() => { record("blank"); next(); }} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2.5 text-base font-bold hover:bg-surface-2"><MinusCircle className="h-5 w-5" /> I&apos;d have left it blank</button>
              </>
            )}
            {!revealed && (
              <button type="button" onClick={() => { record("blank"); next(); }} className="rounded-lg border border-border px-4 py-2.5 text-base font-semibold text-muted hover:bg-surface-2 hover:text-fg">
                Leave blank (0 pts)
              </button>
            )}
            {q.choices && revealed && (
              <button type="button" onClick={next} className="rounded-lg bg-brand px-5 py-2.5 text-base font-bold text-on-brand hover:bg-brand-strong">Next question →</button>
            )}
          </div>
        </article>
      )}
    </div>
  );
}

function Summary({ score, possible, missed, penalty, results, deck, onRetryMissed, onRestart }: {
  score: number; possible: number; missed: QuizQuestion[]; penalty: boolean; results: Record<string, Outcome>; deck: QuizQuestion[];
  onRetryMissed: () => void; onRestart: () => void;
}) {
  const pct = possible ? Math.round((score / possible) * 1000) / 10 : 0;
  const blanks = deck.filter((d) => results[d.id] === "blank").length;
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 sm:p-7">
      <p className="text-sm font-bold uppercase tracking-wide text-muted">Your score</p>
      <p className="tabular mt-1 text-5xl font-extrabold text-fg">{pct}%</p>
      <p className="mt-1 text-base text-muted">
        <strong className="text-fg">{score}</strong> of {possible} points · {missed.length} wrong · {blanks} left blank{penalty ? " · wrong answers cost points" : ""}
      </p>
      <p className="mt-3 text-base text-fg/85">
        For reference, the median tent scored <strong>43%</strong> on the 2026 ordering test, and the top tent scored about <strong>79%</strong>.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {missed.length > 0 && (
          <button type="button" onClick={onRetryMissed} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-5 py-2.5 text-base font-bold text-on-brand hover:bg-brand-strong">
            <RotateCcw className="h-5 w-5" /> Retry the {missed.length} I missed first
          </button>
        )}
        <button type="button" onClick={onRestart} className="rounded-lg border border-border px-5 py-2.5 text-base font-bold hover:bg-surface-2">Start over</button>
      </div>
      {missed.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-bold text-fg">Review what you missed</h3>
          <ul className="mt-2 divide-y divide-border">
            {missed.map((m) => (
              <li key={m.id} className="py-3">
                <p className="font-semibold text-fg">{m.prompt}</p>
                <p className="mt-0.5 text-base text-success"><strong>{m.answer}</strong></p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
