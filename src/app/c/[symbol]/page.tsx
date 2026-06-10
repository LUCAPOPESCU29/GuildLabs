import type { Metadata } from "next";
import LiveChart from "./_live-chart";
import { WatchlistPanel } from "@/components/chart/watchlist-panel";
import { isRange, DEFAULT_RANGE, type Range } from "@/lib/market-data";

interface PageProps {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ range?: string }>;
}

function cleanSymbol(raw: string) {
  return decodeURIComponent(raw || "").trim().toUpperCase();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { symbol } = await params;
  const sym = cleanSymbol(symbol);
  const title = `${sym} live chart`;
  const description = `Live ${sym} candlestick chart and quote — price, change, day range and volume. Powered by ChartIt. Informational only, not financial advice.`;
  return {
    title,
    description,
    alternates: { canonical: `/c/${encodeURIComponent(sym)}` },
    openGraph: {
      title: `${title} | ChartIt`,
      description,
      url: `https://www.guildlabs.fun/c/${encodeURIComponent(sym)}`,
      // OG image is generated per-symbol by ./opengraph-image.tsx (ticker +
      // live price). Omitting an explicit `images` here lets that file-based
      // convention supply the unfurl image instead of the static fallback.
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ChartIt`,
      description,
    },
    // Per-symbol pages are interactive views, not crawlable content.
    robots: { index: false, follow: true },
  };
}

export default async function ChartPage({ params, searchParams }: PageProps) {
  const { symbol } = await params;
  const { range } = await searchParams;
  const sym = cleanSymbol(symbol);
  const initialRange: Range = isRange(range) ? range : DEFAULT_RANGE;

  return (
    <>
      <LiveChart symbol={sym} initialRange={initialRange} />
      <WatchlistPanel currentSymbol={sym} />
    </>
  );
}
