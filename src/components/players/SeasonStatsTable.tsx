"use client";

import Link from "next/link";
import { useState } from "react";
import type { PlayerSeasonStats } from "@/lib/types";
import { calculatedMetrics, fmt, fmtInt, fmtPct, seasonLabel, type CareerLine } from "@/lib/stats";
import { MetricSwitcher } from "@/components/charts/MetricSwitcher";
import { Gloss } from "@/components/ui/Gloss";

type View = "perGame" | "totals" | "shooting";

const th = "px-3 py-2.5 text-right";
const td = "tabular px-3 py-2 text-right";

export function SeasonStatsTable({ rows, career, ranks }: { rows: PlayerSeasonStats[]; career: CareerLine; ranks: Record<number, { ppgRank: number | null; rosterSize: number }> }) {
  const [view, setView] = useState<View>("perGame");
  const careerCalc = calculatedMetrics(career.totals);

  const head = {
    perGame: ["GP", "GS", "MIN", "PTS", "REB", "AST", "STL", "BLK", "TOV", "Team PPG rank"],
    totals: ["GP", "FGM-A", "3PM-A", "FTM-A", "PTS", "REB", "AST", "STL", "BLK", "TOV"],
    shooting: ["FG%", "3P%", "FT%", "TS%*", "eFG%*", "AST/TO*", "FTr*", "3PAr*"],
  }[view];

  const ma = (m: number | null, a: number | null) => (m === null || a === null ? "—" : `${m}-${a}`);

  const cells = (r: PlayerSeasonStats | null, c: CareerLine | null): string[] => {
    if (view === "perGame") {
      const pg = r ? r.perGame : c!.perGame;
      const rank = r ? ranks[r.season] : undefined;
      return [
        fmtInt(r ? r.gamesPlayed : c!.gamesPlayed), fmtInt(r ? r.gamesStarted : c!.gamesStarted), fmt(pg.min), fmt(pg.pts), fmt(pg.reb), fmt(pg.ast), fmt(pg.stl), fmt(pg.blk), fmt(pg.tov),
        r ? (rank?.ppgRank ? `${rank.ppgRank} of ${rank.rosterSize}` : "—") : "",
      ];
    }
    const t = r ? r.totals : c!.totals;
    if (view === "totals") {
      return [fmtInt(r ? r.gamesPlayed : c!.gamesPlayed), ma(t.fgm, t.fga), ma(t.tpm, t.tpa), ma(t.ftm, t.fta), fmtInt(t.pts), fmtInt(t.reb), fmtInt(t.ast), fmtInt(t.stl), fmtInt(t.blk), fmtInt(t.tov)];
    }
    const calc = r ? calculatedMetrics(r.totals) : careerCalc;
    const sh = r ? r.shooting : c!.shooting;
    return [fmtPct(sh.fgPct), fmtPct(sh.tpPct), fmtPct(sh.ftPct), fmtPct(calc.tsPct), fmtPct(calc.efgPct), fmt(calc.astToTov, 2), fmt(calc.ftRate, 2), fmt(calc.threePtRate, 2)];
  };

  return (
    <div className="space-y-3">
      <MetricSwitcher
        label="Table view"
        options={[{ key: "perGame", label: "Per game" }, { key: "totals", label: "Totals" }, { key: "shooting", label: "Shooting & efficiency" }]}
        value={view}
        onChange={setView}
      />
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-surface-2 text-sm font-bold uppercase tracking-wide text-fg">
            <tr>
              <th scope="col" className="px-3 py-2.5 text-left font-semibold">Season</th>
              {head.map((h) => <th key={h} scope="col" className={th}><Gloss text={h} align="right" /></th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.season} className="hover:bg-surface-2">
                <th scope="row" className="px-3 py-2 text-left font-semibold"><Link href={`/seasons/${r.season}`} className="text-accent hover:underline">{seasonLabel(r.season)}</Link></th>
                {cells(r, null).map((v, i) => <td key={i} className={td}>{v}</td>)}
              </tr>
            ))}
          </tbody>
          {rows.length > 1 && (
            <tfoot className="border-t-2 border-border bg-surface-2 font-semibold">
              <tr>
                <th scope="row" className="px-3 py-2 text-left">Career</th>
                {cells(null, career).map((v, i) => <td key={i} className={td}>{v}</td>)}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {view === "shooting" && <p className="text-sm text-muted">* Calculated from ESPN box-score totals (TS% = PTS / 2(FGA + 0.44·FTA); eFG% = (FGM + 0.5·3PM) / FGA; FTr = FTA/FGA; 3PAr = 3PA/FGA). Not official statistics.</p>}
      {view === "perGame" && <p className="text-sm text-muted">Team PPG rank compares against teammates with recorded stats that season.</p>}
    </div>
  );
}
