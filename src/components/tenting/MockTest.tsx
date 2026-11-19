"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, ExternalLink, Send, Timer, X } from "lucide-react";
import { formatClock, MOCK_DURATION_MS, MOCK_WARN_MS, mockOrder, needsGrading, remainingMs, scoreMock, type MockResult } from "@/lib/tenting/mock";
import { useMissed } from "@/lib/tenting/useMissed";
import { readMockSession, useMockSession } from "@/lib/tenting/useMockSession";
import type { QuizQuestion } from "@/lib/tenting/types";
import { Badge, cn } from "@/components/ui/primitives";

const NONE: Record<string, never> = {}; // stable empty object, so memoized values don't recompute every render

interface Finished {
  result: MockResult;
  answers: Record<string, string>;
  startedAt: number;
  submittedAt: number;
}

/**
 * Timed mock test. While a test is running or being graded it lives in sessionStorage (useMockSession), so a
 * reload or an in-app link resumes it and the clock keeps counting from the original start time. The saved
 * session is cleared when the score is shown.
 */
export function MockTest({ questions, onFinish }: { questions: QuizQuestion[]; onFinish: () => void }) {
  const test = useMemo(() => mockOrder(questions), [questions]);
  const possible = test.reduce((a, q) => a + q.points, 0);
  const minutes = MOCK_DURATION_MS / 60_000;

  const mock = useMockSession();
  const { session, submit } = mock;
  const missed = useMissed();
  const [finished, setFinished] = useState<Finished | null>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [now, setNow] = useState(0);

  const running = !!session && session.submittedAt === null;
  const phase = session ? (running ? "running" : "grading") : finished ? "results" : "intro";
  const answers = session?.answers ?? finished?.answers ?? NONE;
  const grades = session?.grades ?? NONE;

  const answered = test.filter((q) => (answers[q.id] ?? "").trim() !== "").length;
  const toGrade = useMemo(() => needsGrading(test, answers), [test, answers]);
  const pending = useMemo(() => scoreMock(test, answers, grades), [test, answers, grades]);

  // Countdown + auto-submit at 0:00 (also right away if time ran out while the page was closed), plus a
  // "leave page?" prompt for reloads and closing the tab. The clock is computed from the saved start time.
  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const s = readMockSession();
      if (!s || s.submittedAt !== null) return;
      const t = Date.now();
      if (remainingMs(s.startedAt, t) <= 0) submit(s.startedAt + MOCK_DURATION_MS);
      else setNow(t);
    };
    const first = window.setTimeout(tick, 0); // resume: show the right time immediately
    const every = window.setInterval(tick, 500);
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ""; // older Safari needs this to show the prompt
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(every);
      window.removeEventListener("beforeunload", warn);
    };
  }, [running, submit]);

  const start = () => {
    const t = Date.now();
    setNow(t);
    setConfirmSubmit(false);
    setFinished(null);
    mock.start(t);
  };
  const finish = () => {
    if (!session || session.submittedAt === null) return;
    // Feed the missed-question list (Phase 3a): wrong → saved, right → counts toward clearing, blank → streak reset.
    for (const [id, o] of Object.entries(pending.outcomes)) missed.record(id, o);
    setFinished({ result: pending, answers: session.answers, startedAt: session.startedAt, submittedAt: session.submittedAt });
    onFinish(); // keep the Mock test tab open after the saved session is gone
    mock.clear();
  };

  // ---------------------------------------------------------------- intro
  if (phase === "intro") {
    return (
      <section className="rounded-2xl border border-border bg-surface p-5 sm:p-7">
        <p className="text-sm font-bold uppercase tracking-wide text-muted">Mock test</p>
        <p className="mt-1 text-3xl font-extrabold text-fg">{test.length} questions · {possible} points · {minutes} minutes</p>
        <ul className="mt-4 list-disc space-y-1.5 pl-6 text-base text-fg/85">
          <li>Every question, in the same order each time, so you can compare attempts.</li>
          <li>Answers stay hidden until you submit. At 0:00 the test submits itself.</li>
          <li><strong>Test-day scoring:</strong> right = +points, wrong = −points (bonus questions: no penalty), blank = 0. Leave it blank if you&apos;re not sure.</li>
          <li>After submitting, you grade your own written answers against the key; multiple choice is graded for you.</li>
          <li>If you reload or leave the page, the test picks up where you left off in this tab, and the clock keeps running.</li>
        </ul>
        <button type="button" onClick={start} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-base font-bold text-on-brand hover:bg-brand-strong">
          <Timer className="h-5 w-5" /> Start test
        </button>
      </section>
    );
  }

  // ---------------------------------------------------------------- running
  if (phase === "running" && session) {
    const left = remainingMs(session.startedAt, now);
    const ticking = now >= session.startedAt; // false for an instant after a resume, before the first tick
    return (
      <div className="space-y-4">
        <div className="sticky top-16 z-30 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface/95 px-4 py-3 shadow-sm backdrop-blur">
          <p className={cn("tabular inline-flex items-center gap-2 text-2xl font-extrabold", ticking && left <= MOCK_WARN_MS ? "text-danger" : "text-fg")} aria-live="off">
            <Timer className="h-6 w-6" aria-hidden /> {ticking ? formatClock(left) : "–:––"}
            <span className="sr-only"> remaining</span>
          </p>
          <p className="tabular text-base text-muted">{answered} / {test.length} answered</p>
          {confirmSubmit ? (
            <span className="inline-flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-fg">{answered < test.length ? `Submit with ${test.length - answered} unanswered?` : "Submit now?"}</span>
              <button type="button" onClick={() => { setConfirmSubmit(false); submit(Date.now()); }} className="rounded-lg bg-brand px-3 py-1.5 font-bold text-on-brand hover:bg-brand-strong">Yes, submit</button>
              <button type="button" onClick={() => setConfirmSubmit(false)} className="rounded-lg border border-border px-3 py-1.5 font-semibold hover:bg-surface-2">Keep going</button>
            </span>
          ) : (
            <button type="button" onClick={() => setConfirmSubmit(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-base font-bold text-on-brand hover:bg-brand-strong">
              <Send className="h-4 w-4" /> Submit
            </button>
          )}
        </div>

        <ol className="space-y-4">
          {test.map((q, i) => (
            <li key={q.id} className="rounded-2xl border border-border bg-surface p-5">
              <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-muted">
                <span>{i + 1}. <span className="text-fg">[{q.points} pt{q.points === 1 ? "" : "s"}]</span> · {q.category}</span>
                {q.bonus && <Badge tone="success">Bonus · no penalty</Badge>}
              </p>
              {q.choices ? (
                <fieldset className="mt-2">
                  <legend className="text-lg font-bold leading-snug text-fg">{q.prompt}</legend>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {q.choices.map((c) => (
                      <label key={c} className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-2.5 text-base font-semibold",
                        answers[q.id] === c ? "border-brand bg-brand-soft" : "border-border hover:border-brand",
                      )}>
                        <input type="radio" name={q.id} value={c} checked={answers[q.id] === c} onChange={() => mock.setAnswer(q.id, c)} className="h-4 w-4 accent-[var(--brand)]" />
                        {c}
                      </label>
                    ))}
                  </div>
                  {answers[q.id] && (
                    <button type="button" onClick={() => mock.setAnswer(q.id, "")} className="mt-2 text-sm font-semibold text-muted hover:text-fg hover:underline">Clear (leave blank)</button>
                  )}
                </fieldset>
              ) : (
                <div className="mt-2">
                  <label htmlFor={`mock-${q.id}`} className="text-lg font-bold leading-snug text-fg">{q.prompt}</label>
                  <textarea id={`mock-${q.id}`} rows={2} value={answers[q.id] ?? ""} onChange={(e) => mock.setAnswer(q.id, e.target.value)}
                    placeholder="Leave empty to skip (0 pts)"
                    className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2 text-base text-fg focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
    );
  }

  // ---------------------------------------------------------------- grading
  if (phase === "grading" && session && session.submittedAt !== null) {
    const timedOut = session.submittedAt - session.startedAt >= MOCK_DURATION_MS;
    const gradedCount = toGrade.filter((q) => grades[q.id]).length;
    return (
      <section className="space-y-4">
        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-7">
          <p className="text-sm font-bold uppercase tracking-wide text-muted">{timedOut ? "Time's up" : "Submitted"}</p>
          <p className="mt-1 text-2xl font-extrabold text-fg">Grade your written answers</p>
          <p className="mt-1 text-base text-muted">
            {toGrade.length
              ? <>Multiple choice is graded. Compare each written answer with the key and mark it. Be strict: on the real test, close isn&apos;t right. {gradedCount} / {toGrade.length} graded.</>
              : "You didn't write any answers, so there's nothing to grade."}
          </p>
        </div>
        {toGrade.length > 0 && (
          <ol className="space-y-3">
            {toGrade.map((q) => (
              <li key={q.id} className="rounded-2xl border border-border bg-surface p-5">
                <p className="text-base font-bold text-fg">{q.prompt} <span className="text-sm font-semibold text-muted">[{q.points} pt{q.points === 1 ? "" : "s"}]</span></p>
                <dl className="mt-2 grid gap-1 text-base sm:grid-cols-[8rem_1fr]">
                  <dt className="font-semibold text-muted">Your answer</dt><dd className="whitespace-pre-wrap text-fg">{answers[q.id]}</dd>
                  <dt className="font-semibold text-muted">Answer key</dt><dd className="font-bold text-fg">{q.answer}</dd>
                </dl>
                <div className="mt-3 flex gap-2" role="group" aria-label={`Grade: ${q.prompt}`}>
                  <GradeButton active={grades[q.id] === "right"} tone="success" onClick={() => mock.grade(q.id, "right")}><Check className="h-4 w-4" /> Right</GradeButton>
                  <GradeButton active={grades[q.id] === "wrong"} tone="danger" onClick={() => mock.grade(q.id, "wrong")}><X className="h-4 w-4" /> Wrong</GradeButton>
                </div>
              </li>
            ))}
          </ol>
        )}
        <button type="button" onClick={finish} disabled={pending.ungraded > 0}
          className="rounded-lg bg-brand px-5 py-2.5 text-base font-bold text-on-brand hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50">
          {pending.ungraded > 0 ? `Grade ${pending.ungraded} more to see your score` : "Show my score"}
        </button>
      </section>
    );
  }

  // ---------------------------------------------------------------- results
  if (!finished) return null;
  const { result } = finished;
  const timeUsed = Math.min(finished.submittedAt - finished.startedAt, MOCK_DURATION_MS);
  const timedOut = finished.submittedAt - finished.startedAt >= MOCK_DURATION_MS;
  const pct = possible ? Math.round((result.score / possible) * 1000) / 10 : 0;
  const wrongQs = test.filter((q) => result.outcomes[q.id] === "wrong");
  const blankQs = test.filter((q) => result.outcomes[q.id] === "blank");
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-7">
        <p className="text-sm font-bold uppercase tracking-wide text-muted">Mock test score</p>
        <p className="tabular mt-1 text-5xl font-extrabold text-fg">{result.score} <span className="text-2xl font-bold text-muted">/ {result.possible} pts</span></p>
        <p className="tabular mt-1 text-lg font-bold text-fg">{pct}%</p>
        <p className="mt-1 text-base text-muted">
          {result.right} right · {result.wrong} wrong · {result.blank} blank · {timedOut ? "time ran out" : `finished in ${formatClock(timeUsed)}`}
        </p>
        <p className="mt-3 text-base text-fg/85">
          For reference, the median tent scored <strong>43%</strong> on the 2026 ordering test, and the top tent scored about <strong>79%</strong>.
        </p>
        <p className="mt-1 text-sm text-muted">Wrong answers were added to <strong>Review missed</strong>.</p>
        <button type="button" onClick={() => setFinished(null)} className="mt-4 rounded-lg border border-border px-5 py-2.5 text-base font-bold hover:bg-surface-2">Take it again</button>
      </div>

      {wrongQs.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-7">
          <h3 className="text-lg font-bold text-fg">
            Missed ({wrongQs.length}) <span className="text-sm font-semibold text-muted">· {wrongQs.reduce((a, q) => a + (q.bonus ? 0 : q.points), 0)} pts lost</span>
          </h3>
          <ul className="mt-2 divide-y divide-border">
            {wrongQs.map((q) => <MissRow key={q.id} q={q} answer={finished.answers[q.id]} />)}
          </ul>
        </div>
      )}

      {blankQs.length > 0 && (
        <details className="rounded-2xl border border-border bg-surface p-5 sm:p-7">
          <summary className="cursor-pointer text-lg font-bold text-fg">Left blank ({blankQs.length})</summary>
          <ul className="mt-2 divide-y divide-border">
            {blankQs.map((q) => <MissRow key={q.id} q={q} />)}
          </ul>
        </details>
      )}
    </section>
  );
}

function MissRow({ q, answer }: { q: QuizQuestion; answer?: string }) {
  return (
    <li className="py-3">
      <p className="font-semibold text-fg">
        {q.prompt} <span className="text-sm text-muted">[{q.points} pt{q.points === 1 ? "" : "s"}{q.bonus ? ", bonus" : ""}]</span>
      </p>
      {answer !== undefined && <p className="mt-0.5 text-base text-danger">Your answer: {answer}</p>}
      <p className="mt-0.5 text-base text-success"><strong>{q.answer}</strong></p>
      <p className="mt-0.5 text-sm text-muted">
        Source:{" "}
        {q.source.href.startsWith("/") ? (
          <Link href={q.source.href} className="font-semibold text-accent hover:underline">{q.source.label}</Link>
        ) : (
          <a href={q.source.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-accent hover:underline">{q.source.label}<ExternalLink className="h-3.5 w-3.5" /></a>
        )}
      </p>
    </li>
  );
}

function GradeButton({ active, tone, onClick, children }: { active: boolean; tone: "success" | "danger"; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border-2 px-4 py-2 text-base font-bold transition-colors",
        active ? (tone === "success" ? "border-success bg-success text-white" : "border-danger bg-danger text-white") : "border-border hover:bg-surface-2",
      )}
    >
      {children}
    </button>
  );
}
