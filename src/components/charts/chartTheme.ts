/** Chart colors come from CSS tokens so charts follow the theme (and dark mode). */
export const SERIES = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
export const GRID = "var(--chart-grid)";
export const AXIS = { fontSize: 12, fill: "var(--muted)" } as const;
export const TOOLTIP_STYLE = {
  contentStyle: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--fg)", fontSize: 13 },
  labelStyle: { color: "var(--fg)", fontWeight: 600 },
} as const;
