"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, RefreshCw, CandlestickChart } from "lucide-react";
import { GuildLabsLogo } from "@/components/logo";
import { DiscordIcon } from "@/components/icons/discord";
import type {
  IChartApi,
  ISeriesApi,
  CandlestickData,
  Time,
} from "lightweight-charts";

// ChartIt brand tokens — green = up, red = down (mirrors the bot's chart PNG).
const UP = "#16c784";
const DOWN = "#ea3943";
const UP_GLOW = "rgba(22,199,132,0.35)";

const CHARTIT_CLIENT_ID = "1511281770820145182";
const INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${CHARTIT_CLIENT_ID}&permissions=274877992960&scope=bot+applications.commands`;

const RANGES = [
  { key: "1d", short: "1D" },
  { key: "5d", short: "5D" },
  { key: "1mo", short: "1M" },
  { key: "6mo", short: "6M" },
  { key: "1y", short: "1Y" },
  { key: "ytd", short: "YTD" },
] as const;

type RangeKey = (typeof RANGES)[number]["key"];

// Polling cadence for the live feel. 10s is the sweet spot: noticeably alive
// without hammering the data API. The page also pauses polling when the tab is
// hidden (see load() guard) so background tabs aren't burning quota.
const REFRESH_MS = 10_000;

// How long the price + change text stays tinted after an up/down tick.
const FLASH_MS = 700;

function timeAgo(date: Date | null, nowMs: number): string {
  if (!date) return "—";
  const s = Math.floor((nowMs - date.getTime()) / 1000);
  if (s < 3) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface ChartData {
  symbol: string;
  name: string;
  currency: string;
  exchange: string | null;
  marketState: string | null;
  price: number | null;
  prevClose: number | null;
  change: number | null;
  changePercent: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  volume: number | null;
  range: string;
  interval: string;
  rangeLabel: string;
  candles: Candle[];
}

// ── Formatting helpers ───────────────────────────────────────────────────────
function fmtPrice(n: number | null, currency = "USD") {
  if (n == null) return "—";
  const digits = Math.abs(n) < 1 ? 6 : 2;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: digits,
    minimumFractionDigits: 2,
  }).format(n);
}

function fmtNum(n: number | null) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: Math.abs(n) < 1 ? 6 : 2,
  }).format(n);
}

function fmtCompact(n: number | null) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(n);
}

function marketLabel(state: string | null) {
  switch (state) {
    case "REGULAR":
      return { text: "Open", live: true };
    case "PRE":
    case "PREPRE":
      return { text: "Pre-market", live: true };
    case "POST":
    case "POSTPOST":
      return { text: "After hours", live: true };
    case "CLOSED":
      return { text: "Closed", live: false };
    default:
      return state ? { text: state, live: false } : null;
  }
}

export default function LiveChart({
  symbol,
  initialRange,
}: {
  symbol: string;
  initialRange: RangeKey;
}) {
  const [range, setRange] = React.useState<RangeKey>(initialRange);
  const [data, setData] = React.useState<ChartData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [lastUpdate, setLastUpdate] = React.useState<Date | null>(null);
  const [priceFlash, setPriceFlash] = React.useState<"up" | "down" | null>(null);
  // re-render the "updated Xs ago" label once per second
  const [tickNow, setTickNow] = React.useState(() => Date.now());

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const chartRef = React.useRef<IChartApi | null>(null);
  const seriesRef = React.useRef<ISeriesApi<"Candlestick"> | null>(null);
  const flashTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch data on range change + on a refresh interval ─────────────────────
  const load = React.useCallback(
    async (r: RangeKey, soft: boolean) => {
      soft ? setRefreshing(true) : setLoading(true);
      try {
        const res = await fetch(
          `/api/chart/${encodeURIComponent(symbol)}?range=${r}`,
          { cache: "no-store" }
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Couldn't load that ticker.");
        setData(json as ChartData);
        setLastUpdate(new Date());
        setError(null);
      } catch (err) {
        if (!soft) setData(null);
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [symbol]
  );

  React.useEffect(() => {
    load(range, false);
  }, [range, load]);

  React.useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") load(range, true);
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [range, load]);

  // Tick the "updated Xs ago" label once per second. Cheap (single state set);
  // browsers throttle setInterval in backgrounded tabs, so this idles naturally.
  React.useEffect(() => {
    const id = setInterval(() => setTickNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // ── Create the lightweight-charts instance once, on mount ──────────────────
  React.useEffect(() => {
    let disposed = false;
    let resizeObserver: ResizeObserver | undefined;

    (async () => {
      const lwc = await import("lightweight-charts");
      if (disposed || !containerRef.current) return;

      const chart = lwc.createChart(containerRef.current, {
        autoSize: true,
        layout: {
          background: { type: lwc.ColorType.Solid, color: "transparent" },
          textColor: "rgba(255,255,255,0.5)",
          fontSize: 12,
          fontFamily:
            "var(--font-mono), ui-monospace, SFMono-Regular, monospace",
        },
        grid: {
          vertLines: { color: "rgba(255,255,255,0.04)" },
          horzLines: { color: "rgba(255,255,255,0.05)" },
        },
        rightPriceScale: { borderColor: "rgba(255,255,255,0.08)" },
        timeScale: {
          borderColor: "rgba(255,255,255,0.08)",
          secondsVisible: false,
          fixLeftEdge: true,
          fixRightEdge: true,
        },
        crosshair: {
          mode: lwc.CrosshairMode.Magnet,
          vertLine: { color: "rgba(255,255,255,0.25)", labelBackgroundColor: "#27272a" },
          horzLine: { color: "rgba(255,255,255,0.25)", labelBackgroundColor: "#27272a" },
        },
      });

      const series = chart.addCandlestickSeries({
        upColor: UP,
        downColor: DOWN,
        borderUpColor: UP,
        borderDownColor: DOWN,
        wickUpColor: UP,
        wickDownColor: DOWN,
      });

      chartRef.current = chart;
      seriesRef.current = series;

      // Re-apply data already loaded before the chart finished mounting.
      if (dataRef.current) applyData(dataRef.current, true);
    })();

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      chartRef.current?.remove();
      chartRef.current = null;
      seriesRef.current = null;
      // Force a fresh setData() on the next mount's empty series.
      lastBarTimeRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep a ref to the latest data so the async chart-init can paint it.
  const dataRef = React.useRef<ChartData | null>(null);
  const prevPriceRef = React.useRef<number | null>(null);
  // The last range we fit-to-content for. Pure polling ticks must NOT refit —
  // that would visually jump the chart on every refresh.
  const lastFitRangeRef = React.useRef<string | null>(null);
  // Timestamp of the last bar handed to the series. Lets live ticks update only
  // the forming candle via series.update() instead of replacing the whole set.
  const lastBarTimeRef = React.useRef<number | null>(null);

  const applyData = React.useCallback((d: ChartData, fit: boolean) => {
    const series = seriesRef.current;
    const chart = chartRef.current;
    if (!series || !chart) return;

    const intraday = d.interval.endsWith("m") || d.interval.endsWith("h");
    chart.applyOptions({ timeScale: { timeVisible: intraday } });

    const next: CandlestickData[] = d.candles.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    if (next.length === 0) return;

    // First paint / range change: bulk-load + fit once. setData is the correct
    // call for a full dataset (TradingView pattern: setData for bulk, update for
    // live). lastBarTimeRef === null also forces this path on a fresh series.
    if (fit || lastBarTimeRef.current === null) {
      series.setData(next);
      chart.timeScale().fitContent();
      lastBarTimeRef.current = next[next.length - 1].time as number;
      return;
    }

    // Live tick: NEVER replace the whole series — that flickers and re-runs the
    // price-scale autoscale every poll (the "terrible movement"). Only update
    // the forming bar and append any genuinely new bars. update() requires
    // non-decreasing times, so iterate from the last applied bar forward.
    const lastApplied = lastBarTimeRef.current;
    for (const bar of next) {
      if ((bar.time as number) >= lastApplied) series.update(bar);
    }
    lastBarTimeRef.current = next[next.length - 1].time as number;
  }, []);

  React.useEffect(() => {
    dataRef.current = data;
    if (!data) return;

    // Detect a price tick → flash the price + change text for FLASH_MS.
    const prev = prevPriceRef.current;
    if (prev != null && data.price != null && prev !== data.price) {
      setPriceFlash(data.price > prev ? "up" : "down");
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => setPriceFlash(null), FLASH_MS);
    }
    if (data.price != null) prevPriceRef.current = data.price;

    // Fit only on first paint + range change; live ticks keep the view stable.
    const fit = lastFitRangeRef.current !== data.range;
    lastFitRangeRef.current = data.range;
    applyData(data, fit);
  }, [data, applyData]);

  const up = (data?.change ?? 0) >= 0;
  const accent = up ? UP : DOWN;
  const market = marketLabel(data?.marketState ?? null);

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="border-b border-card-border px-5 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/bots/chartit" aria-label="ChartIt">
            <GuildLabsLogo className="h-8 w-auto" />
          </Link>
          <a
            href={INVITE_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 font-display text-sm font-bold text-black transition-all hover:brightness-110 active:scale-[0.98]"
            style={{ backgroundColor: UP, boxShadow: `0 14px 32px -14px ${UP_GLOW}` }}
          >
            <DiscordIcon className="size-4" color="currentColor" />
            Add ChartIt
          </a>
        </div>
      </header>

      <section className="relative overflow-hidden px-5 py-8 sm:py-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-64"
          style={{
            background: `radial-gradient(60% 100% at 50% 0%, ${
              up ? UP_GLOW : "rgba(234,57,67,0.25)"
            }, transparent 70%)`,
            opacity: 0.35,
          }}
        />

        <div className="relative mx-auto max-w-4xl">
          {/* ── Quote header ──────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <CandlestickChart className="size-4" style={{ color: UP }} />
                <span className="font-mono font-semibold tracking-wide">
                  {data?.symbol ?? symbol}
                </span>
                {data?.exchange && (
                  <span className="text-muted-foreground/70">· {data.exchange}</span>
                )}
                {market && (
                  <span
                    className="ml-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest"
                    style={
                      market.live
                        ? { background: "rgba(22,199,132,0.15)", color: UP }
                        : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)" }
                    }
                  >
                    <span
                      className="size-1.5 rounded-full"
                      style={
                        market.live
                          ? {
                              background: UP,
                              boxShadow: `0 0 0 0 ${UP}`,
                              animation: "pulse-glow 1.6s ease-in-out infinite",
                            }
                          : { background: "rgba(255,255,255,0.4)" }
                      }
                    />
                    {market.live ? "LIVE" : market.text}
                  </span>
                )}
              </div>
              <h1 className="mt-1 font-display text-2xl font-black tracking-tight sm:text-3xl">
                {data?.name ?? "Loading…"}
              </h1>
            </div>

            <div className="text-right">
              <div
                className="font-display text-3xl font-black tabular-nums transition-colors duration-300 sm:text-4xl"
                style={{
                  color:
                    priceFlash === "up"
                      ? UP
                      : priceFlash === "down"
                      ? DOWN
                      : undefined,
                }}
              >
                {loading && !data ? "—" : fmtPrice(data?.price ?? null, data?.currency)}
              </div>
              {data && data.change != null && (
                <div
                  className="mt-1 font-mono text-sm font-bold tabular-nums transition-colors duration-300"
                  style={{
                    color: priceFlash === "up" ? UP : priceFlash === "down" ? DOWN : accent,
                  }}
                >
                  {up ? "▲" : "▼"} {fmtNum(Math.abs(data.change))}
                  {data.changePercent != null &&
                    ` (${up ? "+" : ""}${data.changePercent.toFixed(2)}%)`}
                </div>
              )}
            </div>
          </div>

          {/* ── Range tabs + live status ──────────────────────────────────── */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-full border border-card-border bg-card p-1">
              {RANGES.map((r) => {
                const active = r.key === range;
                return (
                  <button
                    key={r.key}
                    onClick={() => setRange(r.key)}
                    className="rounded-full px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-colors"
                    style={
                      active
                        ? { background: UP, color: "#000" }
                        : { color: "var(--muted-foreground)" }
                    }
                    aria-pressed={active}
                  >
                    {r.short}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
              {refreshing ? (
                <span className="inline-flex items-center gap-1.5">
                  <RefreshCw className="size-3.5 animate-spin" />
                  updating…
                </span>
              ) : (
                lastUpdate && <span>updated {timeAgo(lastUpdate, tickNow)}</span>
              )}
            </div>
          </div>

          {/* ── Chart card ────────────────────────────────────────────────── */}
          <div
            className="relative mt-4 overflow-hidden rounded-3xl border p-3 sm:p-4"
            style={{
              background: "#0a0a0c",
              borderColor: "rgba(255,255,255,0.08)",
              boxShadow: `0 30px 80px -40px ${up ? UP_GLOW : "rgba(234,57,67,0.3)"}`,
            }}
          >
            <div
              ref={containerRef}
              className="h-[320px] w-full sm:h-[420px]"
            />

            {/* Loading / error overlays */}
            {loading && !data && (
              <div className="absolute inset-0 grid place-items-center bg-[#0a0a0c]">
                <div className="flex flex-col items-center gap-3 text-white/50">
                  <RefreshCw className="size-6 animate-spin" style={{ color: UP }} />
                  <span className="font-mono text-xs">Loading {symbol}…</span>
                </div>
              </div>
            )}
            {error && !data && (
              <div className="absolute inset-0 grid place-items-center bg-[#0a0a0c] px-6 text-center">
                <div className="max-w-sm">
                  <div className="font-display text-lg font-bold text-white">
                    Couldn&apos;t load that chart
                  </div>
                  <p className="mt-2 text-sm text-white/55">{error}</p>
                  <button
                    onClick={() => load(range, false)}
                    className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 font-mono text-xs font-bold text-black"
                    style={{ background: UP }}
                  >
                    <RefreshCw className="size-3.5" /> Try again
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Stat strip ────────────────────────────────────────────────── */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Prev close" value={fmtPrice(data?.prevClose ?? null, data?.currency)} />
            <Stat
              label="Day range"
              value={
                data?.dayLow != null && data?.dayHigh != null
                  ? `${fmtNum(data.dayLow)} – ${fmtNum(data.dayHigh)}`
                  : "—"
              }
            />
            <Stat label="Volume" value={fmtCompact(data?.volume ?? null)} />
            <Stat label="Range" value={data?.rangeLabel ?? RANGES.find((r) => r.key === range)?.short ?? "—"} />
          </div>

          {/* ── Footer / disclaimer + CTA ─────────────────────────────────── */}
          <div className="mt-8 flex flex-col items-center gap-4 border-t border-card-border pt-6 text-center">
            <p className="max-w-xl font-mono text-[11px] leading-relaxed text-muted-foreground">
              Data via Yahoo Finance · may be delayed · informational only,{" "}
              <span className="font-semibold">not financial advice</span>. ChartIt
              displays public market data and never places trades.
            </p>
            <a
              href={INVITE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-display text-sm font-bold text-black transition-all hover:brightness-110 active:scale-[0.98]"
              style={{ backgroundColor: UP, boxShadow: `0 14px 32px -14px ${UP_GLOW}` }}
            >
              <DiscordIcon className="size-4" color="currentColor" />
              Chart any ticker in your server
              <ArrowUpRight className="size-4" />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-card-border bg-card px-4 py-3">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-mono text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}
