# Duke Hoops Intel

A Duke men's basketball intelligence and study platform. You can explore players and seasons, compare
careers across eras, search by statistics, and (coming soon) study with flashcards and quizzes generated from the
database.

> Unofficial fan and study project. Not affiliated with Duke University or ESPN.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 · Recharts · Lucide ·
Supabase (Postgres) · Python ingestion · GitHub Actions · Vercel

---

## What works today (Phase 1 + early Phase 2)

| Page | What it does |
|---|---|
| `/` Home | Current season record, recent results and upcoming games, current roster, computed "Did you know?" facts, top scoring seasons, national titles, global search |
| `/players` | Searchable, filterable (name, position, season, jersey, current/former), sortable, paginated database. Filters are kept in the URL so views can be shared |
| `/players/[id]` | Bio, career summary, interactive trajectory chart with a metric switcher, season table (per game / totals / shooting and calculated efficiency), game log chart and table, team context |
| `/seasons` | Timeline of every season grouped by decade, with win bars and title markers |
| `/seasons/[year]` | Record, ACC, home record, scoring margin, roster with stats, full schedule and results, top single-game performances, previous/next navigation |
| `/compare` | Up to 4 players from any era: side-by-side career table (best value highlighted), share of team points, trajectory aligned by year at Duke, and era/rule-change context |
| `/search` | Name search across players, seasons, coaches, and opponents, plus **stat queries** in plain English, e.g. "at least 15 points and 8 rebounds" |
| `/api/players`, `/api/players/[id]`, `/api/search` | JSON APIs with zod-validated input |

Data: **194 players · 26 seasons (2001-02 → 2026-27) · 932 games · 347 player-seasons · 828 game logs**,
all ingested from ESPN with source attribution.

---

## Quick start

Prerequisites: Node 20+ (tested on 24), Python 3.10+ (tested on 3.14).

```powershell
cd duke-hoops-intel
npm install
npm run dev            # http://localhost:3000
```

The repo ships with a data snapshot in `data/generated/`, so the app runs with **no credentials and no
database**.

### Refresh the data

```powershell
pip install -r ingestion/requirements.txt
python ingestion/espn_ingest.py                    # all seasons ESPN has (about 2 min cold, seconds when cached)
python ingestion/espn_ingest.py --refresh-current  # re-fetch only the in-progress season
python ingestion/espn_ingest.py --from 2015 --to 2015
```

Responses are cached in `ingestion/.cache/` (git-ignored). Run results, including roster reconciliation
drops and adds, are written to `data/generated/meta.json`.

---

## Architecture

```
duke-hoops-intel/
├── src/
│   ├── app/                    # Next.js App Router pages + API routes
│   ├── components/             # ui/ primitives, charts/, players/, compare/, search/, games/, layout/
│   └── lib/
│       ├── types.ts            # domain types (null = unknown, never 0)
│       ├── stats.ts            # formatting, calculated metrics, career aggregation, metric registry
│       ├── eras.ts             # NCAA rule changes for cross-era context
│       └── data/
│           ├── dataset.ts      # loads Supabase OR local JSON (auto-fallback), 10-min memo
│           ├── supabase-source.ts
│           └── queries.ts      # ← the only data API pages/routes use
├── ingestion/                  # Python: fetch → normalize → validate → reconcile → write JSON / upsert
│   ├── http_client.py          # cache, rate limit, retries w/ exponential backoff
│   ├── espn_ingest.py
│   └── supabase_load.py
├── data/
│   ├── generated/              # ingestion output (committed snapshot)
│   └── curated/                # hand-entered facts with citations (titles, coaches)
├── supabase/migrations/        # Postgres schema + RLS
├── .github/workflows/ingest.yml# daily scheduled ingestion
└── docs/DATA_SOURCES.md        # every API, credentials, limitations
```

**Data flow:** ESPN → `espn_ingest.py` → `data/generated/*.json` → (optional) `supabase_load.py` → Postgres.
The app reads Supabase when `NEXT_PUBLIC_SUPABASE_*` is set and falls back to the JSON snapshot otherwise.
Both backends produce the same `Dataset` shape, so `queries.ts` doesn't care which one is active.

**Why in-memory queries?** The whole Duke dataset is about 2 MB, and loading it once per server instance makes every
page fast and keeps the logic in one typed place. `queries.ts` function signatures are the contract; when
the dataset grows (pre-2002 history, NBA stats, news), individual queries can move to SQL/RPC without
touching pages.

**Design tokens:** all colors live in `src/app/globals.css` as CSS variables (Duke palette → semantic tokens
like `--brand`, `--surface`, `--muted`, and chart series). Components only use the semantic Tailwind classes
(`bg-brand`, `text-muted`, …), so a re-theme is a one-file change. Dark mode follows the OS setting.

---

## Database (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. Run the migration in the SQL editor (or `supabase db push` with the CLI):
   `supabase/migrations/20261117000000_init.sql`
3. Copy `.env.example` → `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Load data:
   ```powershell
   $env:SUPABASE_URL="https://<project>.supabase.co"; $env:SUPABASE_SERVICE_ROLE_KEY="<service key>"
   python ingestion/supabase_load.py          # or --dry-run to validate only
   ```

Schema highlights: one canonical `players.id` used by every table; `source jsonb` on every ingested row;
upserts on natural keys (idempotent re-runs); trigram index for fuzzy name search; RLS gives public read on
reference tables, owner-only access on `user_progress`, and service-role-only access on `ingestion_logs`. Tables for
drafts, pro careers, news, social links, flashcards, quizzes, and progress already exist for later phases.

## Scheduled ingestion (GitHub Actions)

`.github/workflows/ingest.yml` runs daily (and on demand). It refreshes the current season, upserts to
Supabase if `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` secrets exist, and commits the refreshed JSON
snapshot. Add the secrets under **Settings → Secrets and variables → Actions**.

## Deploy (Vercel)

Import the GitHub repo in Vercel, keep the defaults (framework: Next.js), and add the `NEXT_PUBLIC_SUPABASE_*`
env vars if you're using Supabase. `next.config.ts` makes sure `data/**/*.json` is bundled for the JSON
fallback.

---

## Data integrity rules

- Missing values are `null` and shown as **"—"**, never 0. Career totals are `null` if any season is missing
  that stat.
- Every record carries `source: {name, url, retrievedAt}`.
- Calculated metrics (TS%, eFG%, AST/TO, FTr, 3PAr, share of team points) are labeled **"calc."** and documented.
- Curated facts live in `data/curated/` with a citation, separate from ingested data.
- "Did you know?" facts and search answers are computed from the database, not hand-written.
- Known source limitations are in [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md).

## Scripts

| Command | |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type check (run `npx next typegen` first on a fresh clone) |

See [TODO.md](TODO.md) for the roadmap and open integration work.
