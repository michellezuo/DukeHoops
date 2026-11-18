import type { Nullable, PlayerSeasonStats, Totals } from "@/lib/types";

/** Formatting + calculated metrics. Any missing input → null → rendered as "—". */

export const MISSING = "—";

export function fmt(v: Nullable<number> | undefined, digits = 1): string {
  return v === null || v === undefined || Number.isNaN(v) ? MISSING : v.toFixed(digits);
}

export function fmtInt(v: Nullable<number> | undefined): string {
  return v === null || v === undefined ? MISSING : Math.round(v).toLocaleString();
}

export function fmtPct(v: Nullable<number> | undefined, digits = 1): string {
  return v === null || v === undefined || Number.isNaN(v) ? MISSING : `${(v * 100).toFixed(digits)}%`;
}

export function ratio(num: Nullable<number>, den: Nullable<number>): Nullable<number> {
  if (num === null || den === null || den === 0) return null;
  return num / den;
}

/** True shooting %: PTS / (2 × (FGA + 0.44 × FTA)). Calculated, not official. */
export function trueShooting(t: Totals): Nullable<number> {
  if (t.pts === null || t.fga === null || t.fta === null) return null;
  return ratio(t.pts, 2 * (t.fga + 0.44 * t.fta));
}

/** Effective FG %: (FGM + 0.5 × 3PM) / FGA. Calculated, not official. */
export function effectiveFg(t: Totals): Nullable<number> {
  if (t.fgm === null || t.tpm === null) return null;
  return ratio(t.fgm + 0.5 * t.tpm, t.fga);
}

export interface CalculatedMetrics {
  tsPct: Nullable<number>;
  efgPct: Nullable<number>;
  astToTov: Nullable<number>;
  ftRate: Nullable<number>;
  threePtRate: Nullable<number>;
}

export function calculatedMetrics(t: Totals): CalculatedMetrics {
  return {
    tsPct: trueShooting(t),
    efgPct: effectiveFg(t),
    astToTov: ratio(t.ast, t.tov),
    ftRate: ratio(t.fta, t.fga),
    threePtRate: ratio(t.tpa, t.fga),
  };
}

const TOTAL_KEYS: (keyof Totals)[] = ["fgm", "fga", "tpm", "tpa", "ftm", "fta", "oreb", "dreb", "reb", "ast", "stl", "blk", "tov", "pf", "pts"];

export interface CareerLine {
  seasons: number;
  gamesPlayed: Nullable<number>;
  gamesStarted: Nullable<number>;
  totals: Totals;
  perGame: { pts: Nullable<number>; reb: Nullable<number>; ast: Nullable<number>; stl: Nullable<number>; blk: Nullable<number>; tov: Nullable<number>; min: Nullable<number> };
  shooting: { fgPct: Nullable<number>; tpPct: Nullable<number>; ftPct: Nullable<number> };
}

/** Sum a stat across seasons; if ANY season is missing it, the career value is unknown (null). */
function sumStrict(values: Nullable<number>[]): Nullable<number> {
  if (values.length === 0 || values.some((v) => v === null)) return null;
  return (values as number[]).reduce((a, b) => a + b, 0);
}

export function careerLine(rows: PlayerSeasonStats[]): CareerLine {
  const totals = Object.fromEntries(TOTAL_KEYS.map((k) => [k, sumStrict(rows.map((r) => r.totals[k]))])) as unknown as Totals;
  const gp = sumStrict(rows.map((r) => r.gamesPlayed));
  const minTotal = sumStrict(rows.map((r) => (r.perGame.min !== null && r.gamesPlayed !== null ? r.perGame.min * r.gamesPlayed : null)));
  return {
    seasons: rows.length,
    gamesPlayed: gp,
    gamesStarted: sumStrict(rows.map((r) => r.gamesStarted)),
    totals,
    perGame: {
      pts: ratio(totals.pts, gp),
      reb: ratio(totals.reb, gp),
      ast: ratio(totals.ast, gp),
      stl: ratio(totals.stl, gp),
      blk: ratio(totals.blk, gp),
      tov: ratio(totals.tov, gp),
      min: ratio(minTotal, gp),
    },
    shooting: {
      fgPct: ratio(totals.fgm, totals.fga),
      tpPct: ratio(totals.tpm, totals.tpa),
      ftPct: ratio(totals.ftm, totals.fta),
    },
  };
}

export function seasonLabel(endYear: number): string {
  return `${endYear - 1}-${String(endYear).slice(-2)}`;
}

/** Metric registry used by charts, sorting, and the stat-query parser. */
export const METRICS = {
  pts: { label: "Points", short: "PPG", kind: "perGame" },
  reb: { label: "Rebounds", short: "RPG", kind: "perGame" },
  ast: { label: "Assists", short: "APG", kind: "perGame" },
  stl: { label: "Steals", short: "SPG", kind: "perGame" },
  blk: { label: "Blocks", short: "BPG", kind: "perGame" },
  tov: { label: "Turnovers", short: "TOV", kind: "perGame" },
  min: { label: "Minutes", short: "MPG", kind: "perGame" },
  fgPct: { label: "Field goal %", short: "FG%", kind: "pct" },
  tpPct: { label: "3-point %", short: "3P%", kind: "pct" },
  ftPct: { label: "Free throw %", short: "FT%", kind: "pct" },
  tsPct: { label: "True shooting % (calc.)", short: "TS%", kind: "pct" },
  efgPct: { label: "Effective FG % (calc.)", short: "eFG%", kind: "pct" },
} as const;

export type MetricKey = keyof typeof METRICS;

export function seasonMetric(row: PlayerSeasonStats, key: MetricKey): Nullable<number> {
  switch (key) {
    case "fgPct":
    case "tpPct":
    case "ftPct":
      return row.shooting[key];
    case "tsPct":
      return trueShooting(row.totals);
    case "efgPct":
      return effectiveFg(row.totals);
    default:
      return row.perGame[key];
  }
}

export function formatMetric(key: MetricKey, v: Nullable<number>): string {
  return METRICS[key].kind === "pct" ? fmtPct(v) : fmt(v);
}
