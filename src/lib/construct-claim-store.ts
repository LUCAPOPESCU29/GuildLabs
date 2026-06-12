/**
 * Claim-code store for the "deploy via Discord" pull flow.
 *
 * Why this exists: the site runs on Vercel (public) but the bot runs on the
 * operator's own machine with no public URL — so the site can never push a
 * deploy to the bot. Instead the browser stores a blueprint here under a short,
 * human-typeable code; the user runs `/deploy code:XXXX-XXXX` in their server;
 * the bot (making an *outbound* request to the public site) redeems the code
 * and builds the server. Direction inverted → no inbound bot URL needed.
 *
 * Storage is an in-memory Map with a TTL, single-use on redeem. This matches
 * the project's `rate-limit.ts` philosophy: good enough for a single-instance
 * $0 pre-launch and for local dev (where `next dev` is one long-lived process).
 *
 * PRODUCTION NOTE: on Vercel the create (browser) and redeem (bot) requests can
 * land on different lambda instances, so an in-memory code may not be found.
 * For reliable production, back `claims` with a shared store (Vercel KV /
 * Upstash Redis) — the two functions below are the only seam that changes.
 */

import "server-only";
import { randomInt } from "node:crypto";

export const CLAIM_TTL_MS = 10 * 60_000; // 10 minutes
const MAX_CLAIMS = 5_000; // hard cap so a flood can't grow memory unbounded

type Claim = { blueprint: unknown; expiresAt: number };
const claims = new Map<string, Claim>();

// Crockford-ish alphabet: no I/L/O/U or 0/1 — unambiguous when typed by hand.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

/** Normalize user input ("abcd-1234", " ABCD1234 ") → canonical key "ABCD1234". */
export function normalizeCode(raw: string): string {
  return (raw ?? "").toUpperCase().replace(/[^0-9A-Z]/g, "");
}

/** Display form: "ABCD-1234". */
export function formatCode(canonical: string): string {
  return canonical.length === 8 ? `${canonical.slice(0, 4)}-${canonical.slice(4)}` : canonical;
}

function generateCode(): string {
  let out = "";
  for (let i = 0; i < 8; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

// Opportunistic sweep so expired entries can't accumulate over long uptime.
function sweep() {
  const now = Date.now();
  for (const [k, v] of claims) if (now > v.expiresAt) claims.delete(k);
}

/**
 * Store a blueprint and return a fresh, unique claim code (canonical, no dash).
 * Use `formatCode()` for display.
 */
export function createClaim(blueprint: unknown): { code: string; expiresInSec: number } {
  sweep();
  if (claims.size >= MAX_CLAIMS) {
    // Drop the soonest-to-expire entry to make room rather than refusing.
    let oldestKey: string | null = null;
    let oldestAt = Infinity;
    for (const [k, v] of claims) {
      if (v.expiresAt < oldestAt) {
        oldestAt = v.expiresAt;
        oldestKey = k;
      }
    }
    if (oldestKey) claims.delete(oldestKey);
  }

  let code = generateCode();
  // Astronomically unlikely to collide, but guarantee uniqueness anyway.
  while (claims.has(code)) code = generateCode();

  claims.set(code, { blueprint, expiresAt: Date.now() + CLAIM_TTL_MS });
  return { code, expiresInSec: Math.floor(CLAIM_TTL_MS / 1000) };
}

/**
 * Redeem a code: returns the blueprint and deletes it (single use), or null if
 * the code is unknown or expired.
 */
export function redeemClaim(rawCode: string): unknown | null {
  sweep();
  const key = normalizeCode(rawCode);
  const claim = claims.get(key);
  if (!claim) return null;
  claims.delete(key); // single use — redeem once, then it's gone
  if (Date.now() > claim.expiresAt) return null;
  return claim.blueprint;
}
