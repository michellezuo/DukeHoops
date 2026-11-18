import type { Metadata } from "next";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { listSeasons } from "@/lib/data/queries";
import { Badge, DataNote, PageHeader, cn } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Seasons" };

export default async function SeasonsPage({ searchParams }: PageProps<"/seasons">) {
  const { coach } = await searchParams;
  const all = await listSeasons();
  const seasons = typeof coach === "string" ? all.filter((s) => s.coach?.toLowerCase().replace(/\s+/g, "-") === coach) : all;
  const decades = new Map<number, typeof seasons>();
  for (const s of seasons) {
    const d = Math.floor((s.season - 1) / 10) * 10;
    decades.set(d, [...(decades.get(d) ?? []), s]);
  }
  const maxWins = Math.max(...seasons.map((s) => s.wins ?? 0), 1);

  return (
    <>
      <PageHeader eyebrow="Season explorer" title="Duke seasons" description="Pick a season to see its roster, schedule, results, and statistical leaders. Bars show total wins.">
        {typeof coach === "string" && <Link href="/seasons" className="text-sm text-accent hover:underline">Clear coach filter</Link>}
      </PageHeader>

      <div className="space-y-8">
        {[...decades.entries()].map(([decade, list]) => (
          <section key={decade} aria-labelledby={`d-${decade}`}>
            <h2 id={`d-${decade}`} className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">{decade}s</h2>
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((s) => (
                <li key={s.season}>
                  <Link href={`/seasons/${s.season}`} className={cn("block rounded-xl border bg-surface p-4 transition-shadow hover:shadow-md", s.champion ? "border-brand" : "border-border")}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-fg">{s.label}</span>
                      <span className="flex gap-1.5">
                        {s.champion && <Badge tone="brand"><Trophy className="mr-1 h-3 w-3" /> NCAA champs</Badge>}
                        {s.isCurrent && <Badge tone="success">In progress</Badge>}
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${((s.wins ?? 0) / maxWins) * 100}%` }} />
                    </div>
                    <p className="tabular mt-2 text-sm text-muted">
                      <span className="font-semibold text-fg">{s.wins !== null ? `${s.wins}-${s.losses}` : "—"}</span> · ACC {s.conferenceRecord ?? "—"} · {s.coach ?? "Coach —"}
                    </p>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
      <div className="mt-8 space-y-1">
        <DataNote>Overall records are computed from completed games in ESPN&apos;s schedule feed. Early-2000s schedules in that feed can be incomplete, so a record may differ from the official NCAA record book; official records will be cross-checked when a second source is added.</DataNote>
        <DataNote>ACC record is regular-season conference play as reported by ESPN.</DataNote>
      </div>
    </>
  );
}
