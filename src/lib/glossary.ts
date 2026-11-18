/**
 * Abbreviations used across the site, written out in full.
 * `<Gloss>` looks terms up here to show a hover/focus tooltip.
 * Keys are matched case-sensitively after stripping a trailing "*".
 */
export const GLOSSARY: Record<string, string> = {
  // Box-score stats
  GP: "Games played",
  GS: "Games started",
  MIN: "Minutes played",
  PTS: "Points",
  REB: "Rebounds",
  OREB: "Offensive rebounds",
  DREB: "Defensive rebounds",
  AST: "Assists",
  STL: "Steals",
  BLK: "Blocks",
  TOV: "Turnovers",
  TO: "Turnovers",
  PF: "Personal fouls",
  FG: "Field goals (made-attempted)",
  "3PT": "3-point field goals (made-attempted)",
  FT: "Free throws (made-attempted)",
  "FGM-A": "Field goals made-attempted",
  "3PM-A": "3-pointers made-attempted",
  "FTM-A": "Free throws made-attempted",
  PPG: "Points per game",
  RPG: "Rebounds per game",
  APG: "Assists per game",
  SPG: "Steals per game",
  BPG: "Blocks per game",
  "FG%": "Field goal percentage: shots made ÷ shots attempted",
  "3P%": "3-point percentage: 3-pointers made ÷ 3-pointers attempted",
  "FT%": "Free throw percentage: free throws made ÷ attempted",
  "TS%": "True shooting %: scoring efficiency counting 2s, 3s and free throws. PTS ÷ (2 × (FGA + 0.44 × FTA))",
  "eFG%": "Effective field goal %: FG% that gives 3-pointers 1.5× credit. (FGM + 0.5 × 3PM) ÷ FGA",
  "AST/TO": "Assist-to-turnover ratio: assists ÷ turnovers",
  FTr: "Free throw rate: free throw attempts ÷ field goal attempts",
  "3PAr": "3-point attempt rate: share of shots taken from 3",
  "Dbl-dbl": "Double-double: 10+ in two stat categories in one game",

  // Positions
  G: "Guard",
  F: "Forward",
  C: "Center",
  PG: "Point guard",
  SG: "Shooting guard",
  SF: "Small forward",

  // Results & schedule
  W: "Win",
  L: "Loss",
  OT: "Overtime",
  "@": "Away game",
  "vs.": "Home or neutral-site game",
  ET: "Eastern Time",
  TBD: "To be determined",

  // Organizations, awards, people
  ACC: "Atlantic Coast Conference: Duke's conference since its founding in 1953",
  NCAA: "National Collegiate Athletic Association",
  AP: "Associated Press: its weekly Top 25 media poll is the standard ranking",
  NBA: "National Basketball Association",
  WNBA: "Women's National Basketball Association",
  NPOY: "National Player of the Year",
  MOP: "Most Outstanding Player (of the Final Four)",
  NIL: "Name, Image & Likeness: athletes' endorsement and sponsorship deals",
  MBB: "Men's basketball",
  GM: "General manager",
  "Coach K": "Mike Krzyzewski, Duke head coach 1980–2022",
  UNC: "University of North Carolina at Chapel Hill, Duke's archrival",

  // Tenting
  "K-Ville": "Krzyzewskiville: the tent city outside Cameron Indoor Stadium",
  LM: "Line Monitor: student volunteers who run K-Ville, write the tests and do tent checks",
  LMs: "Line Monitors: student volunteers who run K-Ville, write the tests and do tent checks",
  DCS: "Duke Community Standard: the honor code you sign on the test",
  NetID: "Your Duke login ID",
};

export function lookup(term: string): string | undefined {
  return GLOSSARY[term] ?? GLOSSARY[term.replace(/\*+$/, "")];
}
