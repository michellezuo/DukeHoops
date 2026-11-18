"use client";

import { useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { METRICS, type MetricKey } from "@/lib/stats";
import { AXIS, GRID, SERIES, TOOLTIP_STYLE } from "./chartTheme";
import { MetricSwitcher } from "./MetricSwitcher";

export interface TrendSeries {
  id: string;
  name: string;
  points: { x: string; values: Partial<Record<MetricKey, number | null>> }[];
}

const DEFAULT_OPTIONS: MetricKey[] = ["pts", "reb", "ast", "stl", "blk", "min", "fgPct", "tpPct", "ftPct", "tsPct"];

/**
 * Line chart of a selectable metric over seasons. Supports one or many series
 * (player profile = 1, comparison = many). Missing values render as gaps.
 * xMode "season" aligns by calendar season; "careerYear" aligns by Duke year 1, 2, 3…
 */
export function SeasonTrendChart({ series, options = DEFAULT_OPTIONS, initial = "pts", height = 300 }: { series: TrendSeries[]; options?: MetricKey[]; initial?: MetricKey; height?: number }) {
  const [metric, setMetric] = useState<MetricKey>(initial);
  const isPct = METRICS[metric].kind === "pct";

  // Merge series into recharts rows keyed by x.
  const xs: string[] = [];
  for (const s of series) for (const p of s.points) if (!xs.includes(p.x)) xs.push(p.x);
  xs.sort();
  const data = xs.map((x) => {
    const row: Record<string, string | number | null> = { x };
    for (const s of series) {
      const v = s.points.find((p) => p.x === x)?.values[metric];
      row[s.id] = v === undefined || v === null ? null : isPct ? +(v * 100).toFixed(1) : v;
    }
    return row;
  });

  return (
    <div className="space-y-4">
      <MetricSwitcher label="Chart metric" options={options.map((k) => ({ key: k, label: METRICS[k].short }))} value={metric} onChange={setMetric} />
      <div style={{ height }} role="img" aria-label={`${METRICS[metric].label} by season`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="x" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} />
            <YAxis tick={AXIS} tickLine={false} axisLine={false} unit={isPct ? "%" : ""} domain={isPct ? [0, 100] : [0, "auto"]} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v) => (v === null || v === undefined ? "—" : `${v}${isPct ? "%" : ""}`)} />
            {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
            {series.map((s, i) => (
              <Line key={s.id} type="monotone" dataKey={s.id} name={s.name} stroke={SERIES[i % SERIES.length]} strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls={false} isAnimationActive={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted">{METRICS[metric].label}{metric === "tsPct" || metric === "efgPct" ? " — calculated from box-score totals, not an official stat." : ""}</p>
    </div>
  );
}
