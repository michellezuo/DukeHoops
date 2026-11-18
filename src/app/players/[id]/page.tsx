import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, GitCompareArrows } from "lucide-react";
import { getPlayerProfile, listPlayerSummaries } from "@/lib/data/queries";
import { METRICS, fmt, fmtInt, fmtPct, seasonLabel, seasonMetric, type MetricKey } from "@/lib/stats";
import { Badge, Card, CardHeader, DataNote, EmptyState, StatTile } from "@/components/ui/primitives";
import { PlayerAvatar } from "@/components/players/PlayerAvatar";
import { SeasonStatsTable } from "@/components/players/SeasonStatsTable";
import { SeasonTrendChart } from "@/components/charts/SeasonTrendChart";
import { GameLogChart } from "@/components/charts/GameLogChart";
import { Gloss } from "@/components/ui/Gloss";

export const revalidate = 600;

export async function generateStaticParams() {
  return (await listPlayerSummaries()).map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/players/[id]">): Promise<Metadata> {
  const profile = await getPlayerProfile((await params).id);
  return { title: profile?.player.fullName ?? "Player not found" };
}

export default async function PlayerPage({ params }: PageProps<"/players/[id]">) {
  const { id } = await params;
  const profile = await getPlayerProfile(id);
  if (!profile) notFound();
  const { player, seasonStats, career, gameLogs, seasonsContext, teamRanks } = profile;
  const years = [...player.dukeSeasons].sort((a, b) => a - b);
  const espnUrl = player.externalIds.espn ? `https://www.espn.com/mens-college-basketball/player/_/id/${player.externalIds.espn}` : null;

  const trend = [{
    id: player.id,
    name: player.fullName,
    points: seasonStats.map((s) => ({ x: seasonLabel(s.season), values: Object.fromEntries((Object.keys(METRICS) as MetricKey[]).map((k) => [k, seasonMetric(s, k)])) })),
  }];
  const ranks = Object.fromEntries(teamRanks.map((r) => [r.season, r]));

  const bio: [string, string][] = [
    ["Position", player.position ?? "—"],
    ["Height", player.displayHeight ?? "—"],
    ["Weight", player.weightLb ? `${player.weightLb} lbs` : "—"],
    ["Jersey", player.jersey ? `#${player.jersey}` : "—"],
    ["Hometown", player.birthPlace ?? "—"],
    ["Born", player.dateOfBirth ? new Date(player.dateOfBirth + "T12:00:00").toLocaleDateString("en-US", { dateStyle: "medium" }) : "—"],
  ];

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm text-muted"><Link href="/players" className="hover:underline">Players</Link> / <span className="text-fg">{player.fullName}</span></nav>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-5 bg-gradient-to-r from-duke-navy to-duke-royal px-6 py-6 text-white">
          <PlayerAvatar name={player.fullName} src={player.headshotUrl} size={88} className="ring-4 ring-white/20" />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold sm:text-3xl">{player.fullName}</h1>
            <p className="mt-1 text-white/80">
              {player.position ?? "Player"} · Duke {seasonLabel(years[0])}{years.length > 1 && ` – ${seasonLabel(years.at(-1)!)}`} · {years.length} season{years.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/compare?players=${player.id}`} className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-2 text-sm font-medium hover:bg-white/25"><GitCompareArrows className="h-4 w-4" /> Compare</Link>
            {espnUrl && <a href={espnUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-2 text-sm font-medium hover:bg-white/25">ESPN <ExternalLink className="h-3.5 w-3.5" /></a>}
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3 lg:grid-cols-6">
          {bio.map(([k, v]) => (
            <div key={k} className="bg-surface px-5 py-3">
              <dt className="text-sm font-bold uppercase tracking-wide text-muted">{k}</dt>
              <dd className="mt-0.5 font-semibold text-fg"><Gloss text={v} align="left" /></dd>
            </div>
          ))}
        </dl>
      </Card>

      <section aria-label="Career summary" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Games" value={fmtInt(career.gamesPlayed)} hint={career.gamesStarted !== null ? `${career.gamesStarted} starts` : undefined} />
        <StatTile label="Points / game" value={fmt(career.perGame.pts)} hint={career.totals.pts !== null ? `${career.totals.pts.toLocaleString()} total` : undefined} />
        <StatTile label="Rebounds / game" value={fmt(career.perGame.reb)} />
        <StatTile label="Assists / game" value={fmt(career.perGame.ast)} />
        <StatTile label="FG%" value={fmtPct(career.shooting.fgPct)} />
        <StatTile label="3P%" value={fmtPct(career.shooting.tpPct)} />
      </section>

      {seasonStats.length === 0 ? (
        <EmptyState title="No statistics recorded">ESPN lists {player.fullName} on the roster but has no box-score stats (common for walk-ons and players who didn&apos;t appear in games).</EmptyState>
      ) : (
        <>
          <Card>
            <CardHeader title="Career trajectory" subtitle="Choose a metric — gaps mean the stat wasn't recorded that season" />
            <div className="p-5"><SeasonTrendChart series={trend} /></div>
          </Card>
          <Card>
            <CardHeader title="Season-by-season" subtitle="Duke games only" />
            <div className="p-5"><SeasonStatsTable rows={seasonStats} career={career} ranks={ranks} /></div>
          </Card>
        </>
      )}

      {gameLogs.length > 0 && (
        <Card>
          <CardHeader title="Game log" subtitle="Per-game box scores (available for recent seasons)" />
          <div className="space-y-5 p-5">
            <GameLogChart logs={gameLogs} />
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-accent">Show game-by-game table ({gameLogs.length} games)</summary>
              <div className="mt-3 max-h-[480px] overflow-auto rounded-lg border border-border">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="sticky top-0 bg-surface-2 text-sm font-bold uppercase tracking-wide text-fg">
                    <tr>{["Date", "Opponent", "Result", "MIN", "PTS", "REB", "AST", "FG", "3PT", "FT"].map((h) => <th key={h} className="px-3 py-2 text-left"><Gloss text={h} align="left" /></th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[...gameLogs].reverse().map((g) => (
                      <tr key={g.gameId}>
                        <td className="tabular px-3 py-1.5 text-muted">{g.date?.slice(0, 10) ?? "—"}</td>
                        <td className="px-3 py-1.5">{g.atVs} {g.opponent ?? "—"}</td>
                        <td className="px-3 py-1.5"><Badge tone={g.result === "W" ? "success" : g.result === "L" ? "danger" : "neutral"}>{g.result ?? "—"} {g.score ?? ""}</Badge></td>
                        <td className="tabular px-3 py-1.5">{fmt(g.min, 0)}</td>
                        <td className="tabular px-3 py-1.5 font-semibold">{fmtInt(g.pts)}</td>
                        <td className="tabular px-3 py-1.5">{fmtInt(g.reb)}</td>
                        <td className="tabular px-3 py-1.5">{fmtInt(g.ast)}</td>
                        <td className="tabular px-3 py-1.5">{g.fgm ?? "—"}-{g.fga ?? "—"}</td>
                        <td className="tabular px-3 py-1.5">{g.tpm ?? "—"}-{g.tpa ?? "—"}</td>
                        <td className="tabular px-3 py-1.5">{g.ftm ?? "—"}-{g.fta ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </div>
        </Card>
      )}

      {seasonsContext.length > 0 && (
        <Card>
          <CardHeader title="Team context" subtitle="How Duke did in this player's seasons" />
          <ul className="divide-y divide-border">
            {seasonsContext.map((s) => (
              <li key={s.season}>
                <Link href={`/seasons/${s.season}`} className="flex items-center justify-between px-5 py-3 text-sm hover:bg-surface-2">
                  <span className="font-medium text-fg">{s.label}</span>
                  <span className="tabular text-muted">{s.wins !== null ? `${s.wins}-${s.losses}` : "—"} · ACC {s.conferenceRecord ?? "—"} · {s.coach ?? "—"}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="space-y-1">
        <DataNote>Source: {espnUrl ? <a className="underline" href={espnUrl} target="_blank" rel="noopener noreferrer">ESPN</a> : "ESPN"}, retrieved {new Date(player.source.retrievedAt).toLocaleDateString()}. Advanced metrics like PER, usage, and offensive/defensive rating need play-by-play or team-possession data and will be added when a reliable source is integrated.</DataNote>
        <DataNote>NBA/pro career data is planned for Phase 3 and will link here.</DataNote>
      </div>
    </div>
  );
}
