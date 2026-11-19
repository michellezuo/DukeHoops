"use client";

import Link from "next/link";
import { Timer } from "lucide-react";
import { MOCK_DURATION_MS } from "@/lib/tenting/mock";
import { useMockSession } from "@/lib/tenting/useMockSession";

/** On the other tenting tabs: points back to a saved mock test (running or waiting to be graded). */
export function MockResumeBanner() {
  const { session } = useMockSession();
  if (!session) return null;
  const endsAt = new Date(session.startedAt + MOCK_DURATION_MS).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return (
    <div role="status" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand bg-brand-soft px-4 py-3 text-base">
      <p className="inline-flex items-center gap-2 font-semibold text-fg">
        <Timer className="h-5 w-5 text-brand-strong" aria-hidden />
        {session.submittedAt === null
          ? <>Mock test in progress. The clock is still running; time is up at {endsAt}.</>
          : <>Your mock test is submitted and waiting to be graded.</>}
      </p>
      <Link href="/tenting?tab=quiz" className="rounded-lg bg-brand px-4 py-2 font-bold text-on-brand hover:bg-brand-strong">
        {session.submittedAt === null ? "Resume test" : "Grade it"}
      </Link>
    </div>
  );
}
