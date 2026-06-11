import { describe, it, expect } from "vitest";
import { validateBlueprint, BlueprintInvalid } from "@/lib/blueprint-validate";
import { PERM_PRESETS, ROLE_PALETTE } from "@/lib/blueprint";
import { CAPS } from "@/lib/construct-ai";

/** A minimal valid raw blueprint the model could plausibly emit. */
function minimalRaw(overrides: Record<string, unknown> = {}) {
  return {
    name: "Test Server",
    summary: "A test.",
    mixNote: "Note.",
    categories: [
      {
        name: "CHAT",
        emoji: "💬",
        channels: [{ name: "general", type: "text" }],
      },
    ],
    roles: [{ name: "Admin", color: "#f43f5e", hoist: true, perms: "admin" }],
    permissions: ["Mods keep elevated tools."],
    ...overrides,
  };
}

describe("validateBlueprint — happy path", () => {
  it("passes through a clean blueprint and recomputes stats", () => {
    const bp = validateBlueprint(minimalRaw());
    expect(bp.name).toBe("Test Server");
    expect(bp.summary).toBe("A test.");
    expect(bp.categories).toHaveLength(1);
    expect(bp.categories[0].channels).toEqual([{ name: "general", type: "text" }]);
    expect(bp.roles[0]).toEqual({
      name: "Admin",
      color: "#f43f5e",
      hoist: true,
      perms: PERM_PRESETS.admin,
    });
    expect(bp.stats).toEqual({ categories: 1, channels: 1, voice: 0, roles: 1 });
  });

  it("ignores model-provided stats and recomputes them", () => {
    const bp = validateBlueprint(
      minimalRaw({ stats: { categories: 99, channels: 99, voice: 99, roles: 99 } })
    );
    expect(bp.stats).toEqual({ categories: 1, channels: 1, voice: 0, roles: 1 });
  });

  it("counts voice and stage channels in stats.voice", () => {
    const bp = validateBlueprint(
      minimalRaw({
        categories: [
          {
            name: "VOICE",
            channels: [
              { name: "Lobby", type: "voice" },
              { name: "Stage", type: "stage" },
              { name: "general", type: "text" },
              { name: "qa", type: "forum" },
            ],
          },
        ],
      })
    );
    expect(bp.stats.voice).toBe(2);
    expect(bp.stats.channels).toBe(4);
  });
});

describe("validateBlueprint — junk / malformed top-level input", () => {
  it.each([null, undefined, "a string", 42, true, [1, 2]])(
    "throws BlueprintInvalid for %j",
    (raw) => {
      expect(() => validateBlueprint(raw)).toThrow(BlueprintInvalid);
    }
  );

  it("throws BlueprintInvalid for an empty object (no usable channels)", () => {
    expect(() => validateBlueprint({})).toThrow(BlueprintInvalid);
  });

  it("throws BlueprintInvalid when every category has no channels", () => {
    expect(() =>
      validateBlueprint(minimalRaw({ categories: [{ name: "EMPTY", channels: [] }] }))
    ).toThrow("no usable channels");
  });

  it("throws BlueprintInvalid when channels only have blank names", () => {
    expect(() =>
      validateBlueprint(
        minimalRaw({
          categories: [{ name: "X", channels: [{ name: "   " }, { name: "" }] }],
        })
      )
    ).toThrow(BlueprintInvalid);
  });

  it("throws BlueprintInvalid (not a raw TypeError) for null array members", () => {
    expect(() =>
      validateBlueprint(minimalRaw({ categories: [null, { name: "X", channels: [] }] }))
    ).toThrow(BlueprintInvalid);
  });

  it("treats null/undefined arrays as empty, rejects uncastable scalars", () => {
    // .ensure() maps null → [] …
    const bp = validateBlueprint(minimalRaw({ roles: null, permissions: null }));
    expect(bp.roles.map((r) => r.name)).toEqual(["Admin", "Member"]); // defaults injected
    expect(bp.permissions).toEqual([]);
    // … but wraps scalars ([42]) whose elements can't cast to objects → invalid.
    expect(() => validateBlueprint(minimalRaw({ roles: 42 }))).toThrow(BlueprintInvalid);
    expect(() => validateBlueprint(minimalRaw({ categories: "nope" }))).toThrow(
      BlueprintInvalid
    );
  });
});

describe("validateBlueprint — field coercion & repair", () => {
  it("clamps unknown channel types to text", () => {
    const bp = validateBlueprint(
      minimalRaw({
        categories: [
          {
            name: "X",
            channels: [
              { name: "a", type: "video" },
              { name: "b", type: 7 },
              { name: "c", type: null },
              { name: "d" },
              { name: "e", type: "voice" },
            ],
          },
        ],
      })
    );
    expect(bp.categories[0].channels.map((c) => c.type)).toEqual([
      "text",
      "text",
      "text",
      "text",
      "voice",
    ]);
  });

  it("maps unknown perm presets to member", () => {
    const bp = validateBlueprint(
      minimalRaw({
        roles: [
          { name: "Boss", perms: "admin" },
          { name: "Weird", perms: "superuser" },
          { name: "Nullish", perms: null },
          { name: "Numeric", perms: 3 },
        ],
      })
    );
    const byName = Object.fromEntries(bp.roles.map((r) => [r.name, r.perms]));
    expect(byName.Boss).toBe(PERM_PRESETS.admin);
    expect(byName.Weird).toBe(PERM_PRESETS.member);
    expect(byName.Nullish).toBe(PERM_PRESETS.member);
    expect(byName.Numeric).toBe(PERM_PRESETS.member);
  });

  it("truncates long names to their caps", () => {
    const bp = validateBlueprint(
      minimalRaw({
        name: "N".repeat(200),
        summary: "S".repeat(500),
        mixNote: "M".repeat(500),
        categories: [
          {
            name: "C".repeat(100),
            channels: [{ name: "x".repeat(100), type: "text" }],
          },
        ],
        roles: [{ name: "R".repeat(100), perms: "admin" }],
        permissions: ["P".repeat(500)],
      })
    );
    expect(bp.name).toHaveLength(60);
    expect(bp.summary).toHaveLength(240);
    expect(bp.mixNote).toHaveLength(240);
    expect(bp.categories[0].name).toHaveLength(24);
    expect(bp.categories[0].channels[0].name).toHaveLength(24);
    expect(bp.roles.find((r) => r.name.startsWith("R"))!.name).toHaveLength(24);
    expect(bp.permissions[0]).toHaveLength(200);
  });

  it("falls back for missing name / category name / emoji", () => {
    const bp = validateBlueprint(
      minimalRaw({
        name: "   ",
        categories: [{ channels: [{ name: "general" }] }],
      })
    );
    expect(bp.name).toBe("My Server");
    expect(bp.categories[0].name).toBe("GENERAL");
    expect(bp.categories[0].emoji).toBe("📁");
  });

  it("replaces invalid role colors from the palette, keeps valid hex", () => {
    const bp = validateBlueprint(
      minimalRaw({
        roles: [
          { name: "A", color: "red", perms: "admin" },
          { name: "B", color: "#abc" },
          { name: "C", color: "#12345g" },
          { name: "D", color: 123 },
        ],
      })
    );
    expect(bp.roles[0].color).toBe(ROLE_PALETTE[0]);
    expect(bp.roles[1].color).toBe("#abc"); // 3-digit hex is valid
    expect(bp.roles[2].color).toBe(ROLE_PALETTE[2]);
    expect(bp.roles[3].color).toBe(ROLE_PALETTE[3]);
  });

  it("coerces hoist to a boolean, defaulting junk to false", () => {
    const bp = validateBlueprint(
      minimalRaw({
        roles: [
          { name: "A", hoist: true, perms: "admin" },
          { name: "B", hoist: "true" }, // yup's boolean cast runs first → true
          { name: "C", hoist: "yes" },
          { name: "D", hoist: null },
          { name: "E" },
        ],
      })
    );
    expect(bp.roles.map((r) => r.hoist)).toEqual([true, true, false, false, false]);
  });
});

describe("validateBlueprint — dedupe & caps", () => {
  it("dedupes channels case-insensitively per type within a category", () => {
    const bp = validateBlueprint(
      minimalRaw({
        categories: [
          {
            name: "X",
            channels: [
              { name: "General", type: "text" },
              { name: "general", type: "text" },
              { name: "general", type: "voice" }, // same name, different type → kept
            ],
          },
        ],
      })
    );
    expect(bp.categories[0].channels).toHaveLength(2);
  });

  it("dedupes categories case-insensitively, dropping later duplicates", () => {
    const bp = validateBlueprint(
      minimalRaw({
        categories: [
          { name: "Chat", channels: [{ name: "a" }] },
          { name: "CHAT", channels: [{ name: "b" }] },
        ],
      })
    );
    expect(bp.categories).toHaveLength(1);
    expect(bp.categories[0].channels[0].name).toBe("a");
  });

  it("dedupes roles case-insensitively and skips blank names", () => {
    const bp = validateBlueprint(
      minimalRaw({
        roles: [
          { name: "Mod", perms: "mod" },
          { name: "MOD", perms: "admin" },
          { name: "  ", perms: "admin" },
        ],
      })
    );
    expect(bp.roles.filter((r) => r.name.toLowerCase() === "mod")).toHaveLength(1);
  });

  it("caps oversized arrays (channels per category, categories, roles)", () => {
    const manyChannels = Array.from({ length: 500 }, (_, i) => ({
      name: `c-${i}`,
      type: "text",
    }));
    const manyCategories = Array.from({ length: 100 }, (_, i) => ({
      name: `CAT-${i}`,
      channels: [{ name: `ch-${i}` }],
    }));
    const manyRoles = Array.from({ length: 200 }, (_, i) => ({
      name: `role-${i}`,
      perms: i === 0 ? "admin" : "member",
    }));
    const bp = validateBlueprint(
      minimalRaw({
        categories: [{ name: "BIG", channels: manyChannels }, ...manyCategories],
        roles: manyRoles,
        permissions: Array.from({ length: 50 }, (_, i) => `note ${i}`),
      })
    );
    expect(bp.categories[0].channels).toHaveLength(CAPS.channelsPerCategory);
    expect(bp.categories.length).toBeLessThanOrEqual(CAPS.categories);
    expect(bp.roles).toHaveLength(CAPS.roles);
    expect(bp.permissions).toHaveLength(8);
    // stats always match what's actually in the blueprint
    expect(bp.stats.channels).toBe(
      bp.categories.reduce((n, c) => n + c.channels.length, 0)
    );
    expect(bp.stats.roles).toBe(bp.roles.length);
  });

  it("strips unknown junk keys instead of carrying them through", () => {
    const bp = validateBlueprint(
      minimalRaw({ evil: "payload", __proto__: { hacked: true } })
    ) as unknown as Record<string, unknown>;
    expect(bp.evil).toBeUndefined();
    expect(bp.hacked).toBeUndefined();
  });
});

describe("validateBlueprint — role hierarchy guarantees", () => {
  it("injects Admin + Member when the model returns no roles", () => {
    const bp = validateBlueprint(minimalRaw({ roles: [] }));
    expect(bp.roles.map((r) => r.name)).toEqual(["Admin", "Member"]);
    expect(bp.roles[0].perms).toBe(PERM_PRESETS.admin);
    expect(bp.roles[1].perms).toBe(PERM_PRESETS.member);
  });

  it("prepends an Admin role when none of the roles is admin", () => {
    const bp = validateBlueprint(
      minimalRaw({ roles: [{ name: "Member", perms: "member" }] })
    );
    expect(bp.roles[0].name).toBe("Admin");
    expect(bp.roles[0].perms).toBe(PERM_PRESETS.admin);
    expect(bp.roles).toHaveLength(2);
  });

  it("does not add a second admin when one already exists", () => {
    const bp = validateBlueprint(
      minimalRaw({ roles: [{ name: "Owner", perms: "admin" }] })
    );
    expect(bp.roles).toHaveLength(1);
    expect(bp.roles[0].name).toBe("Owner");
  });

  it("fills in default summary and mixNote when missing", () => {
    const bp = validateBlueprint(minimalRaw({ summary: "", mixNote: undefined }));
    expect(bp.summary).toMatch(/categories and \d+ roles/);
    expect(bp.mixNote).toBe("Tailored from your description.");
  });

  it("trims and drops empty permission notes", () => {
    const bp = validateBlueprint(
      minimalRaw({ permissions: ["  keep me  ", "", "   ", null, 5, "two"] })
    );
    expect(bp.permissions).toEqual(["keep me", "5", "two"]);
  });
});
