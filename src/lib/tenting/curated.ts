import type { QuizQuestion } from "./types";

/**
 * Hand-written questions modeled on "staple" questions that come back on the K-Ville tests every year
 * (see the 2024 Black Tenting Test and 2025 Black Tenting Entry Test). Answers marked from the 2024 test's
 * own answer key are cited to it. Re-verify anything that can change (records, draft picks) each season.
 */

const TEST_2024 = { label: "2024 Black Tenting Test answer key", href: "https://s3.amazonaws.com/snwceomedia/dtc/892f9663-08b3-4170-87a7-1816f5896874.original.pdf" };
const NCAA = { label: "NCAA championship history", href: "https://www.ncaa.com/history/basketball-men/d1" };
const GODUKE = { label: "GoDuke.com men's basketball", href: "https://goduke.com/sports/mens-basketball" };
const WIKI_CAMERON = { label: "Cameron Indoor Stadium (Wikipedia)", href: "https://en.wikipedia.org/wiki/Cameron_Indoor_Stadium" };
const WIKI_K = { label: "Mike Krzyzewski (Wikipedia)", href: "https://en.wikipedia.org/wiki/Mike_Krzyzewski" };
const WIKI_RIVALRY = { label: "Carolina–Duke rivalry (Wikipedia)", href: "https://en.wikipedia.org/wiki/Carolina%E2%80%93Duke_rivalry" };
const WIKI_DUKE = { label: "Duke Blue Devils men's basketball (Wikipedia)", href: "https://en.wikipedia.org/wiki/Duke_Blue_Devils_men%27s_basketball" };

export const CURATED_QUESTIONS: QuizQuestion[] = [
  // ---------------------------------------------------------------- Awards & records
  {
    id: "career-points", category: "Awards & records", points: 2,
    prompt: "Who is Duke's all-time career scoring leader, and how many points did he score?",
    answer: "JJ Redick: 2,769 points",
    explanation: "Career leaders in the five main stats are a yearly staple. Learn the name and the number for each.",
    source: TEST_2024,
  },
  {
    id: "career-assists", category: "Awards & records", points: 2,
    prompt: "Who is Duke's all-time career assists leader, and how many assists?",
    answer: "Bobby Hurley: 1,076 assists",
    explanation: "Hurley's 1,076 is also the NCAA Division I career record.",
    source: TEST_2024,
  },
  {
    id: "career-rebounds", category: "Awards & records", points: 2,
    prompt: "Who is Duke's all-time career rebounding leader, and how many rebounds?",
    answer: "Shelden Williams: 1,262 rebounds",
    source: TEST_2024,
  },
  {
    id: "career-steals", category: "Awards & records", points: 2,
    prompt: "Who is Duke's all-time career steals leader, and how many steals?",
    answer: "Chris Duhon: 301 steals",
    source: TEST_2024,
  },
  {
    id: "career-blocks", category: "Awards & records", points: 2,
    prompt: "Who is Duke's all-time career blocks leader, and how many blocks?",
    answer: "Shelden Williams: 422 blocks",
    explanation: "Shelden Williams leads in both rebounds and blocks. He was nicknamed \"The Landlord.\"",
    source: TEST_2024,
  },
  {
    id: "naismith-list", category: "Awards & records", points: 9,
    prompt: "Name Duke's Naismith National Player of the Year winners and the year each one won.",
    answer: "Johnny Dawkins 1986 · Danny Ferry 1989 · Christian Laettner 1992 · Elton Brand 1999 · Shane Battier 2001 · Jason Williams 2002 · JJ Redick 2006 · Zion Williamson 2019 · Cooper Flagg 2025",
    explanation: "The 2024 test listed eight winners. Cooper Flagg became the ninth in 2025. The test also asked each winner's class year: Brand was a sophomore, Williams a junior, Zion and Flagg freshmen, and the rest seniors.",
    source: TEST_2024,
  },
  {
    id: "naismith-freshmen", category: "Awards & records", points: 2,
    prompt: "Which two Duke Naismith Player of the Year winners won it as freshmen?",
    choices: ["Zion Williamson & Cooper Flagg", "Jason Williams & Elton Brand", "Zion Williamson & Jayson Tatum", "Cooper Flagg & Paolo Banchero"],
    answer: "Zion Williamson & Cooper Flagg",
    source: TEST_2024,
  },
  {
    id: "no1-picks", category: "Awards & records", points: 6,
    prompt: "Duke holds the record for most No. 1 overall NBA draft picks. Name them.",
    answer: "Art Heyman (1963), Elton Brand (1999), Kyrie Irving (2011), Zion Williamson (2019), Paolo Banchero (2022), Cooper Flagg (2025)",
    explanation: "Six No. 1 picks. Recent tests ask for the number and each name.",
    source: { label: "NBA draft No. 1 picks (Wikipedia)", href: "https://en.wikipedia.org/wiki/List_of_first_overall_NBA_draft_picks" },
  },
  {
    id: "flagg-team", category: "Awards & records", points: 1,
    prompt: "Which NBA team drafted Cooper Flagg No. 1 overall in 2025?",
    choices: ["Dallas Mavericks", "San Antonio Spurs", "Philadelphia 76ers", "Charlotte Hornets"],
    answer: "Dallas Mavericks",
    source: { label: "2025 NBA draft (Wikipedia)", href: "https://en.wikipedia.org/wiki/2025_NBA_draft" },
  },
  {
    id: "titles-years", category: "Awards & records", points: 5,
    prompt: "List the years Duke won the national championship.",
    answer: "1991, 1992, 2001, 2010, 2015",
    source: NCAA,
  },
  {
    id: "title-1991", category: "Awards & records", points: 3,
    prompt: "1991 national title: opponent, final score, and Most Outstanding Player (MOP)?",
    answer: "Kansas, 72-65 · MOP: Christian Laettner",
    explanation: "Played in Indianapolis. Two days earlier Duke had upset undefeated UNLV in the national semifinal.",
    source: TEST_2024,
  },
  {
    id: "title-1992", category: "Awards & records", points: 3,
    prompt: "1992 national title: opponent, final score, and Most Outstanding Player (MOP)?",
    answer: "Michigan (the \"Fab Five\"), 71-51 · MOP: Bobby Hurley",
    explanation: "Played in Minneapolis. Duke became the first team to repeat as champion since UCLA in 1973.",
    source: TEST_2024,
  },
  {
    id: "title-2001", category: "Awards & records", points: 3,
    prompt: "2001 national title: opponent, final score, and Most Outstanding Player (MOP)?",
    answer: "Arizona, 82-72 · MOP: Shane Battier",
    explanation: "Played in Minneapolis.",
    source: TEST_2024,
  },
  {
    id: "title-2010", category: "Awards & records", points: 3,
    prompt: "2010 national title: opponent, final score, and Most Outstanding Player (MOP)?",
    answer: "Butler, 61-59 · MOP: Kyle Singler",
    explanation: "Played in Indianapolis. Gordon Hayward's half-court heave at the buzzer just missed. Current head coach Jon Scheyer started in this game.",
    source: TEST_2024,
  },
  {
    id: "title-2015", category: "Awards & records", points: 3,
    prompt: "2015 national title: opponent, final score, and Most Outstanding Player (MOP)?",
    answer: "Wisconsin, 68-63 · MOP: Tyus Jones",
    explanation: "Played in Indianapolis. Starters: Quinn Cook, Tyus Jones, Justise Winslow, Matt Jones, Jahlil Okafor.",
    source: TEST_2024,
  },
  {
    id: "title-2010-lineup", category: "Awards & records", points: 5,
    prompt: "Name the five starters in the 2010 national championship game.",
    answer: "Nolan Smith, Kyle Singler, Jon Scheyer, Lance Thomas, Brian Zoubek",
    source: TEST_2024,
  },
  {
    id: "final-four-2025", category: "Awards & records", points: 2,
    prompt: "Who knocked Duke out of the 2025 Final Four, and what was the score?",
    answer: "Houston, 70-67",
    explanation: "National semifinal in San Antonio, Cooper Flagg's only season at Duke.",
    source: NCAA,
  },

  // ---------------------------------------------------------------- History & traditions
  {
    id: "cameron-capacity", category: "History & traditions", points: 3,
    prompt: "What is Cameron Indoor Stadium's official seating capacity?",
    choices: ["9,314", "8,800", "10,500", "9,999"],
    answer: "9,314",
    explanation: "Shows up on almost every test.",
    source: WIKI_CAMERON,
  },
  {
    id: "cameron-opened", category: "History & traditions", points: 2,
    prompt: "What year did Cameron Indoor Stadium open, and where did Duke play before it?",
    answer: "1940; before that, Card Gymnasium",
    source: TEST_2024,
  },
  {
    id: "cameron-matchbook", category: "History & traditions", points: 3,
    prompt: "According to Duke lore, the first plans for Cameron were sketched on what object, and by whom?",
    answer: "A matchbook (matchbook cover), by Wallace Wade and Eddie Cameron",
    explanation: "The stadium was renamed for Eddie Cameron in 1972.",
    source: WIKI_CAMERON,
  },
  {
    id: "cameron-first-opp", category: "History & traditions", points: 1,
    prompt: "Who was Duke's first opponent in Cameron Indoor Stadium (January 1940)?",
    choices: ["Princeton", "North Carolina", "Wake Forest", "NC State"],
    answer: "Princeton",
    source: WIKI_CAMERON,
  },
  {
    id: "airball", category: "History & traditions", points: 4,
    prompt: "What now-famous chant was invented by the Cameron Crazies, and which opposing player was it first aimed at?",
    answer: "\"Air ball!\". It was first aimed at North Carolina's Rich Yonakor in 1979.",
    source: TEST_2024,
  },
  {
    id: "conference", category: "History & traditions", points: 2,
    prompt: "What was Duke's original athletic conference, and what year did Duke join the ACC?",
    answer: "The Southern Conference; Duke joined the ACC as a founding member in 1953",
    source: TEST_2024,
  },
  {
    id: "rivalry-1961", category: "History & traditions", points: 3,
    prompt: "What happened at the Duke vs. UNC game on Feb. 4, 1961, that many call a turning point in the rivalry?",
    answer: "A bench-clearing brawl that started between Duke's Art Heyman and UNC's Larry Brown",
    source: WIKI_RIVALRY,
  },
  {
    id: "the-shot", category: "History & traditions", points: 3,
    prompt: "\"The Shot\" (1992 East Regional final): who threw the full-court pass, who hit the shot, who was the opponent, and how much time was left?",
    answer: "Grant Hill to Christian Laettner, vs. Kentucky, 2.1 seconds left (Duke won 104-103 in overtime)",
    source: WIKI_DUKE,
  },
  {
    id: "zion-shoe", category: "History & traditions", points: 2,
    prompt: "In which game did Zion Williamson's shoe famously blow out 36 seconds in?",
    choices: ["vs. North Carolina, Feb. 2019", "vs. Virginia, Jan. 2019", "vs. Kentucky, Nov. 2018", "at Syracuse, Jan. 2019"],
    answer: "vs. North Carolina, Feb. 2019",
    source: WIKI_RIVALRY,
  },
  {
    id: "rivers-buzzer", category: "History & traditions", points: 2,
    prompt: "Who hit the buzzer-beating 3 to win at North Carolina in February 2012?",
    choices: ["Austin Rivers", "Seth Curry", "Andre Dawkins", "Ryan Kelly"],
    answer: "Austin Rivers",
    source: WIKI_RIVALRY,
  },
  {
    id: "kville-name", category: "History & traditions", points: 1,
    prompt: "K-Ville is short for what?",
    answer: "Krzyzewskiville, the tent city outside Cameron, named for Coach Mike Krzyzewski",
    source: { label: "Krzyzewskiville (Wikipedia)", href: "https://en.wikipedia.org/wiki/Krzyzewskiville" },
  },

  // ---------------------------------------------------------------- Coaches
  {
    id: "k-wins", category: "Coaches", points: 2,
    prompt: "How many career wins did Coach K finish with, the most in Division I men's history?",
    choices: ["1,202", "1,098", "1,129", "1,250"],
    answer: "1,202",
    explanation: "Across his time at Army and Duke. He retired after the 2021-22 season.",
    source: WIKI_K,
  },
  {
    id: "k-first-season", category: "Coaches", points: 1,
    prompt: "Before Duke, where was Coach K head coach?",
    choices: ["Army", "Indiana", "Navy", "Notre Dame"],
    answer: "Army",
    explanation: "He also played for Bob Knight at Army. He took the Duke job in 1980.",
    source: WIKI_K,
  },
  {
    id: "class-that-saved-k", category: "Coaches", points: 4,
    prompt: "The recruiting class that \"saved Coach K\" arrived in what year? Name at least two of its members.",
    answer: "1982: Johnny Dawkins, Mark Alarie, Jay Bilas, David Henderson",
    source: TEST_2024,
  },
  {
    id: "concerned-iron-dukes", category: "Coaches", points: 2,
    prompt: "When Coach K was in danger of being fired early on, a group of boosters formed to push for change. What was it called?",
    answer: "The Concerned Iron Dukes",
    source: TEST_2024,
  },
  {
    id: "scheyer-hs", category: "Coaches", points: 2,
    prompt: "What high school did Coach Jon Scheyer attend?",
    choices: ["Glenbrook North (Northbrook, Ill.)", "Oak Hill Academy (Va.)", "Simeon (Chicago)", "New Trier (Winnetka, Ill.)"],
    answer: "Glenbrook North (Northbrook, Ill.)",
    source: GODUKE,
  },
  {
    id: "scheyer-first-season", category: "Coaches", points: 2,
    prompt: "In which season did Jon Scheyer take over as Duke's head coach?",
    choices: ["2022-23", "2021-22", "2023-24", "2020-21"],
    answer: "2022-23",
    explanation: "He succeeded Coach K after K's farewell 2021-22 season. Tests usually ask how many years Scheyer has been head coach, counting the current season.",
    source: GODUKE,
  },

  // ---------------------------------------------------------------- The Brotherhood
  {
    id: "alaskan-assassin", category: "The Brotherhood", points: 2,
    prompt: "Who was \"The Alaskan Assassin\"?",
    choices: ["Trajan Langdon", "Steve Wojciechowski", "Chris Collins", "Jeff Capel"],
    answer: "Trajan Langdon",
    source: TEST_2024,
  },
  {
    id: "brothers", category: "The Brotherhood", points: 3,
    prompt: "Name at least three families with brothers who played for Duke men's basketball.",
    answer: "The Plumlees (Miles, Mason, Marshall), the Joneses (Tre, Tyus), and the Boozer twins (Cameron, Cayden)",
    explanation: "\"Name all biological brothers\" is a recurring question. Check current rosters for new ones.",
    source: TEST_2024,
  },
  {
    id: "kyrie-games", category: "The Brotherhood", points: 2,
    prompt: "Kyrie Irving's Duke career was cut short by a toe injury. How many games did he play?",
    choices: ["11", "7", "19", "24"],
    answer: "11",
    source: { label: "Kyrie Irving (Wikipedia)", href: "https://en.wikipedia.org/wiki/Kyrie_Irving" },
  },
];
