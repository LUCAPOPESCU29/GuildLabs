import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 300; // headlines move slowly

const HOSTS = ["https://query1.finance.yahoo.com", "https://query2.finance.yahoo.com"];
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

type Item = { title: string; publisher: string; link: string; publishedAt: number | null };

async function fetchNews(symbol: string, count: number): Promise<Item[]> {
  const qs = new URLSearchParams({
    q: symbol,
    newsCount: String(count),
    quotesCount: "0",
    enableFuzzyQuery: "false",
  });
  for (const host of HOSTS) {
    try {
      const res = await fetch(`${host}/v1/finance/search?${qs}`, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) continue;
      const json = (await res.json()) as { news?: Array<Record<string, unknown>> };
      const items = Array.isArray(json?.news) ? json.news : [];
      return items
        .filter((n) => n?.title && n?.link)
        .slice(0, count)
        .map((n) => ({
          title: String(n.title),
          publisher: n.publisher ? String(n.publisher) : "",
          link: String(n.link),
          publishedAt:
            typeof n.providerPublishTime === "number" ? (n.providerPublishTime as number) * 1000 : null,
        }));
    } catch {
      // try the next host
    }
  }
  return [];
}

export async function GET(_req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const sym = decodeURIComponent(symbol || "").trim().toUpperCase();
  if (!sym) return NextResponse.json({ news: [] });
  const news = await fetchNews(sym, 5);
  return NextResponse.json(
    { news },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
  );
}
