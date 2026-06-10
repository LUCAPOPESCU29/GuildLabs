"use client";

import * as React from "react";
import { ArrowUpRight, Newspaper } from "lucide-react";
import type { ChartData } from "@/lib/market-data";
import { getTicker, tickerSlug } from "@/lib/seo-data/tickers";
import { CHARTIT_INVITE, CHARTIT_INVITE_EXTERNAL } from "@/lib/links";

type NewsItem = { title: string; publisher: string; link: string; publishedAt: number | null };

function fmt(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  const abs = Math.abs(n);
  if (abs !== 0 && abs < 1) return n.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function compact(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(n);
}

/** % change of last close vs the close ~`days` ago (from the candle series). */
function perf(candles: { time: number; close: number }[], days: number): number | null {
  if (candles.length < 2) return null;
  const last = candles[candles.length - 1];
  const cutoff = last.time - days * 86_400;
  let base = candles[0].close;
  for (const c of candles) {
    if (c.time <= cutoff) base = c.close;
    else break;
  }
  return base ? (last.close / base - 1) * 100 : null;
}
function perfYTD(candles: { time: number; close: number }[]): number | null {
  if (candles.length < 2) return null;
  const jan1 = Math.floor(Date.UTC(new Date().getUTCFullYear(), 0, 1) / 1000);
  const first = candles.find((c) => c.time >= jan1);
  const base = first?.close ?? candles[0].close;
  const last = candles[candles.length - 1].close;
  return base ? (last / base - 1) * 100 : null;
}

const MARKET_STATE: Record<string, { label: string; cls: string }> = {
  REGULAR: { label: "Market open", cls: "text-success" },
  CLOSED: { label: "Market closed", cls: "text-muted-foreground" },
  PRE: { label: "Pre-market", cls: "text-accent" },
  PREPRE: { label: "Pre-market", cls: "text-accent" },
  POST: { label: "After hours", cls: "text-accent" },
  POSTPOST: { label: "After hours", cls: "text-accent" },
};

export function DetailsTab({ symbol }: { symbol: string }) {
  const [data, setData] = React.useState<ChartData | null>(null);
  const [news, setNews] = React.useState<NewsItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setData(null);
    fetch(`/api/chart/${encodeURIComponent(symbol)}?range=1y`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => active && setLoading(false));
    fetch(`/api/news/${encodeURIComponent(symbol)}`)
      .then((r) => (r.ok ? r.json() : { news: [] }))
      .then((d) => active && setNews(Array.isArray(d?.news) ? d.news : []))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [symbol]);

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="glass h-20 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }
  if (!data) {
    return <div className="p-4 text-sm text-muted-foreground">Couldn&apos;t load details for {symbol}.</div>;
  }

  const up = (data.changePercent ?? 0) >= 0;
  const ms = data.marketState ? MARKET_STATE[data.marketState] : null;
  const candles = data.candles ?? [];
  const ticker = getTicker(tickerSlug(symbol));

  const perfs: { label: string; v: number | null }[] = [
    { label: "1W", v: perf(candles, 7) },
    { label: "1M", v: perf(candles, 30) },
    { label: "3M", v: perf(candles, 90) },
    { label: "6M", v: perf(candles, 180) },
    { label: "YTD", v: perfYTD(candles) },
    { label: "1Y", v: perf(candles, 365) },
  ];

  const stats: { label: string; value: string }[] = [
    { label: "Open", value: candles.length ? fmt(candles[candles.length - 1].open ?? undefined) : "—" },
    { label: "Prev close", value: fmt(data.prevClose) },
    { label: "Day high", value: fmt(data.dayHigh) },
    { label: "Day low", value: fmt(data.dayLow) },
    { label: "Volume", value: compact(data.volume) },
    { label: "Currency", value: data.currency || "USD" },
  ];

  return (
    <div className="space-y-5 overflow-y-auto p-4">
      {/* Price header */}
      <div>
        <div className="font-display text-lg font-black">{data.name || symbol}</div>
        <div className="text-xs text-muted-foreground">
          {symbol}
          {data.exchange ? ` · ${data.exchange}` : ""}
        </div>
        <div className="mt-3 flex items-baseline gap-3">
          <span className="font-display text-3xl font-black">{fmt(data.price)}</span>
          <span className="text-xs text-muted-foreground">{data.currency}</span>
        </div>
        <div className={`mt-1 font-mono text-sm font-semibold ${up ? "text-success" : "text-coral"}`}>
          {up ? "▲" : "▼"} {data.change != null ? fmt(Math.abs(data.change)) : "—"}{" "}
          {data.changePercent != null ? `(${up ? "+" : ""}${data.changePercent.toFixed(2)}%)` : ""}
        </div>
        {ms && (
          <div className={`mt-2 inline-flex items-center gap-1.5 text-xs font-medium ${ms.cls}`}>
            <span className="size-1.5 rounded-full bg-current" /> {ms.label}
          </div>
        )}
      </div>

      {/* Performance strip */}
      <div>
        <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Performance</div>
        <div className="grid grid-cols-3 gap-1.5">
          {perfs.map((p) => {
            const pu = (p.v ?? 0) >= 0;
            return (
              <div
                key={p.label}
                className={`rounded-xl border p-2 text-center ${
                  p.v == null
                    ? "border-card-border"
                    : pu
                      ? "border-success/20 bg-success/10"
                      : "border-coral/20 bg-coral/10"
                }`}
              >
                <div className="text-[10px] text-muted-foreground">{p.label}</div>
                <div className={`font-mono text-xs font-bold ${p.v == null ? "text-muted-foreground" : pu ? "text-success" : "text-coral"}`}>
                  {p.v == null ? "—" : `${pu ? "+" : ""}${p.v.toFixed(2)}%`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Key stats */}
      <div>
        <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Key stats</div>
        <div className="grid grid-cols-2 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-card-border px-3 py-2">
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
              <div className="font-mono text-sm">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* News */}
      <div>
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          <Newspaper className="size-3" /> Latest news
        </div>
        {news.length === 0 ? (
          <p className="text-xs text-muted-foreground">No recent headlines.</p>
        ) : (
          <ul className="space-y-2">
            {news.slice(0, 5).map((n, i) => (
              <li key={i}>
                <a href={n.link} target="_blank" rel="noreferrer" className="block rounded-lg p-2 transition-colors hover:bg-muted">
                  <div className="text-xs font-medium leading-snug">{n.title.replace(/[[\]]/g, "")}</div>
                  {n.publisher && <div className="mt-0.5 text-[10px] text-muted-foreground">{n.publisher}</div>}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* About + CTA */}
      {ticker?.blurb && (
        <div>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">About</div>
          <p className="text-xs leading-relaxed text-muted-foreground">{ticker.blurb}</p>
        </div>
      )}
      <a
        href={CHARTIT_INVITE}
        {...(CHARTIT_INVITE_EXTERNAL ? { target: "_blank", rel: "noreferrer" } : {})}
        className="flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2.5 font-display text-sm font-bold text-primary-foreground transition-all hover:brightness-110"
      >
        Add ChartIt to Discord {CHARTIT_INVITE_EXTERNAL && <ArrowUpRight className="size-4" />}
      </a>
    </div>
  );
}
