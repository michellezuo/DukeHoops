-- Duke Hoops Intel — initial schema
-- Conventions:
--   * NULL = data not available. Never store 0 for unknown values.
--   * players.id is the canonical internal slug shared by every table.
--   * Every ingested row carries source jsonb {name,url,retrievedAt}.
--   * Reference data is world-readable; writes happen only via the service role
--     (ingestion). user_progress is private to its owner.

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------- reference
create table if not exists sources (
  id          text primary key,              -- e.g. 'espn', 'bbref', 'nba_api'
  name        text not null,
  url         text,
  terms_url   text,
  notes       text
);

create table if not exists teams (
  id          text primary key,              -- 'ncaa-150', 'nba-1610612747'
  league      text not null check (league in ('ncaa','nba','gleague','intl','other')),
  name        text not null,
  abbreviation text,
  logo_url    text,
  external_ids jsonb not null default '{}'::jsonb
);

create table if not exists coaches (
  id           text primary key,
  full_name    text not null,
  first_season int,
  last_season  int,
  note         text,
  source       jsonb
);

create table if not exists players (
  id             text primary key,
  espn_id        text unique,
  bbref_id       text unique,
  nba_id         text unique,
  full_name      text not null,
  first_name     text,
  last_name      text,
  position       text,
  position_abbr  text,
  height_in      numeric,
  display_height text,
  weight_lb      numeric,
  jersey         text,
  birth_place    text,
  date_of_birth  date,
  headshot_url   text,
  source         jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists players_name_trgm on players using gin (full_name gin_trgm_ops);

create table if not exists seasons (
  season              int primary key,       -- end year (2015 = 2014-15)
  label               text not null,
  coach_name          text,
  coach_id            text references coaches(id),
  wins                int,
  losses              int,
  record_is_computed  boolean not null default true,
  conference_record   text,
  games_scheduled     int,
  is_current          boolean not null default false,
  ncaa_champion       boolean not null default false,
  source              jsonb
);

create table if not exists rosters (
  season     int  not null references seasons(season) on delete cascade,
  player_id  text not null references players(id) on delete cascade,
  jersey     text,
  position   text,
  class_year text,                           -- null until a reliable per-season source exists
  source     jsonb,
  primary key (season, player_id)
);
create index if not exists rosters_player_idx on rosters(player_id);

create table if not exists games (
  id                text primary key,        -- 'espn-<eventId>'
  espn_id           text unique,
  season            int not null references seasons(season) on delete cascade,
  game_date         timestamptz,
  opponent_name     text,
  opponent_team_id  text references teams(id),
  opponent_logo     text,
  home_away         text check (home_away in ('home','away')),
  neutral_site      boolean not null default false,
  duke_score        int,
  opponent_score    int,
  result            text check (result in ('W','L')),
  completed         boolean not null default false,
  season_type       text not null check (season_type in ('regular','postseason')),
  note              text,
  venue             text,
  source            jsonb
);
create index if not exists games_season_idx on games(season, game_date);

create table if not exists player_season_stats (
  player_id      text not null references players(id) on delete cascade,
  season         int  not null,
  games_played   int,
  games_started  int,
  min_pg numeric, pts_pg numeric, reb_pg numeric, oreb_pg numeric, dreb_pg numeric,
  ast_pg numeric, stl_pg numeric, blk_pg numeric, tov_pg numeric, pf_pg numeric,
  fgm int, fga int, tpm int, tpa int, ftm int, fta int,
  oreb int, dreb int, reb int, ast int, stl int, blk int, tov int, pf int, pts int,
  fg_pct numeric, tp_pct numeric, ft_pct numeric,
  source         jsonb,
  primary key (player_id, season)
);
create index if not exists pss_season_idx on player_season_stats(season);
create index if not exists pss_pts_idx on player_season_stats(pts_pg desc nulls last);

create table if not exists player_game_stats (
  player_id  text not null references players(id) on delete cascade,
  game_id    text not null,                  -- may reference games(id); not enforced (gamelogs can predate schedule ingest)
  season     int  not null,
  game_date  timestamptz,
  opponent   text,
  at_vs      text,
  result     text,
  score      text,
  min numeric, pts int, reb int, ast int, stl int, blk int, tov int, pf int,
  fgm int, fga int, tpm int, tpa int, ftm int, fta int,
  source     jsonb,
  primary key (player_id, game_id)
);
create index if not exists pgs_game_idx on player_game_stats(game_id);

create table if not exists team_season_stats (
  season     int primary key references seasons(season) on delete cascade,
  pace       numeric,
  off_rating numeric,
  def_rating numeric,
  ppg        numeric,
  opp_ppg    numeric,
  srs        numeric,
  sos        numeric,
  source     jsonb
);

-- ---------------------------------------------------------------- pro careers
create table if not exists drafts (
  id          bigserial primary key,
  player_id   text not null references players(id) on delete cascade,
  league      text not null default 'nba',
  year        int not null,
  round       int,
  pick        int,
  overall     int,
  team_id     text references teams(id),
  source      jsonb,
  unique (player_id, league, year)
);

create table if not exists professional_careers (
  id            bigserial primary key,
  player_id     text not null references players(id) on delete cascade,
  league        text not null,
  team_id       text references teams(id),
  team_name     text,
  start_season  int,
  end_season    int,
  status        text check (status in ('active','retired','unknown')),
  source        jsonb
);
create index if not exists pc_player_idx on professional_careers(player_id);

create table if not exists professional_season_stats (
  player_id  text not null references players(id) on delete cascade,
  league     text not null,
  season     int  not null,
  team_id    text references teams(id),
  games_played int, games_started int,
  min_pg numeric, pts_pg numeric, reb_pg numeric, ast_pg numeric, stl_pg numeric, blk_pg numeric,
  fg_pct numeric, tp_pct numeric, ft_pct numeric,
  source     jsonb,
  primary key (player_id, league, season, team_id)
);

-- ---------------------------------------------------------------- media
create table if not exists news_articles (
  id            bigserial primary key,
  url           text not null unique,
  title         text not null,
  source_name   text not null,
  published_at  timestamptz,
  summary       text,
  player_ids    text[] not null default '{}',
  season        int,
  retrieved_at  timestamptz not null default now()
);
create index if not exists news_published_idx on news_articles(published_at desc);

create table if not exists player_social_links (
  player_id  text not null references players(id) on delete cascade,
  platform   text not null check (platform in ('x','instagram','tiktok','youtube','threads','website')),
  handle     text not null,
  url        text not null,
  verified   boolean not null default false,
  source     jsonb,
  primary key (player_id, platform)
);

-- ---------------------------------------------------------------- ops
create table if not exists ingestion_logs (
  id           bigserial primary key,
  source_id    text references sources(id),
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  status       text not null check (status in ('running','success','partial','failed')),
  counts       jsonb,
  errors       jsonb
);

-- ---------------------------------------------------------------- learning
create table if not exists flashcard_decks (
  id          text primary key,
  title       text not null,
  category    text not null,
  description text
);

create table if not exists flashcards (
  id          text primary key,
  deck_id     text not null references flashcard_decks(id) on delete cascade,
  front       text not null,
  back        text not null,
  refs        jsonb not null default '[]'::jsonb  -- links to players/seasons backing the answer
);

create table if not exists quiz_questions (
  id              text primary key,
  type            text not null check (type in ('multiple_choice','fill_blank','guess_player','stat_challenge','timeline')),
  category        text not null,
  prompt          text not null,
  choices         jsonb,
  answer          jsonb not null,
  explanation     text,
  refs            jsonb not null default '[]'::jsonb,
  generated_from  jsonb                              -- query/params used to derive the question
);

create table if not exists user_progress (
  id             bigserial primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  item_type      text not null check (item_type in ('flashcard','quiz_question')),
  item_id        text not null,
  status         text check (status in ('known','learning','unknown')),
  correct_count  int not null default 0,
  attempt_count  int not null default 0,
  last_seen_at   timestamptz not null default now(),
  unique (user_id, item_type, item_id)
);

-- ---------------------------------------------------------------- RLS
do $$
declare t text;
begin
  foreach t in array array['sources','teams','coaches','players','seasons','rosters','games',
    'player_season_stats','player_game_stats','team_season_stats','drafts','professional_careers',
    'professional_season_stats','news_articles','player_social_links','flashcard_decks','flashcards','quiz_questions']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "public read" on %I', t);
    execute format('create policy "public read" on %I for select using (true)', t);
  end loop;
end $$;

alter table ingestion_logs enable row level security; -- service role only

alter table user_progress enable row level security;
drop policy if exists "own progress" on user_progress;
create policy "own progress" on user_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into sources (id, name, url, terms_url, notes) values
  ('espn', 'ESPN public JSON API', 'https://site.api.espn.com', null, 'Unofficial, undocumented endpoints. Rosters/stats from 2001-02 onward.'),
  ('curated', 'Manually curated', null, null, 'Hand-entered facts with per-record citations.')
on conflict (id) do nothing;
