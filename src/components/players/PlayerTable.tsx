"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";
import type { PlayerSummary } from "@/lib/data/queries";
import { fmt, fmtPct, fmtInt, seasonLabel } from "@/lib/stats";
import { Badge, EmptyState, cn } from "@/components/ui/primitives";
import { PlayerAvatar } from "./PlayerAvatar";

type SortKey = "lastName" | "firstSeason" | "gamesPlayed" | "ppg" | "rpg" | "apg" | "fgPct" | "bestPpg";

const COLUMNS: { key: SortKey; label: string; title?: string; numeric?: boolean }[] = [
  { key: "lastName", label: "Player" },
  { key: "firstSeason", label: "Duke years" },
  { key: "gamesPlayed", label: "GP", title: "Games played at Duke", numeric: true },
  { key: "ppg", label: "PPG", title: "Career points per game", numeric: true },
  { key: "rpg", label: "RPG", title: "Career rebounds per game", numeric: true },
  { key: "apg", label: "APG", title: "Career assists per game", numeric: true },
  { key: "fgPct", label: "FG%", title: "Career field goal %", numeric: true },
  { key: "bestPpg", label: "Best PPG", title: "Best single-season PPG", numeric: true },
];

const PAGE_SIZE = 25;

export interface PlayerFilters {
  q: string;
  position: string;
  season: string;
  jersey: string;
  status: "" | "current" | "former";
}

export function PlayerTable({ players, seasons, initial }: { players: PlayerSummary[]; seasons: number[]; initial: PlayerFilters & { sort?: string; dir?: string } }) {
  const router = useRouter();
  const pathname = usePathname();
  const [filters, setFilters] = useState<PlayerFilters>({ q: initial.q, position: initial.position, season: initial.season, jersey: initial.jersey, status: initial.status });
  const [sort, setSort] = useState<SortKey>((COLUMNS.find((c) => c.key === initial.sort)?.key ?? "lastName") as SortKey);
  const [dir, setDir] = useState<"asc" | "desc">(initial.dir === "desc" ? "desc" : "asc");
  const [page, setPage] = useState(1);

  // Keep URL in sync so filtered views are shareable.
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
    if (sort !== "lastName") params.set("sort", sort);
    if (dir !== "asc") params.set("dir", dir);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [filters, sort, dir, pathname, router]);

  const positions = useMemo(() => [...new Set(players.map((p) => p.positionAbbr).filter(Boolean))].sort() as string[], [players]);

  const rows = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const filtered = players.filter(
      (p) =>
        (!q || p.fullName.toLowerCase().includes(q)) &&
        (!filters.position || p.positionAbbr === filters.position) &&
        (!filters.season || p.seasons.includes(Number(filters.season))) &&
        (!filters.jersey || p.jersey === filters.jersey) &&
        (!filters.status || (filters.status === "current" ? p.isCurrent : !p.isCurrent)),
    );
    return filtered.sort((a, b) => {
      const av = a[sort];
      const bv = b[sort];
      if (av === null || av === undefined) return 1; // missing values always sink
      if (bv === null || bv === undefined) return -1;
      const c = typeof av === "string" ? av.localeCompare(String(bv)) : Number(av) - Number(bv);
      return dir === "asc" ? c : -c;
    });
  }, [players, filters, sort, dir]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const update = (patch: Partial<PlayerFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };
  const toggleSort = (key: SortKey) => {
    if (key === sort) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setDir(key === "lastName" || key === "firstSeason" ? "asc" : "desc");
    }
  };

  const inputCls = "rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent";

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <input aria-label="Filter by name" placeholder="Name…" value={filters.q} onChange={(e) => update({ q: e.target.value })} className={cn(inputCls, "lg:col-span-2")} />
        <select aria-label="Position" value={filters.position} onChange={(e) => update({ position: e.target.value })} className={inputCls}>
          <option value="">All positions</option>
          {positions.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select aria-label="Season" value={filters.season} onChange={(e) => update({ season: e.target.value })} className={inputCls}>
          <option value="">All seasons</option>
          {seasons.map((s) => <option key={s} value={s}>{seasonLabel(s)}</option>)}
        </select>
        <div className="flex gap-3">
          <input aria-label="Jersey number" placeholder="#" inputMode="numeric" maxLength={2} value={filters.jersey} onChange={(e) => update({ jersey: e.target.value.replace(/\D/g, "") })} className={cn(inputCls, "w-16")} />
          <select aria-label="Status" value={filters.status} onChange={(e) => update({ status: e.target.value as PlayerFilters["status"] })} className={cn(inputCls, "flex-1")}>
            <option value="">All</option>
            <option value="current">Current</option>
            <option value="former">Former</option>
          </select>
        </div>
      </div>

      <p className="text-sm text-muted" aria-live="polite">{rows.length} player{rows.length === 1 ? "" : "s"}</p>

      {rows.length === 0 ? (
        <EmptyState title="No players match these filters">Try clearing a filter.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted">
              <tr>
                {COLUMNS.map((c) => (
                  <th key={c.key} scope="col" title={c.title} aria-sort={sort === c.key ? (dir === "asc" ? "ascending" : "descending") : "none"} className={cn("px-4 py-3 font-semibold", c.numeric ? "text-right" : "text-left")}>
                    <button type="button" onClick={() => toggleSort(c.key)} className={cn("inline-flex items-center gap-1 hover:text-fg", sort === c.key && "text-fg")}>
                      {c.label}
                      {sort === c.key && (dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visible.map((p) => (
                <tr key={p.id} className="hover:bg-surface-2">
                  <td className="px-4 py-2.5">
                    <Link href={`/players/${p.id}`} className="flex items-center gap-3">
                      <PlayerAvatar name={p.fullName} src={p.headshotUrl} size={32} />
                      <span>
                        <span className="font-medium text-fg hover:underline">{p.fullName}</span>
                        <span className="block text-xs text-muted">#{p.jersey ?? "—"} · {p.positionAbbr ?? "—"} {p.isCurrent && <Badge tone="brand">Current</Badge>}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="tabular px-4 py-2.5 text-muted">{seasonLabel(p.firstSeason)}{p.lastSeason !== p.firstSeason && ` – ${seasonLabel(p.lastSeason)}`}</td>
                  <td className="tabular px-4 py-2.5 text-right">{fmtInt(p.gamesPlayed)}</td>
                  <td className="tabular px-4 py-2.5 text-right font-semibold">{fmt(p.ppg)}</td>
                  <td className="tabular px-4 py-2.5 text-right">{fmt(p.rpg)}</td>
                  <td className="tabular px-4 py-2.5 text-right">{fmt(p.apg)}</td>
                  <td className="tabular px-4 py-2.5 text-right">{fmtPct(p.fgPct)}</td>
                  <td className="tabular px-4 py-2.5 text-right">{fmt(p.bestPpg)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between text-sm">
          <button type="button" disabled={current === 1} onClick={() => setPage(current - 1)} className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <span className="tabular text-muted">Page {current} of {pages}</span>
          <button type="button" disabled={current === pages} onClick={() => setPage(current + 1)} className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 disabled:opacity-40">
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      )}
    </div>
  );
}
