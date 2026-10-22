import { describe, it, expect, beforeEach } from "vitest";
import { openDatabase } from "../src/lib/db.js";
import { createStore, isSetupComplete, dayShift } from "../src/lib/store.js";

let store;
beforeEach(() => {
  store = createStore(openDatabase(":memory:"));
});

function seed(id = "100", extra = {}) {
  store.upsertDraft({ guildId: id, name: `Guild ${id}`, iconUrl: null });
  return store.updateGuild(id, {
    slug: `guild-${id}`,
    tagline: "A tagline",
    tags: ["gaming"],
    invite_code: "abc",
    invite_channel_id: "1",
    ...extra,
  });
}

describe("guild rows", () => {
  it("creates a draft once and refreshes it afterwards", () => {
    const first = store.upsertDraft({ guildId: "1", name: "One" });
    expect(first.created).toBe(true);
    const second = store.upsertDraft({ guildId: "1", name: "Renamed", iconUrl: "https://x/i.png" });
    expect(second.created).toBe(false);
    expect(second.row.name).toBe("Renamed");
    expect(second.row.icon_url).toBe("https://x/i.png");
  });

  it("parses tags and booleans", () => {
    const row = seed("7", { published: 1, featured: true });
    expect(row.tags).toEqual(["gaming"]);
    expect(row.published).toBe(true);
    expect(row.featured).toBe(true);
    expect(row.banned).toBe(false);
  });

  it("knows when setup is complete", () => {
    store.upsertDraft({ guildId: "2", name: "Two" });
    expect(isSetupComplete(store.getGuild("2"))).toBe(false);
    expect(isSetupComplete(seed("3"))).toBe(true);
  });

  it("enforces slug uniqueness and lookups", () => {
    seed("10");
    expect(store.isSlugTaken("guild-10")).toBe(true);
    expect(store.isSlugTaken("guild-10", "10")).toBe(false);
    expect(store.getBySlug("guild-10").guild_id).toBe("10");
    expect(store.getBySlug("nope")).toBeNull();
  });

  it("ignores unknown columns in updates", () => {
    seed("11");
    const row = store.updateGuild("11", { nonsense: 1, tagline: "New" });
    expect(row.tagline).toBe("New");
  });

  it("only lists published, unbanned, setup-complete guilds", () => {
    seed("20", { published: 1 });
    seed("21", { published: 1, banned: 1 });
    seed("22", { published: 0 });
    store.upsertDraft({ guildId: "23", name: "Draft" });
    store.updateGuild("23", { published: 1 });
    expect(store.listPublished().map((r) => r.guild_id)).toEqual(["20"]);
    expect(store.countPublished()).toBe(2); // raw count ignores setup completeness
  });

  it("soft-deletes, then purges after the retention window", () => {
    seed("30", { published: 1 });
    store.softDelete("30");
    expect(store.getGuild("30").published).toBe(false);
    expect(store.purgeDeleted(30)).toEqual([]);
    store.updateGuild("30", { deleted_at: new Date(Date.now() - 31 * 86_400_000).toISOString() });
    expect(store.purgeDeleted(30).map((r) => r.guild_id)).toEqual(["30"]);
    expect(store.getGuild("30")).toBeNull();
  });
});

describe("samples, hits, invite uses", () => {
  it("keeps the latest members and peak online within a day", () => {
    store.addSample("1", { day: "2026-01-01", members: 100, online: 40 });
    store.addSample("1", { day: "2026-01-01", members: 102, online: 10 });
    expect(store.latestSample("1")).toMatchObject({ members: 102, online: 40 });
  });

  it("computes growth from the sample on or before N days ago", () => {
    store.addSample("1", { day: dayShift(10), members: 50 });
    store.addSample("1", { day: dayShift(0), members: 80 });
    expect(store.growth("1", 7)).toBe(30);
    expect(store.growth("2", 7)).toBe(0);
  });

  it("sums views and clicks over a window", () => {
    store.recordView("1", dayShift(0));
    store.recordView("1", dayShift(0));
    store.recordClick("1", dayShift(3));
    store.recordView("1", dayShift(20));
    expect(store.getHits("1", 7)).toEqual({ views: 2, clicks: 1 });
    expect(store.getHits("1", 30)).toEqual({ views: 3, clicks: 1 });
  });

  it("reports invite-use deltas only once measured", () => {
    expect(store.inviteUsesDelta("1", 7)).toBeNull();
    store.recordInviteUses("1", 10, dayShift(8));
    store.recordInviteUses("1", 25, dayShift(0));
    expect(store.inviteUsesDelta("1", 7)).toBe(15);
  });

  it("prunes history older than the retention window", () => {
    store.addSample("1", { day: dayShift(100), members: 1 });
    store.addSample("1", { day: dayShift(1), members: 2 });
    store.prune(90);
    expect(store.getSamples("1", 365)).toHaveLength(1);
  });

  it("stores meta values", () => {
    expect(store.getMeta("k")).toBeNull();
    store.setMeta("k", "v");
    expect(store.getMeta("k")).toBe("v");
  });
});
