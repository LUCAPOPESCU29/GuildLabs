import { describe, it, expect, vi, afterEach } from "vitest";
import {
  createClaim,
  redeemClaim,
  normalizeCode,
  formatCode,
  CLAIM_TTL_MS,
} from "@/lib/construct-claim-store";

const sampleBlueprint = {
  server: { name: "Test" },
  categories: [{ name: "GENERAL", channels: [{ name: "general", type: "text" }] }],
  roles: [{ name: "Admin", permissions: ["Administrator"], color: "#f43f5e", hoist: true }],
};

afterEach(() => {
  vi.useRealTimers();
});

describe("normalizeCode / formatCode", () => {
  it("strips dashes/spaces and uppercases", () => {
    expect(normalizeCode(" abcd-2345 ")).toBe("ABCD2345");
    expect(normalizeCode("ab cd23 45")).toBe("ABCD2345");
  });

  it("formats an 8-char code with a dash", () => {
    expect(formatCode("ABCD2345")).toBe("ABCD-2345");
  });

  it("leaves non-8-char input unformatted", () => {
    expect(formatCode("ABC")).toBe("ABC");
  });
});

describe("createClaim / redeemClaim", () => {
  it("returns an 8-char code from the unambiguous alphabet", () => {
    const { code, expiresInSec } = createClaim(sampleBlueprint);
    expect(code).toMatch(/^[2-9A-HJKMNP-TV-Z]{8}$/); // no I/L/O/U, no 0/1
    expect(expiresInSec).toBe(Math.floor(CLAIM_TTL_MS / 1000));
  });

  it("round-trips the blueprint", () => {
    const { code } = createClaim(sampleBlueprint);
    expect(redeemClaim(code)).toEqual(sampleBlueprint);
  });

  it("redeems case-insensitively and ignores dashes", () => {
    const { code } = createClaim(sampleBlueprint);
    const display = formatCode(code).toLowerCase();
    expect(redeemClaim(display)).toEqual(sampleBlueprint);
  });

  it("is single-use — a second redeem returns null", () => {
    const { code } = createClaim(sampleBlueprint);
    expect(redeemClaim(code)).toEqual(sampleBlueprint);
    expect(redeemClaim(code)).toBeNull();
  });

  it("returns null for an unknown code", () => {
    expect(redeemClaim("ZZZZ9999")).toBeNull();
  });

  it("expires after the TTL", () => {
    vi.useFakeTimers();
    const { code } = createClaim(sampleBlueprint);
    vi.advanceTimersByTime(CLAIM_TTL_MS + 1000);
    expect(redeemClaim(code)).toBeNull();
  });

  it("hands out unique codes across many claims", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 200; i++) codes.add(createClaim(sampleBlueprint).code);
    expect(codes.size).toBe(200);
  });
});
