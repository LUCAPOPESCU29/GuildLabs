"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  RefreshCw,
  CandlestickChart,
  AreaChart,
  BarChart3,
  Search,
} from "lucide-react";
import { GuildLabsLogo } from "@/components/logo";
import { DiscordIcon } from "@/components/icons/discord";
import CandleChart, {
  MA_COLORS,
  type ChartType,
  type PriceScale,
  type Indicator,
} from "./_candle-chart";

// Moving averages the page offers as toggleable overlays.
const MA_OPTIONS = [20, 50] as const;

// Price-axis scale options shown in the segmented control.
const SCALE_OPTIONS: ReadonlyArray<{ key: PriceScale; label: string }> = [
  { key: "linear", label: "Lin" },
  { key: "log", label: "Log" },
  { key: "percent", label: "%" },
];

// Oscillator sub-panel options.
const INDICATOR_OPTIONS: ReadonlyArray<{ key: Indicator; label: string }> = [
  { key: "none", label: "None" },
  { key: "rsi", label: "RSI" },
  { key: "macd", label: "MACD" },
];

// Purple + green chart theme, drawn from the FORGE design tokens so the page
// shares the site's palette and tracks light/dark automatically: green
// (`--success`) for gains, violet (`--secondary`) for losses.
const UP = "var(--success)";
const DOWN = "var(--secondary)";
const UP_GLOW = "color-mix(in oklab, var(--success) 38%, transparent)";
const DOWN_GLOW = "color-mix(in oklab, var(--secondary) 32%, transparent)";

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

// Intraday ranges. Yahoo only serves these from non-datacenter IPs, so they
// 429 from Vercel/Railway for stocks; crypto still works via CoinGecko's free
// OHLC endpoint. We therefore offer 1D/5D only for crypto pairs and hide them
// for stocks (whose intraday would otherwise just error out).
const INTRADAY_RANGES = new Set<RangeKey>(["1d", "5d"]);

// Crypto detection mirrored from the bot's CoinGecko provider (coingecko.js):
// a known base paired with a supported quote currency. Kept in sync by hand —
// it's a small, slow-moving list.
const CRYPTO_BASES = new Set([
  "BTC", "ETH", "SOL", "XRP", "ADA", "DOGE", "DOT", "LTC", "BCH", "LINK",
  "MATIC", "AVAX", "UNI", "ATOM", "XLM", "ALGO", "VET", "FIL", "TRX", "ETC",
  "BNB", "SHIB", "NEAR", "APT", "ARB", "OP", "SUI", "PEPE", "INJ", "RNDR",
  "TON", "USDT", "USDC",
]);
const CRYPTO_VS = new Set(["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "BTC", "ETH"]);
const CRYPTO_PAIR_RE = /^([A-Z0-9]{2,10})-([A-Z]{3,4})$/;

function isCryptoSymbol(sym: string): boolean {
  const m = sym.toUpperCase().match(CRYPTO_PAIR_RE);
  return !!m && CRYPTO_BASES.has(m[1]) && CRYPTO_VS.has(m[2]);
}

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
  volume?: number | null;
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
  // First candle the user asked to see; the array may start earlier (warmup bars
  // so indicators are defined across the visible window). Undefined = no warmup.
  displayStartTime?: number;
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

// ── Candle-close countdown (TradingView-style) ───────────────────────────────
function nowInET(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
}

function intervalToMs(interval: string): number | null {
  const m = interval.match(/^(\d+)m$/);
  if (m) return parseInt(m[1], 10) * 60_000;
  const h = interval.match(/^(\d+)h$/);
  if (h) return parseInt(h[1], 10) * 3_600_000;
  return null;
}

/** Milliseconds until the current candle closes, or null when not applicable. */
function msUntilClose(d: ChartData, nowMs: number): number | null {
  const last = d.candles[d.candles.length - 1];
  if (!last) return null;

  const stepMs = intervalToMs(d.interval);
  if (stepMs != null) {
    // Intraday: roll the fixed-width boundary forward from the last candle's
    // open so the timer keeps ticking even if the 10s poll briefly lags.
    let closeMs = last.time * 1000 + stepMs;
    while (closeMs <= nowMs) closeMs += stepMs;
    return closeMs - nowMs;
  }

  if (d.interval === "1d") {
    const et = nowInET();
    const close = new Date(et);
    close.setHours(16, 0, 0, 0); // 4 PM ET (NYSE close)
    const ms = close.getTime() - et.getTime();
    return ms > 0 ? ms : null;
  }

  if (d.interval === "1wk") {
    const et = nowInET();
    const daysToFri = (5 - et.getDay() + 7) % 7; // 0 when today IS Friday
    const close = new Date(et);
    close.setDate(et.getDate() + daysToFri);
    close.setHours(16, 0, 0, 0);
    let ms = close.getTime() - et.getTime();
    if (ms <= 0) {
      close.setDate(close.getDate() + 7);
      ms = close.getTime() - et.getTime();
    }
    return ms;
  }

  return null;
}

function fmtCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

export default function LiveChart({
  symbol,
  initialRange,
}: {
  symbol: string;
  initialRange: RangeKey;
}) {
  const router = useRouter();
  // Stocks have no working intraday (Yahoo 429s datacenter IPs), so only crypto
  // gets the 1D/5D tabs; everything else starts on (and is limited to) daily+.
  const crypto = isCryptoSymbol(symbol);
  const visibleRanges = crypto ? RANGES : RANGES.filter((r) => !INTRADAY_RANGES.has(r.key));
  const [range, setRange] = React.useState<RangeKey>(() =>
    !crypto && INTRADAY_RANGES.has(initialRange) ? "1mo" : initialRange
  );
  const [data, setData] = React.useState<ChartData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [lastUpdate, setLastUpdate] = React.useState<Date | null>(null);
  const [priceFlash, setPriceFlash] = React.useState<"up" | "down" | null>(null);
  // re-render the "updated Xs ago" label + candle-close countdown once per second
  const [tickNow, setTickNow] = React.useState(() => Date.now());

  // ── Chart display controls ──
  const [chartType, setChartType] = React.useState<ChartType>("candles");
  const [showVolume, setShowVolume] = React.useState(true);
  const [mas, setMas] = React.useState<number[]>([]); // active SMA periods, ascending
  const [priceScale, setPriceScale] = React.useState<PriceScale>("linear");
  const [indicator, setIndicator] = React.useState<Indicator>("none");
  const [searchValue, setSearchValue] = React.useState("");

  const prevPriceRef = React.useRef<number | null>(null);
  const flashTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleMa = React.useCallback((period: number) => {
    setMas((prev) =>
      prev.includes(period)
        ? prev.filter((p) => p !== period)
        : [...prev, period].sort((a, b) => a - b)
    );
  }, []);

  const onSearch = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const sym = searchValue.trim().toUpperCase();
      if (sym) router.push(`/c/${encodeURIComponent(sym)}`);
    },
    [router, searchValue]
  );

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

  // ── Price flash on tick ────────────────────────────────────────────────────
  // The CandleChart owns all rendering; here we only watch the price for the
  // up/down color flash on the big quote number.
  React.useEffect(() => {
    if (!data) return;
    const prev = prevPriceRef.current;
    if (prev != null && data.price != null && prev !== data.price) {
      setPriceFlash(data.price > prev ? "up" : "down");
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => setPriceFlash(null), FLASH_MS);
    }
    if (data.price != null) prevPriceRef.current = data.price;
  }, [data]);

  const up = (data?.change ?? 0) >= 0;
  const accent = up ? UP : DOWN;
  const market = marketLabel(data?.marketState ?? null);

  // Candle-close countdown. Computed inline (re-derived each second via tickNow)
  // and shown in a fixed chart corner — NO timeToCoordinate tracking, which kept
  // forcing re-renders + autoscale churn against the chart's own pan/zoom.
  const cdMs = data && market?.live ? msUntilClose(data, tickNow) : null;
  const countdownText = cdMs != null ? fmtCountdown(cdMs) : null;

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
              up ? UP_GLOW : DOWN_GLOW
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
                        ? { background: "color-mix(in oklab, var(--success) 16%, transparent)", color: UP }
                        : { background: "var(--muted)", color: "var(--muted-foreground)" }
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
                          : { background: "var(--muted-foreground)" }
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
              {visibleRanges.map((r) => {
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

          {/* ── Chart controls: type · volume · MAs · search ──────────────── */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Candles ↔ Area */}
              <div className="inline-flex rounded-full border border-card-border bg-card p-1">
                {([
                  ["candles", "Candles", CandlestickChart],
                  ["area", "Area", AreaChart],
                ] as const).map(([key, label, Icon]) => {
                  const active = chartType === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setChartType(key)}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-colors"
                      style={
                        active
                          ? { background: UP, color: "#000" }
                          : { color: "var(--muted-foreground)" }
                      }
                      aria-pressed={active}
                    >
                      <Icon className="size-3.5" />
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Volume toggle */}
              <button
                onClick={() => setShowVolume((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-full border border-card-border px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-colors"
                style={
                  showVolume
                    ? { background: UP, color: "#000", borderColor: "transparent" }
                    : { background: "var(--card)", color: "var(--muted-foreground)" }
                }
                aria-pressed={showVolume}
              >
                <BarChart3 className="size-3.5" />
                Vol
              </button>

              {/* Moving-average pills */}
              {MA_OPTIONS.map((p) => {
                const active = mas.includes(p);
                const color = MA_COLORS[mas.indexOf(p) % MA_COLORS.length];
                return (
                  <button
                    key={p}
                    onClick={() => toggleMa(p)}
                    className="rounded-full border px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-colors"
                    style={
                      active
                        ? { background: color, color: "#000", borderColor: "transparent" }
                        : {
                            background: "var(--card)",
                            color: "var(--muted-foreground)",
                            borderColor: "var(--card-border)",
                          }
                    }
                    aria-pressed={active}
                  >
                    MA{p}
                  </button>
                );
              })}

              {/* Price scale: linear / log / % */}
              <div className="inline-flex rounded-full border border-card-border bg-card p-1">
                {SCALE_OPTIONS.map((s) => {
                  const active = priceScale === s.key;
                  return (
                    <button
                      key={s.key}
                      onClick={() => setPriceScale(s.key)}
                      className="rounded-full px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-colors"
                      style={
                        active
                          ? { background: UP, color: "#000" }
                          : { color: "var(--muted-foreground)" }
                      }
                      aria-pressed={active}
                      title={`${s.label} price scale`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>

              {/* Oscillator panel: none / RSI / MACD */}
              <div className="inline-flex rounded-full border border-card-border bg-card p-1">
                {INDICATOR_OPTIONS.map((o) => {
                  const active = indicator === o.key;
                  return (
                    <button
                      key={o.key}
                      onClick={() => setIndicator(o.key)}
                      className="rounded-full px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-colors"
                      style={
                        active
                          ? { background: UP, color: "#000" }
                          : { color: "var(--muted-foreground)" }
                      }
                      aria-pressed={active}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ticker search */}
            <form
              onSubmit={onSearch}
              className="inline-flex items-center gap-2 rounded-full border border-card-border bg-card px-3 py-1.5"
            >
              <Search className="size-3.5 text-muted-foreground" />
              <input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search ticker…"
                aria-label="Search ticker"
                spellCheck={false}
                autoCapitalize="characters"
                className="w-28 bg-transparent font-mono text-xs uppercase tracking-wider text-foreground placeholder:text-muted-foreground/60 placeholder:normal-case focus:outline-none"
              />
            </form>
          </div>

          {/* ── Chart card ────────────────────────────────────────────────── */}
          <div
            className="relative mt-4 overflow-hidden rounded-3xl border border-card-border bg-card p-3 sm:p-4"
            style={{
              boxShadow: `var(--card-shadow), 0 40px 90px -50px ${up ? UP_GLOW : DOWN_GLOW}`,
            }}
          >
            <div className="relative h-[320px] w-full sm:h-[420px]">
              {data && (
                <CandleChart
                  candles={data.candles}
                  interval={data.interval}
                  currency={data.currency}
                  range={data.range}
                  chartType={chartType}
                  showVolume={showVolume}
                  mas={mas}
                  priceScale={priceScale}
                  indicator={indicator}
                  displayStartTime={data.displayStartTime}
                  className="absolute inset-0"
                />
              )}
              {countdownText && (
                <div
                  className="pointer-events-none absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-card-border px-2.5 py-1 font-mono text-[10px] font-bold tabular-nums text-foreground"
                  style={{
                    background: "color-mix(in oklab, var(--card) 78%, transparent)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                  }}
                >
                  <span className="text-muted-foreground">CLOSE IN</span>
                  <span style={{ color: "var(--accent)" }}>{countdownText}</span>
                </div>
              )}
            </div>

            {/* Loading / error overlays */}
            {loading && !data && (
              <div className="absolute inset-0 grid place-items-center bg-card">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <RefreshCw className="size-6 animate-spin" style={{ color: UP }} />
                  <span className="font-mono text-xs">Loading {symbol}…</span>
                </div>
              </div>
            )}
            {error && !data && (
              <div className="absolute inset-0 grid place-items-center bg-card px-6 text-center">
                <div className="max-w-sm">
                  <div className="font-display text-lg font-bold text-foreground">
                    Couldn&apos;t load that chart
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{error}</p>
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
