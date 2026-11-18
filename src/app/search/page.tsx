import type { Metadata } from "next";
import Link from "next/link";
import { parseStatQuery, runStatQuery, searchAll, type SearchHit } from "@/lib/data/queries";
import { METRICS, fmt, fmtPct, seasonLabel, formatMetric } from "@/lib/stats";
import { Card, CardHeader, DataNote, EmptyState, PageHeader } from "@/components/ui/primitives";
import { GlobalSearch } from "@/components/search/GlobalSearch";

export const metadata: Metadata = { title: "Search" };

const EXAMPLES = [
  "more than 20 points",
  "at least 15 points and at least 8 rebounds",
  "over 6 assists",
  "more than 2 blocks",
  "Krzyzewski",
  "North Carolina",
];

const KIND_LABEL: Record<SearchHit["kind"], string> = { player: "Players", season: "Seasons", coach: "Coaches", game: "Games" };

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const { q: raw } = await searchParams;
  const q = typeof raw === "string" ? raw.slice(0, 120) : "";
  const filters = parseStatQuery(q);
  const [hits, statRows] = await Promise.all([q ? searchAll(q, 20) : Promise.resolve([]), runStatQuery(filters)]);
  const groups = (Object.keys(KIND_LABEL) as SearchHit["kind"][]).map((k) => ({ kind: k, items: hits.filter((h) => h.kind === k) })).filter((g) => g.items.length);
  const opText = { ">": "more than", ">=": "at least", "<": "less than", "<=": "at most" } as const;

  return (
    <>
      <PageHeader eyebrow="Search & discovery" title="Search the database" description="Find players, seasons, coaches, and opponents by name — or describe a statistical season in plain English." />
      <div className="max-w-2xl"><GlobalSearch variant="hero" /></div>
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        <span className="text-muted">Try:</span>
        {EXAMPLES.map((e) => <Link key={e} href={`/search?q=${encodeURIComponent(e)}`} className="rounded-full border border-border bg-surface px-3 py-0.5 text-fg hover:bg-surface-2">{e}</Link>)}
      </div>

      {q && (
        <div className="mt-8 space-y-6">
          {filters.length > 0 && (
            <Card>
              <CardHeader
                title={`Seasons where a Duke player averaged ${filters.map((f) => `${opText[f.op]} ${f.value} ${METRICS[f.metric].label.toLowerCase()}`).join(" and ")}`}
                subtitle={`${statRows.length} player-season${statRows.length === 1 ? "" : "s"} · minimum 10 games`}
              />
              {statRows.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead className="bg-surface-2 text-xs uppercase text-muted">
                      <tr>{["Player", "Season", "GP", "PTS", "REB", "AST", "FG%"].map((h, i) => <th key={h} className={`px-4 py-2.5 ${i < 2 ? "text-left" : "text-right"}`}>{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {statRows.map(({ player, stats }) => (
                        <tr key={`${player.id}-${stats.season}`} className="hover:bg-surface-2">
                          <td className="px-4 py-2"><Link href={`/players/${player.id}`} className="font-medium hover:underline">{player.fullName}</Link></td>
                          <td className="px-4 py-2"><Link href={`/seasons/${stats.season}`} className="text-accent hover:underline">{seasonLabel(stats.season)}</Link></td>
                          <td className="tabular px-4 py-2 text-right">{stats.gamesPlayed ?? "—"}</td>
                          <td className="tabular px-4 py-2 text-right">{fmt(stats.perGame.pts)}</td>
                          <td className="tabular px-4 py-2 text-right">{fmt(stats.perGame.reb)}</td>
                          <td className="tabular px-4 py-2 text-right">{fmt(stats.perGame.ast)}</td>
                          <td className="tabular px-4 py-2 text-right">{fmtPct(stats.shooting.fgPct)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-5"><EmptyState title="No seasons match">Loosen a threshold and try again.</EmptyState></div>
              )}
              <div className="px-5 pb-4 pt-2"><DataNote>Parsed as: {filters.map((f) => `${METRICS[f.metric].short} ${f.op} ${formatMetric(f.metric, f.value)}`).join(", ")}. Results come straight from the database — nothing is estimated.</DataNote></div>
            </Card>
          )}

          {groups.map((g) => (
            <Card key={g.kind}>
              <CardHeader title={KIND_LABEL[g.kind]} subtitle={`${g.items.length} match${g.items.length === 1 ? "" : "es"}`} />
              <ul className="divide-y divide-border">
                {g.items.map((h) => (
                  <li key={h.id}>
                    <Link href={h.href} className="block px-5 py-3 hover:bg-surface-2">
                      <span className="font-medium text-fg">{h.title}</span>
                      <span className="block text-sm text-muted">{h.subtitle}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ))}

          {!filters.length && !groups.length && <EmptyState title={`No results for “${q}”`}>Check the spelling, or try a stat phrase like “more than 18 points”.</EmptyState>}
        </div>
      )}
    </>
  );
}
