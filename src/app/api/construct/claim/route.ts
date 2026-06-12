import { NextRequest, NextResponse } from "next/server";
import { createClaim, formatCode } from "@/lib/construct-claim-store";
import { rateLimit, clientIp, bodyTooLarge } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/construct/claim
 * Body: { blueprint }  — the deploy-shape JSON from the builder.
 * Returns: { ok, code, codeDisplay, expiresInSec }
 *
 * Anyone holding a blueprint can mint a code — no Discord login required. The
 * code is high-entropy, single-use, and 10-min TTL, so it's a capability token,
 * not a secret tied to an account. The bot redeems it via GET /claim/[code].
 */
export async function POST(req: NextRequest) {
  const limit = rateLimit(`claim:${clientIp(req)}`, 20, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many requests — give it a moment." },
      { status: 429 }
    );
  }
  if (bodyTooLarge(req)) {
    return NextResponse.json({ ok: false, error: "Blueprint is too large." }, { status: 413 });
  }

  const body = await req.json().catch(() => null);
  const blueprint = body?.blueprint;
  if (!blueprint || typeof blueprint !== "object") {
    return NextResponse.json({ ok: false, error: "Missing blueprint." }, { status: 400 });
  }

  // Sanity floor: a usable blueprint has at least categories or roles.
  const hasContent =
    (Array.isArray((blueprint as Record<string, unknown>).categories) &&
      (blueprint as { categories: unknown[] }).categories.length > 0) ||
    (Array.isArray((blueprint as Record<string, unknown>).roles) &&
      (blueprint as { roles: unknown[] }).roles.length > 0);
  if (!hasContent) {
    return NextResponse.json(
      { ok: false, error: "Blueprint has no channels or roles to build." },
      { status: 400 }
    );
  }

  const { code, expiresInSec } = createClaim(blueprint);
  return NextResponse.json(
    { ok: true, code, codeDisplay: formatCode(code), expiresInSec },
    { headers: { "Cache-Control": "no-store" } }
  );
}
