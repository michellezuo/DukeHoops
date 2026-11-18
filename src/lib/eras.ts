/**
 * NCAA men's basketball rule changes that affect cross-era stat comparisons.
 * Curated; each entry cites the NCAA rule change it refers to.
 */
export interface RuleChange {
  season: number; // first season (end year) the rule applied
  text: string;
}

export const RULE_CHANGES: RuleChange[] = [
  { season: 2009, text: "3-point line moved back from 19'9\" to 20'9\" (2008-09), lowering 3P% league-wide." },
  { season: 2016, text: "Shot clock shortened from 35 to 30 seconds (2015-16), increasing pace and possessions per game." },
  { season: 2020, text: "3-point line moved to the international distance of 22'1¾\" (2019-20)." },
  { season: 2021, text: "COVID-19 season (2020-21): shortened schedules; NCAA granted an extra year of eligibility." },
];

/** Rule changes that fall between the earliest and latest season being compared. */
export function relevantRuleChanges(seasons: number[]): RuleChange[] {
  if (seasons.length === 0) return [];
  const lo = Math.min(...seasons);
  const hi = Math.max(...seasons);
  return RULE_CHANGES.filter((r) => r.season > lo && r.season <= hi);
}
