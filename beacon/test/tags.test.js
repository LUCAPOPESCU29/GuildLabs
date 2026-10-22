import { describe, it, expect } from "vitest";
import { TAGS, validateTags, suggestTags, tagLabel, MAX_TAGS } from "../src/lib/tags.js";

describe("taxonomy", () => {
  it("has 30 unique lowercase tags", () => {
    expect(TAGS).toHaveLength(30);
    expect(new Set(TAGS).size).toBe(30);
    for (const t of TAGS) expect(t).toBe(t.toLowerCase());
  });
  it("labels special cases", () => {
    expect(tagLabel("lgbtq")).toBe("LGBTQ+");
    expect(tagLabel("language-learning")).toBe("Language learning");
    expect(tagLabel("gaming")).toBe("Gaming");
  });
});

describe("validateTags", () => {
  it("normalises, dedupes, and accepts valid lists", () => {
    const r = validateTags([" Gaming", "gaming", "ART"]);
    expect(r).toEqual({ ok: true, tags: ["gaming", "art"] });
  });
  it("rejects unknown tags", () => {
    expect(validateTags(["gaming", "nope"]).ok).toBe(false);
  });
  it("enforces 1..MAX_TAGS", () => {
    expect(validateTags([]).ok).toBe(false);
    expect(validateTags(TAGS.slice(0, MAX_TAGS + 1)).ok).toBe(false);
    expect(validateTags(TAGS.slice(0, MAX_TAGS)).ok).toBe(true);
  });
});

describe("suggestTags", () => {
  it("suggests from name, channels, and description", () => {
    const tags = suggestTags({
      name: "Valorant Scrims EU",
      description: "Competitive ranked grind, tournaments every weekend",
      channels: ["lfg", "scrim-results", "clips"],
    });
    expect(tags.slice(0, 2)).toContain("valorant");
    expect(tags.slice(0, 2)).toContain("esports");
    expect(tags).toContain("gaming");
    expect(tags.length).toBeLessThanOrEqual(MAX_TAGS);
  });
  it("matches multi-word hints", () => {
    expect(suggestTags({ description: "a place to learn english together" })).toContain("language-learning");
  });
  it("returns nothing for unrelated text", () => {
    expect(suggestTags({ name: "qwerty", description: "zxcvb" })).toEqual([]);
  });
});
