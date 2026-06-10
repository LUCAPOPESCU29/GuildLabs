import { NextRequest, NextResponse } from "next/server";
import { getQuotes } from "@/lib/market-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lightweight batch quotes for the watchlist: GET /api/quote?symbols=AAPL,BTC-USD
 * Returns { quotes: QuoteLite[] }. Never the heavy chart payload. Capped to keep
 * upstream load sane; missing symbols are simply omitted.
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("symbols") || "";
  const symbols = raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 50);

  if (symbols.length === 0) {
    return NextResponse.json({ quotes: [] });
  }

  const quotes = await getQuotes(symbols);
  return NextResponse.json(
    { quotes },
    { headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=20" } }
  );
}
