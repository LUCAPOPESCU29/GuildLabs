import { describe, it, expect } from "vitest";
import { aiBlueprintToDeployJSON } from "@/lib/construct-deploy";
import { PERM_PRESETS, PERM_FLAGS, permsToFlags, type Blueprint } from "@/lib/blueprint";

function makeBlueprint(overrides: Partial<Blueprint> = {}): Blueprint {
  return {
    name: "Trading Hub",
    summary: "A crypto server.",
    mixNote: "Tailored.",
    categories: [
      {
        name: "INFO",
        emoji: "📢",
        channels: [
          { name: "rules", type: "text" },
          { name: "Stage", type: "stage" },
        ],
      },
      {
        name: "VOICE",
        emoji: "🔊",
        channels: [{ name: "Lobby", type: "voice" }],
      },
    ],
    roles: [
      { name: "Admin", color: "#f43f5e", hoist: true, perms: PERM_PRESETS.admin },
      { name: "Member", color: "#a78bfa", hoist: false, perms: PERM_PRESETS.member },
    ],
    permissions: ["Not financial advice."],
    stats: { categories: 2, channels: 3, voice: 2, roles: 2 },
    ...overrides,
  };
}

describe("aiBlueprintToDeployJSON", () => {
  it("produces the wizard-compatible deploy shape with source: ai", () => {
    const json = aiBlueprintToDeployJSON(makeBlueprint());
    expect(json).toEqual({
      server: {
        name: "Trading Hub",
        types: [],
        moderation: "balanced",
        features: ["voice"],
        advanced: [],
      },
      categories: [
        {
          name: "INFO",
          channels: [
            { name: "rules", type: "text" },
            { name: "Stage", type: "stage" },
          ],
        },
        { name: "VOICE", channels: [{ name: "Lobby", type: "voice" }] },
      ],
      roles: [
        {
          name: "Admin",
          color: "#f43f5e",
          hoist: true,
          permissions: PERM_FLAGS.admin,
          permissionsLabel: PERM_PRESETS.admin,
        },
        {
          name: "Member",
          color: "#a78bfa",
          hoist: false,
          permissions: PERM_FLAGS.member,
          permissionsLabel: PERM_PRESETS.member,
        },
      ],
      permissions: ["Not financial advice."],
      source: "ai",
    });
  });

  it("omits the voice feature when stats.voice is 0", () => {
    const bp = makeBlueprint({
      categories: [
        { name: "CHAT", emoji: "💬", channels: [{ name: "general", type: "text" }] },
      ],
      stats: { categories: 1, channels: 1, voice: 0, roles: 2 },
    });
    expect(aiBlueprintToDeployJSON(bp).server.features).toEqual([]);
  });

  it("maps role.perms onto explicit Discord flag arrays", () => {
    const json = aiBlueprintToDeployJSON(makeBlueprint());
    expect(json.roles.every((r) => Array.isArray(r.permissions) && r.permissions.length > 0)).toBe(
      true
    );
    expect(json.roles[0].permissions).toEqual(["Administrator"]);
    expect(json.roles[1].permissions).toContain("ViewChannel");
    expect(json.roles[1].permissions).toContain("SendMessages");
    expect("perms" in json.roles[0]).toBe(false);
  });

  describe("permsToFlags", () => {
    it("resolves every preset display string to its flag set", () => {
      for (const key of Object.keys(PERM_PRESETS) as (keyof typeof PERM_PRESETS)[]) {
        expect(permsToFlags(PERM_PRESETS[key])).toEqual(PERM_FLAGS[key]);
      }
    });

    it("resolves preset keys directly", () => {
      expect(permsToFlags("mod")).toEqual(PERM_FLAGS.mod);
    });

    it("never returns an empty list for free text", () => {
      for (const text of [
        "Access gaming channels",
        "Earned via XP",
        "Team A voice + chat",
        "Manage support",
        "",
      ]) {
        const flags = permsToFlags(text);
        expect(flags.length).toBeGreaterThan(0);
        expect(flags).toContain("ViewChannel");
        expect(flags).toContain("SendMessages");
      }
    });

    it("layers keyword flags on top of the member baseline", () => {
      const flags = permsToFlags("Manage class channels");
      expect(flags).toContain("ManageChannels");
      expect(flags).toContain("SendMessages");
    });

    it("admin free text wins outright", () => {
      expect(permsToFlags("full administrator access")).toEqual(["Administrator"]);
    });
  });

  it("preserves category/channel order", () => {
    const json = aiBlueprintToDeployJSON(makeBlueprint());
    expect(json.categories.map((c) => c.name)).toEqual(["INFO", "VOICE"]);
    expect(json.categories[0].channels.map((c) => c.name)).toEqual(["rules", "Stage"]);
  });

  it("handles an empty permissions list", () => {
    const json = aiBlueprintToDeployJSON(makeBlueprint({ permissions: [] }));
    expect(json.permissions).toEqual([]);
  });
});
