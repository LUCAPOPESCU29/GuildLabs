import { describe, it, expect } from "vitest";
import { aiBlueprintToDeployJSON } from "@/lib/construct-deploy";
import { PERM_PRESETS, type Blueprint } from "@/lib/blueprint";

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
        { name: "Admin", color: "#f43f5e", hoist: true, permissions: PERM_PRESETS.admin },
        { name: "Member", color: "#a78bfa", hoist: false, permissions: PERM_PRESETS.member },
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

  it("maps role.perms onto the deploy key `permissions`", () => {
    const json = aiBlueprintToDeployJSON(makeBlueprint());
    expect(json.roles.every((r) => typeof r.permissions === "string")).toBe(true);
    expect("perms" in json.roles[0]).toBe(false);
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
