import { describe, expect, it } from "vitest";
import { parseStatQuery } from "./queries";

describe("parseStatQuery", () => {
  it("parses an operator phrase: 'over 20 points'", () => {
    expect(parseStatQuery("over 20 points")).toEqual([{ metric: "pts", op: ">", value: 20 }]);
  });

  it("maps operator words and symbols", () => {
    expect(parseStatQuery("at least 5 assists")).toEqual([{ metric: "ast", op: ">=", value: 5 }]);
    expect(parseStatQuery("at most 2 turnovers")).toEqual([{ metric: "tov", op: "<=", value: 2 }]);
    expect(parseStatQuery("under 30 minutes")).toEqual([{ metric: "min", op: "<", value: 30 }]);
    expect(parseStatQuery(">= 10 rebounds")).toEqual([{ metric: "reb", op: ">=", value: 10 }]);
    expect(parseStatQuery("<= 1 blocks")).toEqual([{ metric: "blk", op: "<=", value: 1 }]);
  });

  it("parses decimals and is case-insensitive", () => {
    expect(parseStatQuery("More Than 2.5 Steals")).toEqual([{ metric: "stl", op: ">", value: 2.5 }]);
  });

  it("ignores stats it doesn't know", () => {
    expect(parseStatQuery("over 20 dunks")).toEqual([]);
    expect(parseStatQuery("JJ Redick")).toEqual([]);
  });

  // ---- bug: numbers without their own operator, and abbreviations (written before the fix)

  it("parses bare abbreviations as 'at least': '15 pts, 8 reb'", () => {
    expect(parseStatQuery("15 pts, 8 reb")).toEqual([
      { metric: "pts", op: ">=", value: 15 },
      { metric: "reb", op: ">=", value: 8 },
    ]);
  });

  it("keeps the second stat after 'and': 'at least 15 points and 8 rebounds'", () => {
    expect(parseStatQuery("at least 15 points and 8 rebounds")).toEqual([
      { metric: "pts", op: ">=", value: 15 },
      { metric: "reb", op: ">=", value: 8 },
    ]);
  });

  it("doesn't carry an operator to the next number: 'over 20 points and 5 rebounds'", () => {
    expect(parseStatQuery("over 20 points and 5 rebounds")).toEqual([
      { metric: "pts", op: ">", value: 20 },
      { metric: "reb", op: ">=", value: 5 },
    ]);
  });

  it("mixed case: 'under 3 turnovers and 15 points' → tov < 3, pts ≥ 15", () => {
    expect(parseStatQuery("under 3 turnovers and 15 points")).toEqual([
      { metric: "tov", op: "<", value: 3 },
      { metric: "pts", op: ">=", value: 15 },
    ]);
  });

  it("applies each explicit operator to its own number", () => {
    expect(parseStatQuery("under 3 turnovers and at most 25 minutes")).toEqual([
      { metric: "tov", op: "<", value: 3 },
      { metric: "min", op: "<=", value: 25 },
    ]);
  });

  it("doesn't read three-point phrases as points ≥ 3", () => {
    expect(parseStatQuery("3 pointers")).toEqual([]);
    expect(parseStatQuery("3-point shooters")).toEqual([]);
    expect(parseStatQuery("3-pointers")).toEqual([]);
    expect(parseStatQuery("3 point shooting")).toEqual([]);
    expect(parseStatQuery("made 3 pointers and 15 points")).toEqual([{ metric: "pts", op: ">=", value: 15 }]);
  });

  it("still parses 'point(s)' when the meaning is clear", () => {
    expect(parseStatQuery("over 3 points")).toEqual([{ metric: "pts", op: ">", value: 3 }]);
    expect(parseStatQuery("3 points")).toEqual([{ metric: "pts", op: ">=", value: 3 }]);
  });

  it("knows every abbreviation", () => {
    expect(parseStatQuery("1 pts 2 reb 3 ast 4 stl 5 blk 6 tov 7 min").map((f) => f.metric)).toEqual([
      "pts", "reb", "ast", "stl", "blk", "tov", "min",
    ]);
  });

  it("doesn't treat a year or a bare number as a stat", () => {
    expect(parseStatQuery("2015 champions")).toEqual([]);
    expect(parseStatQuery("15")).toEqual([]);
  });
});
