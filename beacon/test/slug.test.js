import { describe, it, expect } from "vitest";
import { slugify, validateSlug, slugFromName, RESERVED, SLUG_MAX } from "../src/lib/slug.js";

describe("slugify", () => {
  it("lowercases, strips accents, and hyphenates", () => {
    expect(slugify("Café Ünïcode Lounge!")).toBe("cafe-unicode-lounge");
  });
  it("collapses repeated separators and trims edges", () => {
    expect(slugify("  --Hello   World--  ")).toBe("hello-world");
  });
  it("caps at SLUG_MAX without a trailing hyphen", () => {
    const s = slugify("a".repeat(30) + " " + "b".repeat(10));
    expect(s.length).toBeLessThanOrEqual(SLUG_MAX);
    expect(s.endsWith("-")).toBe(false);
  });
});

describe("validateSlug", () => {
  it("accepts a normal slug", () => {
    expect(validateSlug("indie-devs-2").ok).toBe(true);
  });
  it("rejects too short / too long", () => {
    expect(validateSlug("ab").ok).toBe(false);
    expect(validateSlug("a".repeat(33)).ok).toBe(false);
  });
  it("rejects uppercase, spaces, leading/trailing or double hyphens", () => {
    for (const bad of ["Indie", "indie devs", "-indie", "indie-", "in--die"]) {
      expect(validateSlug(bad).ok, bad).toBe(false);
    }
  });
  it("rejects reserved words", () => {
    for (const r of ["servers", "health", "join", "admin"]) {
      expect(RESERVED.has(r)).toBe(true);
      expect(validateSlug(r).ok).toBe(false);
    }
  });
});

describe("slugFromName", () => {
  it("falls back to a server-id slug for unusable names", () => {
    expect(slugFromName("🔥🔥", "123456789012", () => false)).toBe("server-789012");
    expect(slugFromName("servers", "123456789012", () => false)).toBe("server-789012");
  });
  it("appends a counter when taken", () => {
    const taken = new Set(["cool-server", "cool-server-2"]);
    expect(slugFromName("Cool Server", "1", (s) => taken.has(s))).toBe("cool-server-3");
  });
  it("keeps the counter within the length cap", () => {
    const base = "x".repeat(32);
    const s = slugFromName(base, "1", (c) => c === base);
    expect(s.length).toBeLessThanOrEqual(SLUG_MAX);
    expect(s.endsWith("-2")).toBe(true);
  });
});
