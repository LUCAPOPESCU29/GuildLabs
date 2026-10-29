import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * Rotation tests for the Groq key pool.
 *
 * The module caches key state in module scope, so each test re-imports it with
 * `vi.resetModules()` to get a clean pool.
 */

const K1 = "gsk_key1_aaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const K2 = "gsk_key2_bbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const K3 = "gsk_key3_cccccccccccccccccccccccccccc";

type Handler = (key: string) => { status: number; body: string; retryAfter?: string };

/** Install a fetch stub that answers based on the bearer token, and log calls. */
function mockGroq(handler: Handler) {
  const calls: string[] = [];
  vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
    const auth = String((init.headers as Record<string, string>).Authorization ?? "");
    const key = auth.replace("Bearer ", "");
    calls.push(key);
    const { status, body, retryAfter } = handler(key);
    return {
      ok: status >= 200 && status < 300,
      status,
      headers: { get: (h: string) => (h === "retry-after" ? (retryAfter ?? null) : null) },
      text: async () => body,
      json: async () => JSON.parse(body),
    } as unknown as Response;
  });
  return calls;
}

const okBody = JSON.stringify({ choices: [{ message: { content: '{"ok":true}' } }] });

async function loadGroq() {
  vi.resetModules();
  return import("@/lib/groq");
}

beforeEach(() => {
  process.env.GROQ_API_KEY = "";
  process.env.GROQ_API_KEYS = "";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("groq key pool", () => {
  it("parses keys from GROQ_API_KEY and GROQ_API_KEYS, deduped", async () => {
    process.env.GROQ_API_KEY = K1;
    process.env.GROQ_API_KEYS = `${K1}, ${K2}\n${K3}`;
    const { groqPoolStatus, isGroqConfigured } = await loadGroq();
    expect(isGroqConfigured()).toBe(true);
    expect(groqPoolStatus().total).toBe(3);
  });

  it("reports not configured when no keys are set", async () => {
    const { isGroqConfigured } = await loadGroq();
    expect(isGroqConfigured()).toBe(false);
  });

  it("rotates to the next key when one is rate-limited", async () => {
    process.env.GROQ_API_KEYS = [K1, K2, K3].join(",");
    const calls = mockGroq((key) =>
      key === K1
        ? { status: 429, body: '{"error":{"message":"try again in 18m23.76s"}}' }
        : { status: 200, body: okBody }
    );
    const { callGroq } = await loadGroq();
    await expect(callGroq([{ role: "user", content: "hi" }])).resolves.toContain("ok");
    expect(calls).toEqual([K1, K2]); // tried the dead key once, then succeeded
  });

  it("skips a cooled-down key on the next call", async () => {
    process.env.GROQ_API_KEYS = [K1, K2].join(",");
    const calls = mockGroq((key) =>
      key === K1 ? { status: 429, body: "{}", retryAfter: "600" } : { status: 200, body: okBody }
    );
    const { callGroq, groqPoolStatus } = await loadGroq();
    await callGroq([{ role: "user", content: "a" }]);
    expect(groqPoolStatus().cooling).toBe(1);

    calls.length = 0;
    await callGroq([{ role: "user", content: "b" }]);
    // K1 is still cooling, so it must not be tried again.
    expect(calls).not.toContain(K1);
  });

  it("permanently drops a key Groq rejects as invalid", async () => {
    process.env.GROQ_API_KEYS = [K1, K2].join(",");
    mockGroq((key) =>
      key === K1 ? { status: 401, body: '{"error":"invalid api key"}' } : { status: 200, body: okBody }
    );
    const { callGroq, groqPoolStatus } = await loadGroq();
    await callGroq([{ role: "user", content: "a" }]);
    expect(groqPoolStatus().dead).toBe(1);
  });

  it("throws rate_limited only once every key is exhausted", async () => {
    process.env.GROQ_API_KEYS = [K1, K2].join(",");
    mockGroq(() => ({ status: 429, body: "{}", retryAfter: "600" }));
    const { callGroq } = await loadGroq();
    await expect(callGroq([{ role: "user", content: "a" }])).rejects.toMatchObject({
      kind: "rate_limited",
    });
  });

  it("fails fast on a request error rather than burning every key", async () => {
    process.env.GROQ_API_KEYS = [K1, K2, K3].join(",");
    const calls = mockGroq(() => ({ status: 400, body: '{"error":"bad request"}' }));
    const { callGroq } = await loadGroq();
    await expect(callGroq([{ role: "user", content: "a" }])).rejects.toThrow();
    expect(calls).toHaveLength(1); // a 400 is deterministic — no point retrying
  });

  it("succeeds when the last remaining key works", async () => {
    process.env.GROQ_API_KEYS = [K1, K2, K3].join(",");
    const calls = mockGroq((key) =>
      key === K3 ? { status: 200, body: okBody } : { status: 429, body: "{}", retryAfter: "600" }
    );
    const { callGroq } = await loadGroq();
    await expect(callGroq([{ role: "user", content: "a" }])).resolves.toContain("ok");
    expect(calls).toEqual([K1, K2, K3]);
  });
});
