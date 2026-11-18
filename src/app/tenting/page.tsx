import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { BookOpen, CalendarDays, ClipboardList, ExternalLink, ListChecks, Tent, Timer, TriangleAlert } from "lucide-react";
import { getTentingQuiz } from "@/lib/data/queries";
import { GLOSSARY } from "@/lib/glossary";
import { Card, CardHeader, DataNote, PageHeader, cn } from "@/components/ui/primitives";
import { Gloss } from "@/components/ui/Gloss";
import { PracticeQuiz } from "@/components/tenting/PracticeQuiz";

export const metadata: Metadata = {
  title: "Tenting Prep",
  description: "How the K-Ville tenting tests work, what they ask, and practice questions built from live Duke data.",
};
export const revalidate = 600;

const TABS = [
  { key: "guide", label: "How the tests work", icon: BookOpen },
  { key: "quiz", label: "Practice quiz", icon: ListChecks },
  { key: "glossary", label: "Glossary", icon: ClipboardList },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const SOURCES = [
  { label: "ESPN: Inside the K-Ville ordering test (Mar. 2026)", href: "https://www.espn.com/mens-college-basketball/story/_/id/48115656/duke-basketball-krzyzewskiville-ordering-test" },
  { label: "Black Tenting Entry Test, Jan. 8, 2025 (PDF)", href: "https://s3.amazonaws.com/snwceomedia/dtc/c47a5965-0970-4943-a872-d083478fdbe5.original.pdf" },
  { label: "Black Tenting Test, Feb. 20, 2024, with answers (PDF)", href: "https://s3.amazonaws.com/snwceomedia/dtc/892f9663-08b3-4170-87a7-1816f5896874.original.pdf" },
  { label: "Duke Chronicle: Tenting 101 (Jan. 2026)", href: "https://dukechronicle.com/article/duke-university-tenting-101-mens-basketball-duke-versus-north-carolina-unc-kryzezkiville-20260119" },
  { label: "Duke Chronicle: How would you do on the 2024-25 entry test?", href: "https://dukechronicle.com/article/duke-mens-basketball-tenting-test-2024-25-krzyzewskiville-jon-scheyer-cooper-flagg-neal-begovich-cameron-crazies-20250112" },
  { label: "NBC News: The hardest exam Duke students take all year", href: "https://www.nbcnews.com/sports/college-basketball/duke-students-hardest-exam-take-year-basketball-tickets-rcna264369" },
  { label: "Krzyzewskiville (Wikipedia)", href: "https://en.wikipedia.org/wiki/Krzyzewskiville" },
];

const KVILLE_TERMS: [string, string][] = [
  ["K-Ville (Krzyzewskiville)", "The tent city on the lawn outside Cameron Indoor Stadium where students camp out for the UNC home game."],
  ["Cameron Crazies", "Duke's student section in Cameron Indoor Stadium."],
  ["Line Monitors (LMs)", "The student volunteers who run K-Ville. Two co-heads and two co-vice presidents write each test and keep it secret."],
  ["Black tenting", "The longest and most demanding tenting period. Up to 12 people share a tent; 2 must be on duty during the day and 10 overnight. Black tents line up first."],
  ["Blue / White tenting", "Later, shorter tenting periods with lighter staffing rules. In 2025 the tents ranked 71st-80th on the black entry test were offered blue spots."],
  ["Tent check", "A surprise check where Line Monitors confirm the required members are present. Missing one can cost a tent its spot."],
  ["Entry test", "A January test that decides which tents get black-tenting spots. In 2025, the top 70 scores got black spots."],
  ["Ordering test", "A February test that sets the order tents line up in, along with points from event attendance and spirit awards."],
  ["Tent captain", "The tent member who signs the honor code on the test and receives results by email."],
  ["Duke Community Standard", "Duke's honor code. Every tent signs it on the cover of the test."],
  ["Countdown to Craziness", "Duke's preseason team introduction and scrimmage night in Cameron. A frequent source of test questions."],
  ["Duke Blue Planet", "The team's behind-the-scenes video series. Tests ask about specific episodes."],
];

export default async function TentingPage({ searchParams }: PageProps<"/tenting">) {
  const { tab: raw } = await searchParams;
  const tab: TabKey = TABS.some((t) => t.key === raw) ? (raw as TabKey) : "guide";

  return (
    <>
      <PageHeader
        eyebrow="K-Ville tenting prep"
        title="Study for the tenting tests"
        description="Duke students camp out in Krzyzewskiville for UNC game seats. Before they can tent, groups take a basketball knowledge test. Here's how the tests work, what they ask, and practice questions built from the live season data."
      >
        <Tent className="hidden h-12 w-12 text-accent sm:block" aria-hidden />
      </PageHeader>

      <nav aria-label="Tenting sections" className="mb-6 flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map(({ key, label, icon: Icon }) => (
          <Link
            key={key}
            href={key === "guide" ? "/tenting" : `/tenting?tab=${key}`}
            aria-current={tab === key ? "page" : undefined}
            scroll={false}
            className={cn(
              "-mb-px inline-flex shrink-0 items-center gap-2 border-b-[3px] px-4 py-3 text-base font-bold transition-colors",
              tab === key ? "border-brand text-brand-strong" : "border-transparent text-muted hover:text-fg",
            )}
          >
            <Icon className="h-5 w-5" aria-hidden /> {label}
          </Link>
        ))}
      </nav>

      {tab === "guide" && <Guide />}
      {tab === "quiz" && <Quiz />}
      {tab === "glossary" && <Glossary />}
    </>
  );
}

// ------------------------------------------------------------------ Guide

function Guide() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Fact icon={Timer} title="60 minutes" body="Taken as a team. Your tent can split up pages, but no help from other tents." />
        <Fact icon={TriangleAlert} title="Wrong answers lose points" body="A blank is worth 0, and a wrong guess counts against you. Bonus questions have no penalty." />
        <Fact icon={ClipboardList} title="~65-80 questions" body="Not meant to be finished. The 2026 ordering test had 80 questions on about 20 pages." />
        <Fact icon={CalendarDays} title="Two tests" body={<><strong>Entry</strong> (January) decides who gets black spots. <strong>Ordering</strong> (February) sets the line order.</>} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Entry test" subtitle="Black Tenting Entry Test, Jan. 8, 2025" />
          <div className="space-y-3 p-5 text-base">
            <p><strong>Stakes:</strong> the <strong>top 70</strong> tents won black-tenting spots. Tents ranked 71st-80th were offered blue spots.</p>
            <p className="font-bold">Four sections:</p>
            <ol className="list-decimal space-y-1 pl-6">
              <li><strong>Players, Coaches & This Season:</strong> roster table, coaching staff, transfers, every score</li>
              <li><strong>Achievements & Statistics:</strong> <Gloss text="AP" /> rankings, award watch lists, stat leaders</li>
              <li><strong>Personal Info, <Gloss text="NIL" /> & Social Media:</strong> Instagram, TikTok, sponsorships</li>
              <li><strong>Fun Facts:</strong> Crazies traditions, Duke Blue Planet, Countdown to Craziness</li>
            </ol>
            <p className="text-muted">Spelling counted only on the roster and coaching-staff tables.</p>
          </div>
        </Card>
        <Card>
          <CardHeader title="Ordering test" subtitle="Feb. 20, 2024 and Feb. 23, 2026 tests" />
          <div className="space-y-3 p-5 text-base">
            <p><strong>Stakes:</strong> sets the black-tent line order, together with points for attending other Duke sports and winning spirit awards.</p>
            <p className="font-bold">Six sections:</p>
            <ol className="list-decimal space-y-1 pl-6">
              <li><strong>Awards & Achievements</strong></li>
              <li><strong>Coach Scheyer</strong></li>
              <li><strong>History & General Knowledge</strong></li>
              <li><strong>The Brotherhood:</strong> former players, brothers, Duke alumni in the <Gloss text="NBA" /></li>
              <li><strong>This Season</strong></li>
              <li><strong>Miscellaneous</strong></li>
            </ol>
            <p className="text-muted">Top tent scores: 77% (2024), 78% (2025), 79% (2026). Median: 58%, 52%, 43%.</p>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Questions that come back every year" subtitle="Learn these cold. Some of them are in the practice quiz." />
        <div className="grid gap-x-8 gap-y-5 p-5 md:grid-cols-2">
          <Checklist title="Current team" items={[
            "Every player's jersey #, position and hometown (spelling counts)",
            "Every coaching-staff member's name and official title, plus the GM",
            "Transfers this season and the schools they came from",
            "Every opponent and final score, Duke's score first",
            "Overall and ACC record",
            "AP poll rank for every week",
            "Team leaders (PPG, 3s, FT%, steals) and full stat lines from big games",
            "Preseason All-Americans and award watch lists (Naismith, Wooden, Jerry West, etc.)",
            "Date, day and tip-off time of both UNC games",
          ]} />
          <Checklist title="History & program" items={[
            "Career leaders in points, assists, rebounds, steals and blocks, with totals",
            "Every Naismith National Player of the Year and the year he won",
            "All five national titles: opponent, site, starters, score, MOP",
            "Every No. 1 overall NBA draft pick from Duke",
            "Cameron Indoor: capacity (9,314), opening year, matchbook sketch",
            "Crazies traditions and what to do at each moment of a game",
            "Coach Scheyer's background: high school, playing career, first win",
            "Current Duke players in the NBA and their teams",
          ]} />
        </div>
      </Card>

      <Card>
        <CardHeader title="How winning tents study" subtitle="Advice from tenters and Line Monitors" />
        <ul className="space-y-3 p-5 text-base">
          <Tip title="Start in November.">Take notes during every game: who scored first, buzzer-beaters, odd stat lines. A question like &ldquo;who scored the 67th point&rdquo; is only answerable if someone was writing it down.</Tip>
          <Tip title="Split it up.">Give each tent member a specialty (history, stats, social media, coaches) and build one shared study doc. The 2026 runner-up tent had a 20+ page guide.</Tip>
          <Tip title="Follow everything.">@DukeMBB on Instagram, TikTok and X, every player&apos;s personal accounts, Duke Blue Planet episodes, GoDuke.com, and the Duke Chronicle. Line Monitors write questions from these, sometimes hours before the test.</Tip>
          <Tip title="Take old tests.">Formats and many questions repeat. The 2024 and 2025 tests are linked below.</Tip>
          <Tip title="Leave it blank if you're unsure.">A wrong guess costs points, so only answer what your tent is confident about.</Tip>
          <Tip title="Know the test-day rules.">Phones, watches, earbuds and laptops get sealed away. The tent captain signs the Duke Community Standard.</Tip>
        </ul>
        <div className="border-t border-border px-5 py-4">
          <Link href="/tenting?tab=quiz" className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-base font-bold text-on-brand hover:bg-brand-strong">
            <ListChecks className="h-5 w-5" /> Take the practice quiz
          </Link>
        </div>
      </Card>

      <Sources />
    </div>
  );
}

function Fact({ icon: Icon, title, body }: { icon: typeof Timer; title: string; body: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <Icon className="h-6 w-6 text-accent" aria-hidden />
      <p className="mt-2 text-lg font-extrabold text-fg">{title}</p>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </div>
  );
}

function Checklist({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-base font-bold uppercase tracking-wide text-muted">{title}</h3>
      <ul className="mt-2 space-y-1.5">
        {items.map((it) => (
          <li key={it} className="flex gap-2 text-base"><span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" /><span><Gloss text={it} /></span></li>
        ))}
      </ul>
    </div>
  );
}

function Tip({ title, children }: { title: string; children: ReactNode }) {
  return <li><strong className="text-fg">{title}</strong> <span className="text-fg/85">{children}</span></li>;
}

function Sources() {
  return (
    <Card>
      <CardHeader title="Sources & past tests" />
      <ul className="grid gap-2 p-5 sm:grid-cols-2">
        {SOURCES.map((s) => (
          <li key={s.href}>
            <a href={s.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1.5 text-base font-semibold text-accent hover:underline">
              <ExternalLink className="mt-1 h-4 w-4 shrink-0" aria-hidden /> {s.label}
            </a>
          </li>
        ))}
      </ul>
      <div className="px-5 pb-4"><DataNote>Tenting rules change every year. Check the official K-Ville policy from the Line Monitors for this season&apos;s dates, tent sizes and check rules.</DataNote></div>
    </Card>
  );
}

// ------------------------------------------------------------------ Quiz

async function Quiz() {
  const { questions, seasonLabel } = await getTentingQuiz();
  const live = questions.filter((q) => q.generated).length;
  return (
    <div className="space-y-4">
      <p className="text-base text-fg/85">
        <strong>{questions.length} questions</strong>. <strong>{live}</strong> are built from live {seasonLabel} data (roster, scores, leaders) and update after every game. The rest are written in the style of questions that repeat on past tests. Point values follow the real tests&apos; scale.
      </p>
      <PracticeQuiz questions={questions} />
    </div>
  );
}

// ------------------------------------------------------------------ Glossary

function Glossary() {
  const groups: { title: string; keys: string[] }[] = [
    { title: "Stats", keys: ["GP", "GS", "MIN", "PTS", "REB", "AST", "STL", "BLK", "TOV", "PF", "PPG", "RPG", "APG", "FG", "3PT", "FT", "FG%", "3P%", "FT%", "TS%", "eFG%", "AST/TO", "FTr", "3PAr", "Dbl-dbl"] },
    { title: "Positions & results", keys: ["G", "F", "C", "PG", "SG", "SF", "W", "L", "OT", "@", "vs."] },
    { title: "Organizations & awards", keys: ["ACC", "NCAA", "AP", "NBA", "WNBA", "NPOY", "MOP", "NIL", "MBB", "GM", "UNC", "Coach K"] },
  ];
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="K-Ville & tenting terms" />
        <dl className="divide-y divide-border">
          {KVILLE_TERMS.map(([term, def]) => (
            <div key={term} className="grid gap-1 px-5 py-3 sm:grid-cols-[14rem_1fr] sm:gap-4">
              <dt className="text-base font-bold text-fg">{term}</dt>
              <dd className="text-base text-fg/85">{def}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <div className="grid gap-6 lg:grid-cols-3">
        {groups.map((g) => (
          <Card key={g.title}>
            <CardHeader title={g.title} />
            <dl className="divide-y divide-border">
              {g.keys.filter((k) => GLOSSARY[k]).map((k) => (
                <div key={k} className="flex gap-3 px-5 py-2.5">
                  <dt className="tabular w-16 shrink-0 text-base font-extrabold text-brand-strong">{k}</dt>
                  <dd className="text-sm text-fg/85">{GLOSSARY[k]}</dd>
                </div>
              ))}
            </dl>
          </Card>
        ))}
      </div>
      <DataNote>Tip: anywhere on the site, a term with a dotted underline shows its full meaning when you hover over it or tab to it.</DataNote>
    </div>
  );
}
