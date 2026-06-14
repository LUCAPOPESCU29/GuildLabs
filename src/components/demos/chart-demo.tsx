"use client";

/**
 * Live "try /chart" widget for the ChartIt page. Hits the same
 * `/api/chart/[symbol]` endpoint that powers the bot, so the demo shows real
 * Yahoo Finance data. Self-contained; accent is passed in so it inherits the
 * host page's color token.
 */

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { LineChart, Loader2, Search, TrendingDown, TrendingUp } from "lucide-react";

type ChartPayload = {
  symbol: string;
  name: string;
  price: number | null;
  changePercent: number | null;
  currency: string;
  closes: number[];
};

const SUGGESTIONS = ["AAPL", "NVDA", "BTC-USD", "TSLA", "ETH-USD", "MSFT"];
const UP = "#16c784";
const DOWN = "#ea3943";

function Sparkline({ closes, up }: { closes: number[]; up: boolean }) {
  const pts = closes.filter((n) => Number.isFinite(n));
  if (pts.length < 2) return null;
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = max - min || 1;
  const W = 600;
  const H = 140;
  const step = W / (pts.length - 1);
  const coords = pts.map((v, i) => [i * step, H - ((v - min) / span) * (H - 12) - 6]);
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  const color = up ? UP : DOWN;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-32 w-full">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-fill)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function ChartDemo({ accent }: { accent: string }) {
  const reduce = useReducedMotion();
  const [ticker, setTicker] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [data, setData] = React.useState<ChartPayload | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const run = React.useCallback(async (raw: string) => {
    const sym = raw.trim().toUpperCase();
    if (!sym || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/chart/${encodeURIComponent(sym)}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error || "Couldn't fetch that ticker. Try AAPL or BTC-USD.");
        setData(null);
      } else {
        setData(json as ChartPayload);
      }
    } catch {
      setError("Network hiccup — try again.");
      setData(null);
    } finally {
      setBusy(false);
    }
  }, [busy]);

  const up = (data?.changePercent ?? 0) >= 0;
  const fmt = (n: number | null, cur: string) =>
    n == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: cur || "USD", maximumFractionDigits: n < 5 ? 4 : 2 }).format(n);

  return (
    <div className="glass-strong mx-auto w-full max-w-xl rounded-3xl p-5 sm:p-6" style={{ ["--demo-accent" as string]: accent }}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
        <LineChart className="size-4" /> Try it live
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(ticker);
        }}
        className="mt-3 flex gap-2"
      >
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground">/chart</span>
          <input
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="AAPL"
            aria-label="Ticker symbol"
            spellCheck={false}
            autoCapitalize="characters"
            className="glass-input w-full rounded-2xl py-3 pl-[4.25rem] pr-3 font-mono text-sm uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <button
          type="submit"
          disabled={busy || !ticker.trim()}
          className="grid size-12 shrink-0 place-items-center rounded-2xl font-semibold text-white transition-opacity disabled:opacity-50 cursor-pointer"
          style={{ background: accent }}
          aria-label="Get chart"
        >
          {busy ? <Loader2 className="size-5 animate-spin" /> : <Search className="size-5" />}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setTicker(s);
              run(s);
            }}
            className="rounded-full border border-card-border bg-muted/40 px-2.5 py-1 font-mono text-xs text-foreground/80 transition-colors hover:border-[var(--demo-accent)]/50 hover:text-foreground cursor-pointer"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Result — a mini Discord-style embed on a fixed-dark surface */}
      {(data || error) && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 overflow-hidden rounded-2xl bg-[#1e1f22] p-4 text-left"
          style={{ borderLeft: `4px solid ${error ? DOWN : up ? UP : DOWN}` }}
        >
          {error ? (
            <p className="text-sm text-[#f2b8b5]">{error}</p>
          ) : data ? (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-display text-base font-bold text-white">{data.name || data.symbol}</div>
                  <div className="font-mono text-xs text-white/50">{data.symbol}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-lg font-bold text-white">{fmt(data.price, data.currency)}</div>
                  {data.changePercent != null && (
                    <div className="inline-flex items-center gap-1 font-mono text-xs font-semibold" style={{ color: up ? UP : DOWN }}>
                      {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                      {up ? "+" : ""}
                      {data.changePercent.toFixed(2)}%
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3">
                <Sparkline closes={data.closes} up={up} />
              </div>
              <p className="mt-2 text-[0.65rem] text-white/40">Data from Yahoo Finance · for information only, not financial advice.</p>
            </>
          ) : null}
        </motion.div>
      )}
    </div>
  );
}
