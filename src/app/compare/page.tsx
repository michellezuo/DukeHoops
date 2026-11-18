import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { getPlayersByIds, getScoringShare, listPlayerSummaries } from "@/lib/data/queries";
import { METRICS, fmt, fmtInt, fmtPct, calculatedMetrics, seasonLabel, seasonMetric, type MetricKey } from "@/lib/stats";
import { relevantRuleChanges } from "@/lib/eras";
import { Card, CardHeader, DataNote, EmptyState, PageHeader, cn } from "@/components/ui/primitives";
import { PlayerPicker, type PickerPlayer } from "@/components/compare/PlayerPicker";
import { MAX_COMPARE } from "@/lib/compare";
import { SeasonTrendChart, type TrendSeries } from "@/components/charts/SeasonTrendChart";
import type { Nullable } from "@/lib/types";

export const metadata: Metadata = { title: "Compare players" };

interface Row {
  label: string;
  values: Nullable<number>[];
  format: (v: Nullable<number>) => string;
  higherIsBetter?: boolean;
  note?: string;
}

export default async function ComparePage({ searchParams }: PageProps<"/compare">) {
  const { players: raw } = await searchParams;
  const ids = (typeof raw === "string" ? raw.split(",") : []).filter((s) => /^[a-z0-9-]{1,80}$/.test(s)).slice(0, MAX_COMPARE);
  const [profiles, summaries] = await Promise.all([getPlayersByIds(ids), listPlayerSummaries()]);
  const shares = await Promise.all(profiles.map((p) => getScoringShare(p.player.id)));

  const all: PickerPlayer[] = summaries
    .filter((s) => s.gamesPlayed !== null)
    .map((s) => ({ id: s.id, name: s.fullName, first: s.firstSeason, last: s.lastSeason }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const selected: PickerPlayer[] = profiles.map((p) => {
    const ys = [...p.player.dukeSeasons].sort((a, b) => a - b);
    return { id: p.player.id, name: p.player.fullName, first: ys[0], last: ys.at(-1)! };
  });

  const rows: Row[] = profiles.length
    ? [
        { label: "Seasons", values: profiles.map((p) => p.seasonStats.length), format: (v) => fmtInt(v) },
        { label: "Games played", values: profiles.map((p) => p.career.gamesPlayed), format: fmtInt, higherIsBetter: true },
        { label: "Points / game", values: profiles.map((p) => p.career.perGame.pts), format: (v) => fmt(v), higherIsBetter: true },
        { label: "Rebounds / game", values: profiles.map((p) => p.career.perGame.reb), format: (v) => fmt(v), higherIsBetter: true },
        { label: "Assists / game", values: profiles.map((p) => p.career.perGame.ast), format: (v) => fmt(v), higherIsBetter: true },
        { label: "Steals / game", values: profiles.map((p) => p.career.perGame.stl), format: (v) => fmt(v), higherIsBetter: true },
        { label: "Blocks / game", values: profiles.map((p) => p.career.perGame.blk), format: (v) => fmt(v), higherIsBetter: true },
        { label: "Minutes / game", values: profiles.map((p) => p.career.perGame.min), format: (v) => fmt(v) },
        { label: "FG%", values: profiles.map((p) => p.career.shooting.fgPct), format: (v) => fmtPct(v), higherIsBetter: true },
        { label: "3P%", values: profiles.map((p) => p.career.shooting.tpPct), format: (v) => fmtPct(v), higherIsBetter: true, note: "3-point distance changed during this period — see context below." },
        { label: "FT%", values: profiles.map((p) => p.career.shooting.ftPct), format: (v) => fmtPct(v), higherIsBetter: true },
        { label: "TS% (calc.)", values: profiles.map((p) => calculatedMetrics(p.career.totals).tsPct), format: (v) => fmtPct(v), higherIsBetter: true },
        { label: "Share of team points (calc.)", values: shares, format: (v) => fmtPct(v), higherIsBetter: true, note: "Player points ÷ Duke points in the seasons they played. Less sensitive to era scoring levels than raw PPG." },
        { label: "Career points", values: profiles.map((p) => p.career.totals.pts), format: fmtInt, higherIsBetter: true },
        { label: "Career rebounds", values: profiles.map((p) => p.career.totals.reb), format: fmtInt, higherIsBetter: true },
        { label: "Career assists", values: profiles.map((p) => p.career.totals.ast), format: fmtInt, higherIsBetter: true },
      ]
    : [];

  // Chart aligned by Duke year (1st season, 2nd season…) so different eras overlap.
  const series: TrendSeries[] = profiles.map((p) => ({
    id: p.player.id,
    name: p.player.fullName,
    points: p.seasonStats.map((s, i) => ({ x: `Year ${i + 1}`, values: Object.fromEntries((Object.keys(METRICS) as MetricKey[]).map((k) => [k, seasonMetric(s, k)])) })),
  }));

  const allSeasons = profiles.flatMap((p) => p.player.dukeSeasons);
  const rules = relevantRuleChanges(allSeasons);
  const spanYears = allSeasons.length ? Math.max(...allSeasons) - Math.min(...allSeasons) : 0;

  return (
    <>
      <PageHeader eyebrow="Comparison" title="Compare Duke players" description={`Pick up to ${MAX_COMPARE} players from any era. Numbers cover Duke games only.`} />
      <PlayerPicker all={all} selected={selected} />

      {profiles.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Choose players to compare">
            Try{" "}
            <Link className="text-accent underline" href={`/compare?players=${summaries.filter((s) => (s.ppg ?? 0) > 17).slice(0, 2).map((s) => s.id).join(",")}`}>two high scorers</Link>
            {" "}or start typing a name above.
          </EmptyState>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {(rules.length > 0 || spanYears >= 8) && (
            <Card className="border-warning/40">
              <div className="flex gap-3 p-5">
                <AlertTriangle aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                <div className="text-sm">
                  <p className="font-semibold text-fg">Era context — raw numbers aren&apos;t directly equivalent</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
                    {rules.map((r) => <li key={r.season}>{r.text}</li>)}
                    <li>Role, minutes, and teammates differ by season; per-game numbers reflect opportunity as well as skill. “Share of team points” partly adjusts for scoring environment.</li>
                  </ul>
                </div>
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title="Career at Duke" subtitle="Best value in each row is highlighted" />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left">Stat</th>
                    {profiles.map((p) => (
                      <th key={p.player.id} scope="col" className="px-4 py-3 text-right normal-case">
                        <Link href={`/players/${p.player.id}`} className="text-sm font-semibold text-fg hover:underline">{p.player.fullName}</Link>
                        <span className="block text-xs font-normal text-muted">{selected.find((s) => s.id === p.player.id) && seasonLabel(selected.find((s) => s.id === p.player.id)!.first)}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((r) => {
                    const known = r.values.filter((v): v is number => v !== null);
                    const best = r.higherIsBetter && known.length > 1 ? Math.max(...known) : null;
                    return (
                      <tr key={r.label}>
                        <th scope="row" className="px-4 py-2.5 text-left font-medium text-fg" title={r.note}>
                          {r.label}{r.note && <span className="ml-1 text-muted">ⓘ</span>}
                        </th>
                        {r.values.map((v, i) => (
                          <td key={i} className={cn("tabular px-4 py-2.5 text-right", best !== null && v === best && "font-bold text-brand")}>{r.format(v)}</td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader title="Season-by-season trajectory" subtitle="Aligned by year at Duke (Year 1 = first season), so players from different eras line up" />
            <div className="p-5"><SeasonTrendChart series={series} /></div>
          </Card>

          <DataNote>NBA career comparison will be added with the professional careers dataset (Phase 3).</DataNote>
        </div>
      )}
    </>
  );
}
