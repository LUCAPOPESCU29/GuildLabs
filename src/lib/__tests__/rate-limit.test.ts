import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { NextRequest } from "next/server";
import { rateLimit, clientIp, sweepExpired } from "@/lib/rate-limit";

let n = 0;
/** Unique key per test — the bucket map is module-level state. */
const key = () => `test-${++n}-${Date.now()}`;

function reqWithHeaders(headers: Record<string, string>): NextRequest {
  return { headers: new Headers(headers) } as unknown as NextRequest;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("rateLimit", () => {
  it("allows exactly `limit` requests within a window", () => {
    const k = key();
    for (let i = 0; i < 5; i++) {
      expect(rateLimit(k, 5, 60_000)).toEqual({ ok: true });
    }
    const blocked = rateLimit(k, 5, 60_000);
    expect(blocked.ok).toBe(false);
  });

  it("reports retryAfter as the seconds until the window resets", () => {
    const k = key();
    rateLimit(k, 1, 60_000);
    const blocked = rateLimit(k, 1, 60_000);
    expect(blocked).toEqual({ ok: false, retryAfter: 60 });

    vi.advanceTimersByTime(30_500);
    const later = rateLimit(k, 1, 60_000);
    // 29.5s remaining → ceil → 30
    expect(later).toEqual({ ok: false, retryAfter: 30 });
  });

  it("resets the window after windowMs elapses", () => {
    const k = key();
    rateLimit(k, 1, 60_000);
    expect(rateLimit(k, 1, 60_000).ok).toBe(false);

    vi.advanceTimersByTime(60_001);
    expect(rateLimit(k, 1, 60_000)).toEqual({ ok: true });
    // and the fresh window enforces again
    expect(rateLimit(k, 1, 60_000).ok).toBe(false);
  });

  it("does not reset at exactly resetAt (strictly after)", () => {
    const k = key();
    rateLimit(k, 1, 60_000);
    vi.advanceTimersByTime(60_000); // now === resetAt → still inside the window
    expect(rateLimit(k, 1, 60_000).ok).toBe(false);
    vi.advanceTimersByTime(1);
    expect(rateLimit(k, 1, 60_000).ok).toBe(true);
  });

  it("tracks keys independently", () => {
    const a = key();
    const b = key();
    rateLimit(a, 1, 60_000);
    expect(rateLimit(a, 1, 60_000).ok).toBe(false);
    expect(rateLimit(b, 1, 60_000).ok).toBe(true);
  });

  it("blocked requests do not extend the window (fixed window, not sliding)", () => {
    const k = key();
    rateLimit(k, 1, 10_000);
    for (let i = 0; i < 20; i++) rateLimit(k, 1, 10_000); // hammer while blocked
    vi.advanceTimersByTime(10_001);
    expect(rateLimit(k, 1, 10_000).ok).toBe(true);
  });
});

describe("sweepExpired", () => {
  it("is callable many times without affecting live buckets", () => {
    const k = key();
    rateLimit(k, 2, 60_000);
    for (let i = 0; i < 1200; i++) sweepExpired(); // crosses several sweep thresholds
    // bucket still live → second request counts against the same window
    expect(rateLimit(k, 2, 60_000)).toEqual({ ok: true });
    expect(rateLimit(k, 2, 60_000).ok).toBe(false);
  });

  it("removes expired buckets so they behave like fresh keys", () => {
    const k = key();
    rateLimit(k, 1, 1_000);
    vi.advanceTimersByTime(2_000);
    for (let i = 0; i < 600; i++) sweepExpired();
    expect(rateLimit(k, 1, 1_000)).toEqual({ ok: true });
  });
});

describe("clientIp", () => {
  it("uses the first x-forwarded-for hop", () => {
    const req = reqWithHeaders({ "x-forwarded-for": " 1.2.3.4 , 5.6.7.8" });
    expect(clientIp(req)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    const req = reqWithHeaders({ "x-real-ip": "9.9.9.9" });
    expect(clientIp(req)).toBe("9.9.9.9");
  });

  it('falls back to "local" with no headers', () => {
    const req = reqWithHeaders({});
    expect(clientIp(req)).toBe("local");
  });
});
