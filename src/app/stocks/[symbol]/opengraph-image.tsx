import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";
import { TICKERS, getTicker, tickerSlug } from "@/lib/seo-data/tickers";

export const runtime = "nodejs";
export const alt = "Live ticker chart for Discord";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return TICKERS.map((t) => ({ symbol: tickerSlug(t.symbol) }));
}

export default async function Image({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const t = getTicker(symbol);
  return ogCard({
    eyebrow: "Live chart for Discord",
    title: t ? `${t.symbol}` : symbol.toUpperCase(),
    subtitle: t ? `${t.name} — chart, quote & alerts with ChartIt` : "Chart, quote & alerts with ChartIt",
  });
}
