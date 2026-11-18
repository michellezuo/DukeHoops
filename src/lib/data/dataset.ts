import { promises as fs } from "fs";
import path from "path";
import type {
  Championship,
  Coach,
  Dataset,
  DatasetMeta,
  Game,
  Player,
  PlayerGameStats,
  PlayerSeasonStats,
  RosterEntry,
  Season,
} from "@/lib/types";
import { loadFromSupabase, supabaseConfigured } from "./supabase-source";

/**
 * Dataset loader. The app reads the whole (small) Duke dataset into memory and
 * answers queries from it. Two interchangeable backends:
 *   - Supabase (when NEXT_PUBLIC_SUPABASE_URL + key are set)
 *   - data/generated/*.json written by the Python ingestion pipeline (default)
 * The dataset is ~1MB today; when it grows past what's sensible to hold in
 * memory, swap the query layer (queries.ts) to SQL — its function signatures
 * are the public contract, not this file.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const TTL_MS = 10 * 60 * 1000;

let cache: { at: number; promise: Promise<Dataset> } | null = null;

async function readJson<T>(rel: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, rel), "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function loadCurated(): Promise<{ championships: Championship[]; coaches: Coach[] }> {
  const [c, k] = await Promise.all([
    readJson<{ championships: Championship[] }>("curated/championships.json", { championships: [] }),
    readJson<{ coaches: Coach[] }>("curated/coaches.json", { coaches: [] }),
  ]);
  return { championships: c.championships, coaches: k.coaches };
}

async function loadFromJson(): Promise<Dataset> {
  const emptyMeta: DatasetMeta = { generatedAt: "", seasonRange: [null, null], counts: {}, errors: [], sources: [] };
  const [players, rosters, seasons, games, seasonStats, gameStats, meta, curated] = await Promise.all([
    readJson<Player[]>("generated/players.json", []),
    readJson<RosterEntry[]>("generated/rosters.json", []),
    readJson<Season[]>("generated/seasons.json", []),
    readJson<Game[]>("generated/games.json", []),
    readJson<PlayerSeasonStats[]>("generated/player_season_stats.json", []),
    readJson<PlayerGameStats[]>("generated/player_game_stats.json", []),
    readJson<DatasetMeta>("generated/meta.json", emptyMeta),
    loadCurated(),
  ]);
  return { players, rosters, seasons, games, seasonStats, gameStats, meta, ...curated, backend: "json" };
}

/** Fill gaps in source data from curated records, flagging that we did so. */
function applyCuratedFallbacks(ds: Dataset): Dataset {
  const seasons = ds.seasons.map((s) => {
    if (s.coach) return s;
    const c = ds.coaches.find((k) => s.season >= k.firstSeason && (k.lastSeason === null || s.season <= k.lastSeason));
    return c ? { ...s, coach: c.fullName, coachIsCurated: true } : s;
  });
  return { ...ds, seasons };
}

export function getDataset(): Promise<Dataset> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.promise;
  const promise = (async () => {
    if (supabaseConfigured()) {
      try {
        const curated = await loadCurated();
        return applyCuratedFallbacks({ ...(await loadFromSupabase()), ...curated });
      } catch (err) {
        console.error("[dataset] Supabase load failed, falling back to local JSON:", err);
      }
    }
    return applyCuratedFallbacks(await loadFromJson());
  })();
  cache = { at: Date.now(), promise };
  promise.catch(() => (cache = null));
  return promise;
}
