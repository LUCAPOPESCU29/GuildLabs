/**
 * Minimal in-memory, per-IP fixed-window rate limiter for the Construct AI
 * routes. This is a single-instance guard (good enough for a $0 pre-launch
 * deployment); swap for a shared store (Redis/Upstash) if it ever scales out.
 */

import "server-only";
import type { NextRequest } from "next/server";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "local";
}

export type RateResult = { ok: true } | { ok: false; retryAfter: number };

/**
 * Allow `limit` requests per `windowMs` per key. Returns `retryAfter` (seconds)
 * when blocked.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateResult {
  const now = Date.now();
  const b = buckets.get(key);

  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (b.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count += 1;
  return { ok: true };

}

// Opportunistic cleanup so the map can't grow unbounded over a long uptime.
const SWEEP_EVERY = 500;
let writes = 0;
export function sweepExpired() {
  if (++writes % SWEEP_EVERY !== 0) return;
  const now = Date.now();
  for (const [k, v] of buckets) if (now > v.resetAt) buckets.delete(k);
}
