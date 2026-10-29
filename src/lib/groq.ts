/**
 * Server-only Groq client with automatic API-key rotation.
 *
 * Groq's free tier caps tokens per day per key, so a single key dies partway
 * through a busy day. This module holds a pool of keys and moves to the next
 * one the moment a key reports a rate limit, remembering how long that key is
 * out for. Cooldowns live in module memory, which on serverless means "for the
 * life of this instance" — a cold start simply re-probes, costing one cheap
 * 429 (~200ms) before moving on.
 *
 * Groq is OpenAI-compatible, so this is a thin fetch wrapper with a timeout and
 * a retry. It throws typed `GroqError`s the route handlers turn into the
 * `ConstructError` shape the UI knows how to render.
 */

import "server-only";
import { MODEL } from "./construct-ai";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const TIMEOUT_MS = 20_000;
/** Fallback cooldown when Groq doesn't tell us how long to wait. */
const DEFAULT_COOLDOWN_MS = 60_000;
/** Ceiling so a daily-limit response can't park a key for hours on end. */
const MAX_COOLDOWN_MS = 30 * 60_000;

export type GroqMessage = { role: "system" | "user" | "assistant"; content: string };

export type GroqErrorKind = "not_configured" | "timeout" | "upstream" | "rate_limited";

export class GroqError extends Error {
  kind: GroqErrorKind;
  status?: number;
  constructor(kind: GroqErrorKind, message: string, status?: number) {
    super(message);
    this.name = "GroqError";
    this.kind = kind;
    this.status = status;
  }
}

// ── Key pool ────────────────────────────────────────────────────────────────

/**
 * Keys come from `GROQ_API_KEYS` (comma/space/newline separated) with
 * `GROQ_API_KEY` kept as the first entry for backwards compatibility.
 */
function loadKeys(): string[] {
  const raw = [process.env.GROQ_API_KEY ?? "", process.env.GROQ_API_KEYS ?? ""].join(",");
  const seen = new Set<string>();
  return raw
    .split(/[\s,]+/)
    .map((k) => k.trim())
    .filter((k) => k.length > 20 && !seen.has(k) && seen.add(k));
}

type KeyState = {
  /** Epoch ms until which this key is rate-limited. */
  cooldownUntil: number;
  /** Set when a key is rejected outright (401/403) — never retried. */
  dead: boolean;
  /** Groq organization this key belongs to, learned from rate-limit responses. */
  org?: string;
};

const state = new Map<string, KeyState>();
/** Rotating start offset so load spreads across keys instead of always hitting #1. */
let cursor = 0;

function stateFor(key: string): KeyState {
  let s = state.get(key);
  if (!s) {
    s = { cooldownUntil: 0, dead: false };
    state.set(key, s);
  }
  return s;
}

function isAvailable(key: string, now: number): boolean {
  const s = stateFor(key);
  return !s.dead && s.cooldownUntil <= now;
}

/**
 * Groq enforces quota per ORGANIZATION, not per key, and names the org in its
 * rate-limit body. Several keys from one account therefore share one budget —
 * rotating between them is pointless, so we cool the whole org at once instead
 * of burning a request probing each key.
 */
function applyOrgCooldown(key: string, body: string, until: number) {
  const org = body.match(/org_[a-z0-9]+/i)?.[0];
  if (!org) return;
  stateFor(key).org = org;
  // A daily cap is account-wide; a per-minute one may clear sooner, so only
  // spread the cooldown when Groq says it's the daily budget.
  if (!/tokens per day|TPD/i.test(body)) return;
  for (const s of state.values()) {
    if (s.org === org) s.cooldownUntil = Math.max(s.cooldownUntil, until);
  }
}

/**
 * Pull the wait time out of a 429. Groq sends a `retry-after` header and also
 * embeds a friendlier "try again in 18m23.76s" in the body.
 */
function parseCooldownMs(retryAfter: string | null, body: string): number {
  const header = Number(retryAfter);
  if (Number.isFinite(header) && header > 0) {
    return Math.min(MAX_COOLDOWN_MS, header * 1000 + 250);
  }
  const m = body.match(/try again in\s+(?:(\d+)m)?([\d.]+)s/i);
  if (m) {
    const mins = Number(m[1] ?? 0);
    const secs = Number(m[2] ?? 0);
    const ms = (mins * 60 + secs) * 1000 + 250;
    if (Number.isFinite(ms) && ms > 0) return Math.min(MAX_COOLDOWN_MS, ms);
  }
  return DEFAULT_COOLDOWN_MS;
}

export function isGroqConfigured(): boolean {
  return loadKeys().length > 0;
}

/** Diagnostics for the admin/status surfaces — never exposes key material. */
export function groqPoolStatus() {
  const now = Date.now();
  const keys = loadKeys();
  const orgs = new Set(keys.map((k) => stateFor(k).org).filter(Boolean));
  return {
    total: keys.length,
    available: keys.filter((k) => isAvailable(k, now)).length,
    cooling: keys.filter((k) => !stateFor(k).dead && stateFor(k).cooldownUntil > now).length,
    dead: keys.filter((k) => stateFor(k).dead).length,
    // Quota is per-org: N keys in 1 org share one budget and rotation won't help.
    knownOrgs: orgs.size,
  };
}

// ── Transport ───────────────────────────────────────────────────────────────

async function once(
  messages: GroqMessage[],
  json: boolean,
  signal: AbortSignal,
  key: string
): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 2400,
      // MODEL is a reasoning model: without this, reasoning burns ~1200 of the
      // 2400 output tokens and can truncate the JSON mid-object.
      reasoning_effort: "low",
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
    signal,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");

    if (res.status === 429) {
      const ms = parseCooldownMs(res.headers.get("retry-after"), body);
      const until = Date.now() + ms;
      stateFor(key).cooldownUntil = until;
      applyOrgCooldown(key, body, until);
      throw new GroqError("rate_limited", `Key rate-limited for ${Math.round(ms / 1000)}s`, 429);
    }
    if (res.status === 401 || res.status === 403) {
      // An invalid or revoked key will never recover — stop using it.
      stateFor(key).dead = true;
      throw new GroqError("upstream", `Groq rejected a key (${res.status})`, res.status);
    }

    throw new GroqError(
      "upstream",
      `Groq responded ${res.status}${body ? `: ${body.slice(0, 200)}` : ""}`,
      res.status
    );
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new GroqError("upstream", "Groq returned an empty response.");
  return content;
}

async function attempt(
  messages: GroqMessage[],
  json: boolean,
  key: string
): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await once(messages, json, ctrl.signal, key);
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new GroqError("timeout", "The model took too long to respond.");
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Call Groq, rotating through the key pool.
 *
 * A rate-limited or rejected key is skipped and the next one tried immediately,
 * so a user only sees an error once *every* key is exhausted. Transient 5xx and
 * timeouts get one retry on the same key before moving on.
 */
export async function callGroq(
  messages: GroqMessage[],
  opts: { json?: boolean } = {}
): Promise<string> {
  const keys = loadKeys();
  if (keys.length === 0) {
    throw new GroqError("not_configured", "No Groq API keys are set.");
  }

  const json = !!opts.json;
  const now = Date.now();
  // Start where we left off so traffic spreads rather than hammering key #1.
  const ordered = keys.map((_, i) => keys[(cursor + i) % keys.length]);
  const usable = ordered.filter((k) => isAvailable(k, now));
  // If everything is cooling down, still try them all — a cooldown is an
  // estimate, and being wrong is cheaper than refusing to serve the request.
  const candidates = usable.length ? usable : ordered.filter((k) => !stateFor(k).dead);

  if (candidates.length === 0) {
    throw new GroqError("rate_limited", "All Groq keys are rate-limited or invalid.", 429);
  }

  let lastError: unknown = null;

  for (let i = 0; i < candidates.length; i++) {
    const key = candidates[i];
    try {
      const out = await attempt(messages, json, key);
      cursor = (keys.indexOf(key) + 1) % keys.length;
      return out;
    } catch (e) {
      lastError = e;

      if (e instanceof GroqError && e.kind === "rate_limited") continue; // next key
      if (e instanceof GroqError && (e.status === 401 || e.status === 403)) continue;

      // Transient: one retry on this same key before rotating.
      const transient =
        e instanceof GroqError &&
        (e.kind === "timeout" || (e.kind === "upstream" && (e.status ?? 500) >= 500));
      if (transient) {
        try {
          const out = await attempt(messages, json, key);
          cursor = (keys.indexOf(key) + 1) % keys.length;
          return out;
        } catch (e2) {
          lastError = e2;
          continue;
        }
      }

      // Anything else (e.g. a malformed request) will fail identically on every
      // key, so fail fast rather than burning the whole pool.
      throw e;
    }
  }

  if (lastError instanceof GroqError) throw lastError;
  throw new GroqError("upstream", "Every Groq key failed.", 502);
}
