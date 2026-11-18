import Link from "next/link";
import { ArrowRight, BarChart3, CalendarRange, GitCompareArrows, Lightbulb, Search, Trophy, Users } from "lucide-react";
import { getHomeData } from "@/lib/data/queries";
import { fmt, seasonLabel } from "@/lib/stats";
import { Badge, Card, CardHeader, DataNote, EmptyState, StatTile } from "@/components/ui/primitives";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { GameRow } from "@/components/games/GameRow";
import { PlayerAvatar } from "@/components/players/PlayerAvatar";

export const revalidate = 600;

const QUICK_LINKS = [
  { href: "/players", label: "Player database", desc: "Every Duke player ESPN tracks, with filters", icon: Users },
  { href: "/seasons", label: "Season explorer", desc: "Rosters, schedules, results by year", icon: CalendarRange },
  { href: "/compare", label: "Compare players", desc: "Side-by-side careers across eras", icon: GitCompareArrows },
  { href: "/search?q=more+than+20+points", label: "Stat search", desc: "“Players who averaged over 20 points”", icon: BarChart3 },
];

export default async function HomePage() {
  const data = await getHomeData();
  const { current } = data;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="rounded-2xl bg-gradient-to-br from-duke-navy to-duke-royal px-6 py-10 text-white sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/70">Duke Men&apos;s Basketball</p>
        <h1 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">Explore, compare, and study Duke basketball history.</h1>
        <p className="mt-3 max-w-2xl text-white/80">
          {data.playerCount} players · {data.seasonCount} seasons · {data.gameCount.toLocaleString()} games, all from sourced data.
        </p>
        <div className="mt-6 max-w-2xl">
          <GlobalSearch variant="hero" />
        </div>
      </section>

      {/* Current season */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title={current ? `${current.label} season` : "Current season"}
            subtitle={current?.coach ? `Head coach: ${current.coach}` : undefined}
            action={current && <Link href={`/seasons/${current.season}`} className="text-sm font-medium text-accent hover:underline">Season page →</Link>}
          />
          {current ? (
            <div className="grid gap-4 p-5 sm:grid-cols-3">
              <StatTile label="Record" value={current.wins !== null ? `${current.wins}-${current.losses}` : "—"} hint="From completed games" />
              <StatTile label="ACC" value={current.conferenceRecord ?? "—"} hint="Regular season" />
              <StatTile label="Games on schedule" value={current.gamesScheduled} />
            </div>
          ) : (
            <div className="p-5"><EmptyState title="No current-season data yet">Run the ingestion script to load the schedule.</EmptyState></div>
          )}
          <div className="grid grid-cols-1 gap-6 border-t border-border p-5 md:grid-cols-2">
            <div>
              <h3 className="mb-1 text-sm font-semibold text-fg">Recent results</h3>
              {data.recentResults.length ? (
                <div className="divide-y divide-border">{data.recentResults.map((g) => <GameRow key={g.id} game={g} />)}</div>
              ) : (
                <p className="text-sm text-muted">No completed games yet.</p>
              )}
            </div>
            <div>
              <h3 className="mb-1 text-sm font-semibold text-fg">Upcoming</h3>
              {data.upcoming.length ? (
                <div className="divide-y divide-border">{data.upcoming.map((g) => <GameRow key={g.id} game={g} />)}</div>
              ) : (
                <p className="text-sm text-muted">No upcoming games on the schedule.</p>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title={<span className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-accent" /> Did you know?</span>} subtitle="Computed live from the database" />
          <ul className="divide-y divide-border">
            {data.facts.map((f) => (
              <li key={f.text}>
                <Link href={f.href} className="block px-5 py-3 text-sm text-fg hover:bg-surface-2">{f.text}</Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Roster */}
      <Card>
        <CardHeader
          title="Current roster"
          subtitle={current ? `${current.label} · sorted by points per game this season` : undefined}
          action={<Link href={current ? `/players?season=${current.season}` : "/players"} className="text-sm font-medium text-accent hover:underline">All players →</Link>}
        />
        {data.currentRoster.length ? (
          <ul className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
            {data.currentRoster.map((p) => (
              <li key={p.id} className="bg-surface">
                <Link href={`/players/${p.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-2">
                  <PlayerAvatar name={p.fullName} src={p.headshotUrl} size={44} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-fg">{p.fullName}</span>
                    <span className="block text-xs text-muted">#{p.jersey ?? "—"} · {p.positionAbbr ?? "—"} · {p.displayHeight ?? "—"}</span>
                  </span>
                  <span className="tabular text-right text-xs text-muted">
                    <span className="block text-sm font-semibold text-fg">{fmt(p.ppg)}</span>PPG
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-5"><EmptyState title="Roster not loaded" /></div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Top scoring seasons" subtitle={`Highest PPG ${data.meta.seasonRange[0] ? `since ${seasonLabel(data.meta.seasonRange[0])}` : ""} (min. 15 games)`} />
          <ol className="divide-y divide-border">
            {data.topSeasons.map(({ player, stats }, i) => (
              <li key={`${player.id}-${stats.season}`}>
                <Link href={`/players/${player.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-2">
                  <span className="tabular w-5 text-sm font-semibold text-muted">{i + 1}</span>
                  <span className="flex-1 text-sm"><span className="font-medium text-fg">{player.fullName}</span> <span className="text-muted">· {seasonLabel(stats.season)}</span></span>
                  <span className="tabular font-semibold text-fg">{fmt(stats.perGame.pts)}</span>
                </Link>
              </li>
            ))}
          </ol>
        </Card>

        <Card>
          <CardHeader title={<span className="flex items-center gap-2"><Trophy className="h-4 w-4 text-accent" /> National championships</span>} subtitle="Curated from NCAA records" />
          <ul className="divide-y divide-border">
            {data.championships.map((c) => (
              <li key={c.season} className="flex items-center gap-3 px-5 py-3 text-sm">
                <Badge tone="brand">{c.season}</Badge>
                <span className="flex-1 text-fg">def. {c.opponent}, {c.score}</span>
                <span className="text-xs text-muted">{c.site}</span>
              </li>
            ))}
          </ul>
          <div className="px-5 pb-4"><DataNote>Titles before 2002 aren&apos;t covered by the ESPN stats feed; their seasons will be added from historical sources.</DataNote></div>
        </Card>
      </div>

      {/* Quick nav */}
      <section aria-label="Quick navigation" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_LINKS.map(({ href, label, desc, icon: Icon }) => (
          <Link key={href} href={href} className="group rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-md">
            <Icon className="h-5 w-5 text-accent" aria-hidden />
            <p className="mt-3 flex items-center gap-1 font-semibold text-fg">{label} <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" /></p>
            <p className="mt-1 text-sm text-muted">{desc}</p>
          </Link>
        ))}
      </section>

      <p className="flex items-center gap-2 text-xs text-muted"><Search className="h-3.5 w-3.5" /> Tip: the search box understands stat queries like “at least 15 points and 8 rebounds”.</p>
    </div>
  );
}
