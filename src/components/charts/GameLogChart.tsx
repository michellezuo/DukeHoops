"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PlayerGameStats } from "@/lib/types";
import { seasonLabel } from "@/lib/stats";
import { AXIS, GRID, SERIES, TOOLTIP_STYLE } from "./chartTheme";
import { MetricSwitcher } from "./MetricSwitcher";

type GameMetric = "pts" | "reb" | "ast" | "min";
const LABELS: Record<GameMetric, string> = { pts: "Points", reb: "Rebounds", ast: "Assists", min: "Minutes" };

export function GameLogChart({ logs }: { logs: PlayerGameStats[] }) {
  const seasons = useMemo(() => [...new Set(logs.map((l) => l.season))].sort((a, b) => b - a), [logs]);
  const [season, setSeason] = useState(seasons[0]);
  const [metric, setMetric] = useState<GameMetric>("pts");

  const rows = logs.filter((l) => l.season === season);
  const data = rows.map((l) => ({
    label: `${l.date ? new Date(l.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "?"} ${l.atVs ?? ""} ${l.opponent ?? ""}`,
    short: l.date ? new Date(l.date).toLocaleDateString("en-US", { month: "numeric", day: "numeric" }) : "?",
    value: l[metric],
    result: l.result,
  }));
  const vals = data.map((d) => d.value).filter((v): v is number => v !== null);
  const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MetricSwitcher label="Game metric" options={(Object.keys(LABELS) as GameMetric[]).map((k) => ({ key: k, label: LABELS[k] }))} value={metric} onChange={setMetric} />
        {seasons.length > 1 && (
          <select aria-label="Season" value={season} onChange={(e) => setSeason(Number(e.target.value))} className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-fg">
            {seasons.map((s) => <option key={s} value={s}>{seasonLabel(s)}</option>)}
          </select>
        )}
      </div>
      <div style={{ height: 240 }} role="img" aria-label={`${LABELS[metric]} by game, ${seasonLabel(season)}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="short" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} interval="preserveStartEnd" minTickGap={12} />
            <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip {...TOOLTIP_STYLE} labelFormatter={(_, p) => (p?.[0]?.payload as { label?: string } | undefined)?.label ?? ""} formatter={(v) => [v ?? "—", LABELS[metric]]} />
            {avg !== null && <ReferenceLine y={avg} stroke={SERIES[2]} strokeDasharray="4 4" label={{ value: `avg ${avg.toFixed(1)}`, position: "insideTopRight", fontSize: 11, fill: "var(--muted)" }} />}
            <Bar dataKey="value" fill={SERIES[0]} radius={[3, 3, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
