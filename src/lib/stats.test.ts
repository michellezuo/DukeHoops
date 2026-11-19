import { describe, expect, it } from "vitest";
import { careerLine, effectiveFg, trueShooting } from "./stats";
import type { PlayerSeasonStats, Totals } from "./types";

const totals = (t: Partial<Totals> = {}): Totals => ({
  fgm: 200, fga: 400, tpm: 50, tpa: 120, ftm: 150, fta: 200, oreb: 30, dreb: 120, reb: 150,
  ast: 90, stl: 30, blk: 10, tov: 60, pf: 50, pts: 600, ...t,
});

function season(year: number, over: { gamesPlayed?: number | null; min?: number | null; totals?: Partial<Totals> } = {}): PlayerSeasonStats {
  const gp = over.gamesPlayed === undefined ? 30 : over.gamesPlayed;
  return {
    playerId: "test-player",
    season: year,
    gamesPlayed: gp,
    gamesStarted: gp,
    perGame: { min: over.min === undefined ? 30 : over.min, pts: null, reb: null, oreb: null, dreb: null, ast: null, stl: null, blk: null, tov: null, pf: null },
    totals: totals(over.totals),
    shooting: { fgPct: null, tpPct: null, ftPct: null },
    source: { name: "test", url: "", retrievedAt: "" },
  };
}

const A = season(2005);
const B = season(2006, {
  gamesPlayed: 35, min: 32,
  totals: { fgm: 250, fga: 480, tpm: 70, tpa: 180, ftm: 140, fta: 170, oreb: 40, dreb: 135, reb: 175, ast: 100, stl: 40, blk: 15, tov: 70, pf: 60, pts: 710 },
});

describe("careerLine", () => {
  it("sums totals and derives per-game and shooting from them", () => {
    const c = careerLine([A, B]);
    expect(c.seasons).toBe(2);
    expect(c.gamesPlayed).toBe(65);
    expect(c.gamesStarted).toBe(65);
    expect(c.totals.pts).toBe(1310);
    expect(c.totals.reb).toBe(325);
    expect(c.perGame.pts).toBeCloseTo(1310 / 65, 10); // 20.15
    expect(c.perGame.min).toBeCloseTo((30 * 30 + 32 * 35) / 65, 10); // minutes weighted by games
    expect(c.shooting.fgPct).toBeCloseTo(450 / 880, 10);
    expect(c.shooting.tpPct).toBeCloseTo(120 / 300, 10);
  });

  it("makes a career total null if any season is missing that stat, and leaves other stats alone", () => {
    const c = careerLine([A, season(2006, { totals: { tov: null } })]);
    expect(c.totals.tov).toBeNull();
    expect(c.perGame.tov).toBeNull();
    expect(c.totals.pts).toBe(1200); // other stats still sum
    expect(c.perGame.pts).toBe(20);
  });

  it("makes shooting % null when one season is missing makes or attempts", () => {
    const c = careerLine([A, season(2006, { totals: { fga: null } })]);
    expect(c.totals.fga).toBeNull();
    expect(c.shooting.fgPct).toBeNull();
    expect(c.shooting.ftPct).toBeCloseTo(300 / 400, 10);
  });

  it("makes per-game values null when games played is missing for any season", () => {
    const c = careerLine([A, season(2006, { gamesPlayed: null })]);
    expect(c.gamesPlayed).toBeNull();
    expect(c.perGame.pts).toBeNull();
    expect(c.perGame.min).toBeNull();
    expect(c.totals.pts).toBe(1200); // totals don't depend on games played
  });

  it("keeps a real 0 as 0, not null", () => {
    const c = careerLine([season(2005, { totals: { blk: 0 } }), season(2006, { totals: { blk: 0 } })]);
    expect(c.totals.blk).toBe(0);
    expect(c.perGame.blk).toBe(0);
  });

  it("returns null per-game values when total games played is 0 (no divide by zero)", () => {
    const c = careerLine([season(2005, { gamesPlayed: 0 })]);
    expect(c.gamesPlayed).toBe(0);
    expect(c.perGame.pts).toBeNull();
  });

  it("returns nulls, never zeros, for an empty career", () => {
    const c = careerLine([]);
    expect(c.seasons).toBe(0);
    expect(c.gamesPlayed).toBeNull();
    expect(c.totals.pts).toBeNull();
    expect(c.perGame.pts).toBeNull();
    expect(c.shooting.fgPct).toBeNull();
  });
});

describe("trueShooting", () => {
  it("is PTS / (2 × (FGA + 0.44 × FTA))", () => {
    expect(trueShooting(totals())).toBeCloseTo(600 / (2 * (400 + 0.44 * 200)), 10); // 0.6148
  });

  it("returns null when any input is missing", () => {
    expect(trueShooting(totals({ pts: null }))).toBeNull();
    expect(trueShooting(totals({ fga: null }))).toBeNull();
    expect(trueShooting(totals({ fta: null }))).toBeNull();
  });

  it("returns null, not NaN or Infinity, when there are no attempts", () => {
    expect(trueShooting(totals({ pts: 0, fga: 0, fta: 0 }))).toBeNull();
  });

  it("returns 0 (not null) for attempts with no points", () => {
    expect(trueShooting(totals({ pts: 0, fga: 10, fta: 0 }))).toBe(0);
  });
});

describe("effectiveFg", () => {
  it("is (FGM + 0.5 × 3PM) / FGA", () => {
    expect(effectiveFg(totals())).toBeCloseTo((200 + 0.5 * 50) / 400, 10); // 0.5625
  });

  it("returns null when any input is missing", () => {
    expect(effectiveFg(totals({ fgm: null }))).toBeNull();
    expect(effectiveFg(totals({ tpm: null }))).toBeNull();
    expect(effectiveFg(totals({ fga: null }))).toBeNull();
  });

  it("returns null, not NaN or Infinity, when FGA is 0", () => {
    expect(effectiveFg(totals({ fgm: 0, tpm: 0, fga: 0 }))).toBeNull();
  });
});
