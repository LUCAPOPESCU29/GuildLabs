import { describe, it, expect } from "vitest";
import { fallbackBlueprint, fallbackClarify } from "@/lib/construct-fallback";
import { enforceCounts, CAPS, type AiAnswer } from "@/lib/construct-ai";
import { validateBlueprint } from "@/lib/blueprint-validate";

const NO_ANSWERS: AiAnswer[] = [];

function channelNames(bp: ReturnType<typeof fallbackBlueprint>): string[] {
  return bp.categories.flatMap((c) => c.channels.map((ch) => ch.name));
}

describe("fallbackBlueprint — archetype detection", () => {
  it("detects gaming and adds gaming channels + role pack", () => {
    const bp = fallbackBlueprint("A server for my Valorant esports squad", NO_ANSWERS);
    expect(channelNames(bp)).toContain("lfg");
    expect(channelNames(bp)).toContain("clips");
    expect(bp.roles.map((r) => r.name)).toContain("Gamer");
  });

  it("detects school and adds study channels + Teacher/Student roles", () => {
    const bp = fallbackBlueprint(
      "A study server for my university class to share homework",
      NO_ANSWERS
    );
    expect(channelNames(bp)).toContain("homework-help");
    const roleNames = bp.roles.map((r) => r.name);
    expect(roleNames).toContain("Teacher");
    expect(roleNames).toContain("Student");
  });

  it("detects crypto and adds market channels + disclaimers", () => {
    const bp = fallbackBlueprint("A crypto trading community for NFT degens", NO_ANSWERS);
    expect(channelNames(bp)).toContain("market-chat");
    expect(channelNames(bp)).toContain("disclaimers");
  });

  it("falls back to community when nothing matches", () => {
    const bp = fallbackBlueprint("just somewhere for us to be", NO_ANSWERS);
    expect(channelNames(bp)).toContain("introductions");
    expect(bp.summary).toContain("Community");
  });

  it("uses clarifying answers as part of the keyword corpus", () => {
    const bp = fallbackBlueprint("a place for people", [
      { question: "What's it about?", answer: "mostly coding and programming" },
    ]);
    expect(channelNames(bp)).toContain("dev-talk");
  });
});

describe("fallbackBlueprint — moderation, name and features", () => {
  it("detects strict moderation", () => {
    const bp = fallbackBlueprint(
      "A professional brand community, must be strict and safe",
      NO_ANSWERS
    );
    expect(bp.permissions.join(" ")).toContain("verification gate");
  });

  it("detects casual moderation", () => {
    const bp = fallbackBlueprint("a chill hangout for friends", NO_ANSWERS);
    expect(bp.permissions.join(" ")).toContain("Open access");
  });

  it("defaults to balanced moderation", () => {
    const bp = fallbackBlueprint("somewhere to discuss things together", NO_ANSWERS);
    expect(bp.summary).toContain("balanced");
  });

  it("picks up a quoted server name", () => {
    const bp = fallbackBlueprint('A gaming server named "Pixel Lounge" for fun', NO_ANSWERS);
    expect(bp.name).toBe("Pixel Lounge");
  });

  it('picks up a "called X" server name', () => {
    const bp = fallbackBlueprint("A late-night community called Nightowls", NO_ANSWERS);
    expect(bp.name).toBe("Nightowls");
  });

  it("defaults the name when none is given", () => {
    const bp = fallbackBlueprint("a community for plant lovers", NO_ANSWERS);
    expect(bp.name).toBe("My Server");
  });

  it("adds EVENTS when events are mentioned", () => {
    const bp = fallbackBlueprint("a community that runs a monthly tournament", NO_ANSWERS);
    expect(bp.categories.map((c) => c.name)).toContain("EVENTS");
  });

  it("adds SUPPORT for ticket/support keywords", () => {
    const bp = fallbackBlueprint("a community with a support ticket system", NO_ANSWERS);
    expect(bp.categories.map((c) => c.name)).toContain("SUPPORT");
  });

  it("adds STAFF channels when a staff team is mentioned", () => {
    const bp = fallbackBlueprint("a community with a dedicated mod team", NO_ANSWERS);
    expect(bp.categories.map((c) => c.name)).toContain("STAFF");
  });

  it("adds leveling extras for xp keywords", () => {
    const bp = fallbackBlueprint("a community with xp ranks and levels", NO_ANSWERS);
    expect(bp.roles.map((r) => r.name)).toContain("Level 10+");
  });
});

describe("fallbackBlueprint — output validity", () => {
  const prompts = [
    "A Valorant esports squad server",
    "study group for college finals",
    "crypto trading and defi alpha",
    "music producers sharing songs",
    "tech startup engineering team",
    "artists posting their drawings",
    "anything at all really",
  ];

  it.each(prompts)("output for %j passes validateBlueprint", (p) => {
    const bp = fallbackBlueprint(p, NO_ANSWERS);
    // validateBlueprint takes the raw model shape (perms as preset keys), but it
    // tolerates full perm strings by mapping unknowns → member; the key
    // guarantee here is structural: it never throws and stats stay consistent.
    expect(bp.categories.length).toBeGreaterThan(0);
    expect(bp.roles.length).toBeGreaterThan(0);
    expect(bp.stats.categories).toBe(bp.categories.length);
    expect(bp.stats.channels).toBe(
      bp.categories.reduce((n, c) => n + c.channels.length, 0)
    );
    expect(bp.stats.roles).toBe(bp.roles.length);
    expect(() => validateBlueprint(bp)).not.toThrow();
  });

  it("never emits duplicate channel keys within a category", () => {
    const bp = fallbackBlueprint("gaming community with games and gamers", NO_ANSWERS);
    for (const cat of bp.categories) {
      const keys = cat.channels.map((c) => `${c.type}:${c.name.toLowerCase()}`);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });
});

describe("enforceCounts — honoring requested counts (route applies this to fallback output)", () => {
  it("pads channels up to an explicitly requested minimum", () => {
    const desc = "a gaming server with at least 25 channels";
    const bp = enforceCounts(fallbackBlueprint(desc, NO_ANSWERS), desc);
    expect(bp.stats.channels).toBeGreaterThanOrEqual(25);
    expect(bp.stats.channels).toBe(
      bp.categories.reduce((n, c) => n + c.channels.length, 0)
    );
  });

  it("pads roles up to an explicitly requested minimum without duplicates", () => {
    const desc = "a community with 13 roles";
    const bp = enforceCounts(fallbackBlueprint(desc, NO_ANSWERS), desc);
    expect(bp.roles.length).toBeGreaterThanOrEqual(13);
    const names = bp.roles.map((r) => r.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });

  it("caps requested role counts at CAPS.roles", () => {
    const desc = "a community with 500 roles";
    const bp = enforceCounts(fallbackBlueprint(desc, NO_ANSWERS), desc);
    expect(bp.roles.length).toBeLessThanOrEqual(CAPS.roles);
  });

  it("caps requested channel counts at 60", () => {
    const desc = "a server with 9999 channels";
    const bp = enforceCounts(fallbackBlueprint(desc, NO_ANSWERS), desc);
    expect(bp.stats.channels).toBeLessThanOrEqual(60);
  });

  it("leaves the blueprint alone when no counts are requested", () => {
    const desc = "a cozy community for friends";
    const base = fallbackBlueprint(desc, NO_ANSWERS);
    const bp = enforceCounts(base, desc);
    expect(bp.stats).toEqual(base.stats);
  });
});

describe("fallbackClarify", () => {
  it("asks one round of questions for a fresh description", () => {
    const res = fallbackClarify("a community for hikers", NO_ANSWERS);
    expect(res.done).toBe(false);
    if (!res.done) {
      expect(res.questions).toHaveLength(3);
      expect(res.questions.map((q) => q.id)).toEqual(["size", "vibe", "moderation"]);
    }
  });

  it("swaps the vibe question for a gating question on crypto servers", () => {
    const res = fallbackClarify("a defi trading alpha group", NO_ANSWERS);
    expect(res.done).toBe(false);
    if (!res.done) {
      expect(res.questions.map((q) => q.id)).toEqual(["size", "gating", "moderation"]);
    }
  });

  it("is done after any answers exist (single round only)", () => {
    const res = fallbackClarify("a community", [
      { question: "How large?", answer: "100" },
    ]);
    expect(res).toEqual({ done: true });
  });
});
