import { NextRequest, NextResponse } from "next/server";
import { redeemClaim } from "@/lib/construct-claim-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Shared secret with the bot. The site proxy already uses this same env, and
// the bot sends it as `x-api-key`. Default mirrors the proxy's dev fallback.
const BOT_KEY = process.env.BOT_API_KEY || "forge-local-dev";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

/**
 * GET /api/construct/claim/[code]
 * Bot-only (x-api-key). Redeems a claim code and returns its blueprint.
 * Single-use: a successful redeem deletes the code.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  if (req.headers.get("x-api-key") !== BOT_KEY) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }

  const { code } = await params;
  const blueprint = redeemClaim(code);
  if (!blueprint) {
    return NextResponse.json(
      { ok: false, error: "That code is invalid or has expired. Generate a new one on the site." },
      { status: 404, headers: NO_STORE }
    );
  }

  return NextResponse.json({ ok: true, blueprint }, { headers: NO_STORE });
}
