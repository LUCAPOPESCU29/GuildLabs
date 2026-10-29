import { NextRequest, NextResponse } from "next/server";
import { CHANGELOG, type BotTag } from "@/lib/seo-data/changelog";

export const runtime = "nodejs";

/**
 * Public changelog as JSON, so the Discord bots can render the same entries the
 * site shows without duplicating the content. One source of truth: edit
 * `seo-data/changelog.ts` and both surfaces update.
 *
 * ?bot=Construct  filters to that bot (Platform entries always included)
 * ?limit=3        caps the number returned
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bot = searchParams.get("bot") as BotTag | null;
  const limit = Math.min(20, Math.max(1, Number(searchParams.get("limit")) || 5));

  const entries = CHANGELOG.filter(
    (e) => !bot || e.bot === bot || e.bot === "Platform"
  ).slice(0, limit);

  return NextResponse.json(
    { entries },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } }
  );
}
