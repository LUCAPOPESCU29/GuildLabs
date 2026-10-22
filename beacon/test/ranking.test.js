import { describe, it, expect } from "vitest";
import { scoreGuild, rankEntries, GROWTH_CAP } from "../src/lib/ranking.js";

describe("scoreGuild", () => {
  it("is 0 for an empty server and 1 at every cap", () => {
    expect(scoreGuild({})).toBe(0);
    const max = scoreGuild({ members: 100, online: 100, growth7d: GROWTH_CAP, eventsUpcoming: 3, views7d: 1000 });
    expect(max).toBeCloseTo(1, 6);
  });
  it("clamps every term", () => {
    const over = scoreGuild({ members: 10, online: 50, growth7d: 9999, eventsUpcoming: 40, views7d: 1e9 });
    expect(over).toBeCloseTo(1, 6);
    const negative = scoreGuild({ members: 100, online: 0, growth7d: -500 });
    expect(negative).toBe(0);
  });
  it("prefers an active small server over a dead big one", () => {
    const small = scoreGuild({ members: 80, online: 30 });
    const big = scoreGuild({ members: 50_000, online: 400 });
    expect(small).toBeGreaterThan(big);
  });
  it("weights online ratio the most", () => {
    const online = scoreGuild({ members: 100, online: 100 });
    const growing = scoreGuild({ members: 100, online: 0, growth7d: GROWTH_CAP });
    expect(online).toBeGreaterThan(growing);
  });
});

describe("rankEntries", () => {
  const entries = [
    { name: "b", featured: false, score: 0.9, members: 10 },
    { name: "a", featured: false, score: 0.9, members: 10 },
    { name: "z", featured: true, score: 0.1, members: 1 },
    { name: "c", featured: false, score: 0.9, members: 50 },
  ];
  it("puts featured first, then score, then size, then name", () => {
    expect(rankEntries(entries).map((e) => e.name)).toEqual(["z", "c", "a", "b"]);
  });
  it("does not mutate the input", () => {
    const copy = [...entries];
    rankEntries(entries);
    expect(entries).toEqual(copy);
  });
});
