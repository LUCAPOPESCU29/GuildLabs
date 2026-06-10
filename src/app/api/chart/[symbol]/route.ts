import { NextRequest, NextResponse } from "next/server";
import { getChartData, isRange, DEFAULT_RANGE } from "@/lib/market-data";

// Live data — never cache at the framework level (we set our own headers).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const raw = decodeURIComponent(symbol || "").trim().toUpperCase();
  if (!raw) {
    return NextResponse.json({ error: "Missing symbol." }, { status: 400 });
  }

  const rangeParam = req.nextUrl.searchParams.get("range");
  const range = isRange(rangeParam) ? rangeParam : DEFAULT_RANGE;

  try {
    const data = await getChartData(raw, range);
    return NextResponse.json(data, {
      headers: {
        // Edge/CDN may serve a 15s-old copy while revalidating — keeps the
        // page snappy and gentle on Yahoo without feeling stale.
        "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Couldn't load that ticker.";
    return NextResponse.json(
      {
        error: `No data for "${raw}". Check the ticker (e.g. AAPL, MSFT, BTC-USD) — the source may also be briefly rate-limited.`,
        detail: message,
      },
      { status: 502 }
    );
  }
}
