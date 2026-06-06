"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  RefreshCw,
  CandlestickChart,
  AreaChart,
  Search,
  Share2,
  Check,
  Camera,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Layers,
  GitCompare,
  HelpCircle,
  Table,
} from "lucide-react";
import { GuildLabsLogo } from "@/components/logo";
import { DiscordIcon } from "@/components/icons/discord";
import CandleChart, {
  MA_COLORS,
  DEFAULT_INDICATOR_SETTINGS,
  type ChartType,
  type PriceScale,
  type Indicator,
  type IndicatorSettings,
  type MaType,
  type CandleChartHandle,
} from "./_candle-chart";

const MA_TYPES: ReadonlyArray<{ key: MaType; label: string }> = [
  { key: "sma", label: "SMA" },
  { key: "ema", label: "EMA" },
  { key: "wma", label: "WMA" },
  { key: "hma", label: "HMA" },
  { key: "vwma", label: "VWMA" },
];
// TradingView-parity price overlays toggled in the Indicators popover.
const TV_OVERLAYS = [
  { key: "ichimoku", label: "Ichimoku" },
  { key: "psar", label: "PSAR" },
  { key: "supertrend", label: "Supertrend" },
  { key: "keltner", label: "Keltner" },
  { key: "donchian", label: "Donchian" },
  { key: "linreg", label: "LinReg" },
  { key: "zigzag", label: "ZigZag" },
] as const;
type TvOverlayKey = (typeof TV_OVERLAYS)[number]["key"];

// Moving averages the page offers as toggleable overlays.
const MA_OPTIONS = [20, 50] as const;
const EMA_OPTIONS = [9, 21, 50, 200] as const;

// Editable indicator parameters shown in the settings popover.
const SETTING_FIELDS: ReadonlyArray<{ key: keyof IndicatorSettings; label: string }> = [
  { key: "rsi", label: "RSI" },
  { key: "macdFast", label: "MACD fast" },
  { key: "macdSlow", label: "MACD slow" },
  { key: "macdSignal", label: "MACD signal" },
  { key: "bbPeriod", label: "BB period" },
  { key: "bbMult", label: "BB σ" },
  { key: "stochK", label: "Stoch %K" },
  { key: "stochD", label: "Stoch %D" },
  { key: "atr", label: "ATR" },
  { key: "volMa", label: "Vol MA" },
];

// Price-axis scale options shown in the segmented control.
const SCALE_OPTIONS: ReadonlyArray<{ key: PriceScale; label: string }> = [
  { key: "linear", label: "Lin" },
  { key: "log", label: "Log" },
  { key: "percent", label: "%" },
];

// Oscillator panes (toggleable; up to MAX_PANES stack below the chart).
const INDICATOR_OPTIONS: ReadonlyArray<{ key: Indicator; label: string }> = [
  { key: "rsi", label: "RSI" },
  { key: "macd", label: "MACD" },
  { key: "stoch", label: "Stoch" },
  { key: "atr", label: "ATR" },
  { key: "obv", label: "OBV" },
  { key: "adx", label: "ADX" },
  { key: "cci", label: "CCI" },
  { key: "wpr", label: "%R" },
  { key: "mfi", label: "MFI" },
  { key: "cmf", label: "CMF" },
  { key: "ao", label: "AO" },
  { key: "roc", label: "ROC" },
  { key: "stochrsi", label: "StochRSI" },
  { key: "ad", label: "A/D" },
  { key: "stddev", label: "StdDev" },
  { key: "bbp", label: "Bull/Bear" },
];
const MAX_PANES = 4;

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

// Stocks have working intraday only when a keyed provider is configured server-
// side (Twelve Data). This build-time flag is flipped on once TWELVEDATA_API_KEY
// is live on Vercel, un-hiding the 1D/5D tabs for stocks. Crypto always has
// intraday (CoinGecko/Yahoo) regardless of this flag.
const STOCK_INTRADAY_ENABLED = process.env.NEXT_PUBLIC_STOCK_INTRADAY === "1";

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

// ── Persisted display preferences ────────────────────────────────────────────
// The chart's display settings (type, volume, MAs, scale, indicator) survive
// reloads via localStorage and are encodable in the URL so a chart link opens in
// the exact same state. `range` is NOT stored — it lives in the URL / initialRange.
const PREFS_KEY = "chartit:chart-prefs";

interface ChartPrefs {
  type: ChartType;
  vol: boolean;
  ma: number[];
  scale: PriceScale;
  ind: Indicator[];
  bb: boolean;
  vwap: boolean;
  vp: boolean;
  ema: number[];
  rib: boolean;
  cr: boolean;
  cfg: IndicatorSettings;
  dw: boolean;
  mat: MaType;
  ov: TvOverlayKey[];
  piv: "off" | "std" | "fib";
}

const isMaType = (v: unknown): v is MaType =>
  v === "sma" || v === "ema" || v === "wma" || v === "hma" || v === "vwma";
const isTvOverlay = (v: unknown): v is TvOverlayKey =>
  (TV_OVERLAYS as ReadonlyArray<{ key: string }>).some((o) => o.key === v);
const sanitizeOverlays = (v: unknown): TvOverlayKey[] | undefined =>
  Array.isArray(v) ? [...new Set(v.filter(isTvOverlay))] : undefined;
const isPivot = (v: unknown): v is "off" | "std" | "fib" =>
  v === "off" || v === "std" || v === "fib";

// Validate a partial settings object, keeping only sane positive numbers.
function sanitizeSettings(v: unknown): IndicatorSettings | undefined {
  if (!v || typeof v !== "object") return undefined;
  const raw = v as Record<string, unknown>;
  const out: IndicatorSettings = { ...DEFAULT_INDICATOR_SETTINGS };
  let touched = false;
  for (const k of Object.keys(DEFAULT_INDICATOR_SETTINGS) as (keyof IndicatorSettings)[]) {
    const n = Number(raw[k]);
    if (Number.isFinite(n) && n > 0 && n <= 400) {
      out[k] = n;
      touched = true;
    }
  }
  return touched ? out : undefined;
}

const isChartType = (v: unknown): v is ChartType =>
  v === "candles" || v === "hollow" || v === "heikin" || v === "area" || v === "baseline";
const isPriceScale = (v: unknown): v is PriceScale =>
  v === "linear" || v === "log" || v === "percent";
const isIndicator = (v: unknown): v is Indicator =>
  INDICATOR_OPTIONS.some((o) => o.key === v);

// Accept a list (current) or a single legacy string ("rsi"/"none") and return a
// validated, de-duped, capped indicator array.
function sanitizeIndicators(v: unknown): Indicator[] | undefined {
  if (typeof v === "string") return isIndicator(v) ? [v] : v === "none" ? [] : undefined;
  if (!Array.isArray(v)) return undefined;
  return [...new Set(v.filter(isIndicator))].slice(0, MAX_PANES);
}
// Allow the preset pills plus any custom positive-integer period (added via the
// settings popover); de-duped, capped, sorted.
const sanitizePeriods = (arr: unknown): number[] | undefined => {
  if (!Array.isArray(arr)) return undefined;
  return [
    ...new Set(arr.map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= 400)),
  ]
    .sort((a, b) => a - b)
    .slice(0, 8);
};
const sanitizeMas = sanitizePeriods;
const sanitizeEmas = sanitizePeriods;

// localStorage prefs (validated). Empty when unavailable/corrupt.
function readStoredPrefs(): Partial<ChartPrefs> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as Record<string, unknown>;
    const out: Partial<ChartPrefs> = {};
    if (isChartType(p.type)) out.type = p.type;
    if (typeof p.vol === "boolean") out.vol = p.vol;
    if (isPriceScale(p.scale)) out.scale = p.scale;
    const ind = sanitizeIndicators(p.ind);
    if (ind) out.ind = ind;
    if (typeof p.bb === "boolean") out.bb = p.bb;
    if (typeof p.vwap === "boolean") out.vwap = p.vwap;
    if (typeof p.vp === "boolean") out.vp = p.vp;
    const ema = sanitizeEmas(p.ema);
    if (ema) out.ema = ema;
    if (typeof p.rib === "boolean") out.rib = p.rib;
    if (typeof p.cr === "boolean") out.cr = p.cr;
    const cfg = sanitizeSettings(p.cfg);
    if (cfg) out.cfg = cfg;
    if (typeof p.dw === "boolean") out.dw = p.dw;
    if (isMaType(p.mat)) out.mat = p.mat;
    const ov = sanitizeOverlays(p.ov);
    if (ov) out.ov = ov;
    if (isPivot(p.piv)) out.piv = p.piv;
    const ma = sanitizeMas(p.ma);
    if (ma) out.ma = ma;
    return out;
  } catch {
    return {};
  }
}

// URL query prefs (validated). Take precedence over localStorage when present.
function readUrlPrefs(): Partial<ChartPrefs> {
  if (typeof window === "undefined") return {};
  const q = new URLSearchParams(window.location.search);
  const out: Partial<ChartPrefs> = {};
  const type = q.get("type");
  if (isChartType(type)) out.type = type;
  const vol = q.get("vol");
  if (vol === "0" || vol === "1") out.vol = vol === "1";
  const scale = q.get("scale");
  if (isPriceScale(scale)) out.scale = scale;
  const indRaw = q.get("ind");
  if (indRaw != null) {
    const ind = sanitizeIndicators(indRaw.split(",").map((s) => s.trim()));
    if (ind) out.ind = ind;
  }
  const bb = q.get("bb");
  if (bb === "0" || bb === "1") out.bb = bb === "1";
  const vwap = q.get("vwap");
  if (vwap === "0" || vwap === "1") out.vwap = vwap === "1";
  const vp = q.get("vp");
  if (vp === "0" || vp === "1") out.vp = vp === "1";
  const emaRaw = q.get("ema");
  if (emaRaw != null) {
    const ema = sanitizeEmas(emaRaw.split(",").map((s) => Number(s.trim())));
    if (ema) out.ema = ema;
  }
  const rib = q.get("rib");
  if (rib === "0" || rib === "1") out.rib = rib === "1";
  const cr = q.get("cr");
  if (cr === "0" || cr === "1") out.cr = cr === "1";
  const dw = q.get("dw");
  if (dw === "0" || dw === "1") out.dw = dw === "1";
  const mat = q.get("mat");
  if (isMaType(mat)) out.mat = mat;
  const ovRaw = q.get("ov");
  if (ovRaw != null) {
    const ov = sanitizeOverlays(ovRaw.split(",").map((s) => s.trim()));
    if (ov) out.ov = ov;
  }
  const piv = q.get("piv");
  if (isPivot(piv)) out.piv = piv;
  const cfgRaw = q.get("cfg");
  if (cfgRaw) {
    try {
      const cfg = sanitizeSettings(JSON.parse(decodeURIComponent(cfgRaw)));
      if (cfg) out.cfg = cfg;
    } catch {
      // ignore bad cfg param
    }
  }
  const ma = q.get("ma");
  if (ma != null) {
    const parsed = sanitizeMas(ma.split(",").map((s) => Number(s.trim())));
    if (parsed) out.ma = parsed;
  }
  return out;
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
  events?: Array<{ time: number; type: "div" | "split"; text: string }>;
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
  // Intraday (1D/5D) is available for crypto always, and for stocks once the
  // keyed provider is enabled. Otherwise hide those tabs and coerce a stock
  // ?range=1d down to the monthly default.
  const intradayOk = crypto || STOCK_INTRADAY_ENABLED;
  const visibleRanges = intradayOk
    ? RANGES
    : RANGES.filter((r) => !INTRADAY_RANGES.has(r.key));
  const [range, setRange] = React.useState<RangeKey>(() =>
    !intradayOk && INTRADAY_RANGES.has(initialRange) ? "1mo" : initialRange
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
  const [indicators, setIndicators] = React.useState<Indicator[]>([]);
  const [bollinger, setBollinger] = React.useState(false);
  const [vwap, setVwap] = React.useState(false);
  const [volumeProfile, setVolumeProfile] = React.useState(false);
  const [emas, setEmas] = React.useState<number[]>([]);
  const [ribbon, setRibbon] = React.useState(false);
  const [crosses, setCrosses] = React.useState(false);
  const [settings, setSettings] = React.useState<IndicatorSettings>(DEFAULT_INDICATOR_SETTINGS);
  const [showIndicators, setShowIndicators] = React.useState(false);
  const [dataWindow, setDataWindow] = React.useState(false);
  const [showHelp, setShowHelp] = React.useState(false);
  const [maType, setMaType] = React.useState<MaType>("sma");
  const [tvOverlays, setTvOverlays] = React.useState<TvOverlayKey[]>([]);
  const [pivots, setPivots] = React.useState<"off" | "std" | "fib">("off");
  const tvOn = (k: TvOverlayKey) => tvOverlays.includes(k);
  const toggleTv = React.useCallback((k: TvOverlayKey) => {
    setTvOverlays((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  }, []);
  const [replay, setReplay] = React.useState(false);
  const [replayIdx, setReplayIdx] = React.useState(0);
  const [replayPlaying, setReplayPlaying] = React.useState(false);
  const [replaySpeed, setReplaySpeed] = React.useState(1);
  const [maInput, setMaInput] = React.useState("");
  const [emaInput, setEmaInput] = React.useState("");
  const [searchValue, setSearchValue] = React.useState("");
  const [compareSymbol, setCompareSymbol] = React.useState<string | null>(null);
  const [compareData, setCompareData] = React.useState<{ symbol: string; candles: Candle[] } | null>(null);
  const [compareInput, setCompareInput] = React.useState("");
  // Gate prefs persistence until the stored/URL prefs have been applied, so the
  // first render's defaults don't clobber what the user previously saved.
  const [prefsReady, setPrefsReady] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const copiedTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const prevPriceRef = React.useRef<number | null>(null);
  const flashTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const chartRef = React.useRef<CandleChartHandle>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const indicatorsBoxRef = React.useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const onScreenshot = React.useCallback(() => {
    const name = `${(data?.symbol ?? symbol).toUpperCase()}-${range}.png`;
    chartRef.current?.exportPng(name);
  }, [data?.symbol, symbol, range]);

  const toggleFullscreen = React.useCallback(() => {
    if (typeof document === "undefined") return;
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else cardRef.current?.requestFullscreen?.().catch(() => {});
  }, []);

  React.useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // Close the Indicators popover on an outside click.
  React.useEffect(() => {
    if (!showIndicators) return;
    const onDown = (e: PointerEvent) => {
      if (indicatorsBoxRef.current && !indicatorsBoxRef.current.contains(e.target as Node)) {
        setShowIndicators(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [showIndicators]);

  const toggleMa = React.useCallback((period: number) => {
    setMas((prev) =>
      prev.includes(period)
        ? prev.filter((p) => p !== period)
        : [...prev, period].sort((a, b) => a - b)
    );
  }, []);

  const toggleEma = React.useCallback((period: number) => {
    setEmas((prev) =>
      prev.includes(period) ? prev.filter((p) => p !== period) : [...prev, period].sort((a, b) => a - b)
    );
  }, []);

  const toggleIndicator = React.useCallback((k: Indicator) => {
    setIndicators((prev) =>
      prev.includes(k)
        ? prev.filter((x) => x !== k)
        : prev.length >= MAX_PANES
        ? prev
        : [...prev, k]
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

  const onCompareSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const s = compareInput.trim().toUpperCase();
      if (s && s !== (data?.symbol ?? symbol).toUpperCase()) {
        setCompareSymbol(s);
        setCompareInput("");
      }
    },
    [compareInput, data?.symbol, symbol]
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

  // Fetch the compare ticker (re-fetched on range change so bars align by time).
  React.useEffect(() => {
    if (!compareSymbol) {
      setCompareData(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/chart/${encodeURIComponent(compareSymbol)}?range=${range}`,
          { cache: "no-store" }
        );
        const json = await res.json();
        if (!res.ok) throw new Error();
        if (!cancelled) {
          setCompareData({
            symbol: (json.symbol ?? compareSymbol).toUpperCase(),
            candles: Array.isArray(json.candles) ? json.candles : [],
          });
        }
      } catch {
        if (!cancelled) setCompareData(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [compareSymbol, symbol, range]);

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

  // ── Replay controls ──
  const candleCount = data?.candles.length ?? 0;
  const enterReplay = React.useCallback(() => {
    const n = data?.candles.length ?? 0;
    if (n < 2) return;
    setReplayIdx(Math.max(1, Math.floor(n * 0.6)));
    setReplay(true);
    setReplayPlaying(false);
  }, [data?.candles.length]);
  const exitReplay = React.useCallback(() => {
    setReplay(false);
    setReplayPlaying(false);
  }, []);
  React.useEffect(() => {
    if (!replay || !replayPlaying) return;
    const n = data?.candles.length ?? 0;
    const id = setInterval(() => {
      setReplayIdx((i) => {
        if (i >= n - 1) {
          setReplayPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, 1000 / replaySpeed);
    return () => clearInterval(id);
  }, [replay, replayPlaying, replaySpeed, data?.candles.length]);

  // ── Apply persisted/URL prefs once, client-side after mount ────────────────
  // Initial render uses the deterministic defaults (so SSR and hydration match),
  // then this effect overlays the user's saved settings / shared-link params.
  // URL params win over localStorage.
  React.useEffect(() => {
    const p = { ...readStoredPrefs(), ...readUrlPrefs() };
    if (p.type != null) setChartType(p.type);
    if (p.vol != null) setShowVolume(p.vol);
    if (p.ma != null) setMas(p.ma);
    if (p.scale != null) setPriceScale(p.scale);
    if (p.ind != null) setIndicators(p.ind);
    if (p.bb != null) setBollinger(p.bb);
    if (p.vwap != null) setVwap(p.vwap);
    if (p.vp != null) setVolumeProfile(p.vp);
    if (p.ema != null) setEmas(p.ema);
    if (p.rib != null) setRibbon(p.rib);
    if (p.cr != null) setCrosses(p.cr);
    if (p.cfg != null) setSettings(p.cfg);
    if (p.dw != null) setDataWindow(p.dw);
    if (p.mat != null) setMaType(p.mat);
    if (p.ov != null) setTvOverlays(p.ov);
    if (p.piv != null) setPivots(p.piv);
    // compare ticker rides the URL only (not localStorage)
    const cmp = new URLSearchParams(window.location.search).get("cmp");
    if (cmp) setCompareSymbol(cmp.toUpperCase());
    setPrefsReady(true);
  }, []);

  // Persist display prefs whenever they change (after the initial apply).
  React.useEffect(() => {
    if (!prefsReady || typeof window === "undefined") return;
    try {
      const prefs: ChartPrefs = {
        type: chartType,
        vol: showVolume,
        ma: mas,
        scale: priceScale,
        ind: indicators,
        bb: bollinger,
        vwap,
        vp: volumeProfile,
        ema: emas,
        rib: ribbon,
        cr: crosses,
        cfg: settings,
        dw: dataWindow,
        mat: maType,
        ov: tvOverlays,
        piv: pivots,
      };
      window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // storage full / disabled — non-fatal
    }
  }, [prefsReady, chartType, showVolume, mas, priceScale, indicators, bollinger, vwap, volumeProfile, emas, ribbon, crosses, settings, dataWindow, maType, tvOverlays, pivots]);

  // Build a shareable deep link encoding the current view, copy to clipboard.
  const onShare = React.useCallback(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    params.set("range", range);
    params.set("type", chartType);
    params.set("vol", showVolume ? "1" : "0");
    if (mas.length) params.set("ma", mas.join(","));
    params.set("scale", priceScale);
    if (indicators.length) params.set("ind", indicators.join(","));
    if (bollinger) params.set("bb", "1");
    if (vwap) params.set("vwap", "1");
    if (volumeProfile) params.set("vp", "1");
    if (emas.length) params.set("ema", emas.join(","));
    if (ribbon) params.set("rib", "1");
    if (crosses) params.set("cr", "1");
    if (JSON.stringify(settings) !== JSON.stringify(DEFAULT_INDICATOR_SETTINGS)) {
      params.set("cfg", encodeURIComponent(JSON.stringify(settings)));
    }
    if (dataWindow) params.set("dw", "1");
    if (maType !== "sma") params.set("mat", maType);
    if (tvOverlays.length) params.set("ov", tvOverlays.join(","));
    if (pivots !== "off") params.set("piv", pivots);
    if (compareSymbol) params.set("cmp", compareSymbol);
    const url = `${window.location.origin}/c/${encodeURIComponent(symbol)}?${params}`;
    const done = () => {
      setCopied(true);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 1500);
    };
    navigator.clipboard?.writeText(url).then(done).catch(done);
  }, [range, chartType, showVolume, mas, priceScale, indicators, bollinger, vwap, volumeProfile, emas, ribbon, crosses, settings, dataWindow, maType, tvOverlays, pivots, compareSymbol, symbol]);

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

  const activeIndicatorCount =
    mas.length +
    emas.length +
    indicators.length +
    tvOverlays.length +
    (pivots !== "off" ? 1 : 0) +
    [bollinger, vwap, volumeProfile, ribbon, crosses].filter(Boolean).length;

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

          {/* ── Toolbar (chart type · scale · indicators · actions) ───────── */}
          <div className="anim-rise mt-3 flex flex-wrap items-center gap-2">
            {/* Chart type */}
            <div className="inline-flex items-center rounded-full border border-card-border bg-card p-1">
              {([
                ["candles", "Candles", CandlestickChart],
                ["hollow", "Hollow", null],
                ["heikin", "HA", null],
                ["area", "Area", AreaChart],
                ["baseline", "Base", null],
              ] as const).map(([key, label, Icon]) => {
                const active = chartType === key;
                return (
                  <button
                    key={key}
                    onClick={() => setChartType(key)}
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
                    style={active ? { background: UP, color: "#000" } : { color: "var(--muted-foreground)" }}
                    aria-pressed={active}
                    title={`${label} chart`}
                  >
                    {Icon ? <Icon className="size-3.5" /> : null}
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Price scale */}
            <div className="inline-flex items-center rounded-full border border-card-border bg-card p-1">
              {SCALE_OPTIONS.map((sc) => {
                const active = priceScale === sc.key;
                return (
                  <button
                    key={sc.key}
                    onClick={() => setPriceScale(sc.key)}
                    className="rounded-full px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
                    style={active ? { background: UP, color: "#000" } : { color: "var(--muted-foreground)" }}
                    aria-pressed={active}
                    title={`${sc.label} price scale`}
                  >
                    {sc.label}
                  </button>
                );
              })}
            </div>

            {/* Indicators popover */}
            <div className="relative" ref={indicatorsBoxRef}>
              <button
                onClick={() => setShowIndicators((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-full border border-card-border bg-card px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
                style={showIndicators ? { color: "var(--foreground)" } : { color: "var(--muted-foreground)" }}
                aria-pressed={showIndicators}
                title="Indicators & overlays"
              >
                <Layers className="size-3.5" />
                Indicators
                {activeIndicatorCount > 0 && (
                  <span
                    className="rounded-full px-1.5 text-[10px] font-bold tabular-nums"
                    style={{ background: UP, color: "#000" }}
                  >
                    {activeIndicatorCount}
                  </span>
                )}
                <ChevronDown className={`size-3 transition-transform ${showIndicators ? "rotate-180" : ""}`} />
              </button>
              {showIndicators && (
                <div
                  className="anim-pop absolute left-0 top-full z-30 mt-2 w-80 space-y-3 rounded-2xl border border-card-border p-3 shadow-xl"
                  style={{ background: "var(--card)" }}
                >
                  <div>
                    <div className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Overlays
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {([
                        ["Vol", showVolume, () => setShowVolume((v) => !v)],
                        ["BB", bollinger, () => setBollinger((v) => !v)],
                        ["VWAP", vwap, () => setVwap((v) => !v)],
                        ["VP", volumeProfile, () => setVolumeProfile((v) => !v)],
                        ["Ribbon", ribbon, () => setRibbon((v) => !v)],
                        ["Cross", crosses, () => setCrosses((v) => !v)],
                      ] as const).map(([label, active, onClick]) => (
                        <button
                          key={label}
                          onClick={onClick}
                          className="rounded-full border px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95"
                          style={
                            active
                              ? { background: UP, color: "#000", borderColor: "transparent" }
                              : { background: "var(--card)", color: "var(--muted-foreground)", borderColor: "var(--card-border)" }
                          }
                          aria-pressed={active}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Moving averages
                      </span>
                      <div className="inline-flex overflow-hidden rounded-full border border-card-border">
                        {MA_TYPES.map((t) => (
                          <button
                            key={t.key}
                            onClick={() => setMaType(t.key)}
                            className="px-1.5 py-0.5 font-mono text-[9px] font-bold"
                            style={
                              maType === t.key
                                ? { background: UP, color: "#000" }
                                : { color: "var(--muted-foreground)" }
                            }
                            title={`${t.label} for the MA periods`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {MA_OPTIONS.map((p) => {
                        const active = mas.includes(p);
                        const color = MA_COLORS[mas.indexOf(p) % MA_COLORS.length];
                        return (
                          <button
                            key={`ma${p}`}
                            onClick={() => toggleMa(p)}
                            className="rounded-full border px-2.5 py-1 font-mono text-[11px] font-bold uppercase transition-all active:scale-95"
                            style={
                              active
                                ? { background: color, color: "#000", borderColor: "transparent" }
                                : { background: "var(--card)", color: "var(--muted-foreground)", borderColor: "var(--card-border)" }
                            }
                            aria-pressed={active}
                          >
                            MA{p}
                          </button>
                        );
                      })}
                      {EMA_OPTIONS.map((p) => {
                        const active = emas.includes(p);
                        const color = MA_COLORS[emas.indexOf(p) % MA_COLORS.length];
                        return (
                          <button
                            key={`ema${p}`}
                            onClick={() => toggleEma(p)}
                            className="rounded-full border px-2.5 py-1 font-mono text-[11px] font-bold uppercase transition-all active:scale-95"
                            style={
                              active
                                ? { background: color, color: "#000", borderColor: "transparent" }
                                : { background: "var(--card)", color: "var(--muted-foreground)", borderColor: "var(--card-border)" }
                            }
                            aria-pressed={active}
                          >
                            E{p}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Overlays · advanced
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {TV_OVERLAYS.map((o) => {
                        const active = tvOn(o.key);
                        return (
                          <button
                            key={o.key}
                            onClick={() => toggleTv(o.key)}
                            className="rounded-full border px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95"
                            style={
                              active
                                ? { background: UP, color: "#000", borderColor: "transparent" }
                                : { background: "var(--card)", color: "var(--muted-foreground)", borderColor: "var(--card-border)" }
                            }
                            aria-pressed={active}
                          >
                            {o.label}
                          </button>
                        );
                      })}
                      {/* Pivots cycle off → std → fib */}
                      <button
                        onClick={() => setPivots((p) => (p === "off" ? "std" : p === "std" ? "fib" : "off"))}
                        className="rounded-full border px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95"
                        style={
                          pivots !== "off"
                            ? { background: UP, color: "#000", borderColor: "transparent" }
                            : { background: "var(--card)", color: "var(--muted-foreground)", borderColor: "var(--card-border)" }
                        }
                        aria-pressed={pivots !== "off"}
                        title="Pivot points (off / standard / Fibonacci)"
                      >
                        Pivots{pivots !== "off" ? ` ${pivots}` : ""}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Panes <span className="text-muted-foreground/60">· up to {MAX_PANES}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {INDICATOR_OPTIONS.map((o) => {
                        const active = indicators.includes(o.key);
                        const full = !active && indicators.length >= MAX_PANES;
                        return (
                          <button
                            key={o.key}
                            onClick={() => toggleIndicator(o.key)}
                            disabled={full}
                            className="rounded-full border px-2.5 py-1 font-mono text-[11px] font-bold uppercase transition-all active:scale-95 disabled:opacity-40"
                            style={
                              active
                                ? { background: UP, color: "#000", borderColor: "transparent" }
                                : { background: "var(--card)", color: "var(--muted-foreground)", borderColor: "var(--card-border)" }
                            }
                            aria-pressed={active}
                          >
                            {o.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t border-card-border pt-2">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Parameters
                      </span>
                      <button
                        onClick={() => setSettings(DEFAULT_INDICATOR_SETTINGS)}
                        className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Reset
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {SETTING_FIELDS.map((f) => (
                        <label key={f.key} className="flex items-center justify-between gap-1.5">
                          <span className="font-mono text-[10px] text-muted-foreground">{f.label}</span>
                          <input
                            type="number"
                            min={1}
                            max={400}
                            step={f.key === "bbMult" ? 0.5 : 1}
                            value={settings[f.key]}
                            onChange={(e) => {
                              const n = Number(e.target.value);
                              if (Number.isFinite(n) && n > 0 && n <= 400) setSettings((st) => ({ ...st, [f.key]: n }));
                            }}
                            className="w-14 rounded border border-card-border bg-background px-1.5 py-0.5 text-right font-mono text-xs text-foreground focus:outline-none"
                          />
                        </label>
                      ))}
                    </div>
                    <div className="mt-2 space-y-1.5">
                      {([
                        ["MA", maInput, setMaInput, mas, toggleMa] as const,
                        ["EMA", emaInput, setEmaInput, emas, toggleEma] as const,
                      ]).map(([label, val, setVal, active, toggle]) => (
                        <div key={label} className="flex items-center gap-1.5">
                          <span className="w-8 font-mono text-[10px] text-muted-foreground">{label}</span>
                          <input
                            type="number"
                            min={1}
                            max={400}
                            value={val}
                            onChange={(e) => setVal(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const n = Number(val);
                                if (Number.isInteger(n) && n >= 1 && n <= 400 && !active.includes(n)) toggle(n);
                                setVal("");
                              }
                            }}
                            placeholder="add period"
                            className="w-full rounded border border-card-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-foreground placeholder:normal-case focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right cluster: compare · actions · search */}
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <form
                onSubmit={onCompareSubmit}
                className="inline-flex items-center gap-1.5 rounded-full border border-card-border bg-card px-3 py-1.5"
              >
                <GitCompare className="size-3.5 text-muted-foreground" />
                {compareSymbol ? (
                  <button
                    type="button"
                    onClick={() => setCompareSymbol(null)}
                    className="inline-flex items-center gap-1 font-mono text-xs font-bold uppercase tracking-wider"
                    style={{ color: MA_COLORS[1] }}
                    title="Remove comparison"
                  >
                    {compareData?.symbol ?? compareSymbol} ✕
                  </button>
                ) : (
                  <input
                    value={compareInput}
                    onChange={(e) => setCompareInput(e.target.value)}
                    placeholder="Compare"
                    aria-label="Compare ticker"
                    spellCheck={false}
                    autoCapitalize="characters"
                    className="w-16 bg-transparent font-mono text-xs uppercase tracking-wider text-foreground placeholder:text-muted-foreground/60 placeholder:normal-case focus:outline-none"
                  />
                )}
              </form>

              <div className="inline-flex items-center rounded-full border border-card-border bg-card p-1">
                <button
                  onClick={() => (replay ? exitReplay() : enterReplay())}
                  title="Bar replay"
                  aria-label="Bar replay"
                  aria-pressed={replay}
                  className="flex h-7 w-7 items-center justify-center rounded-full transition-all active:scale-90"
                  style={replay ? { background: UP, color: "#000" } : { color: "var(--muted-foreground)" }}
                >
                  {replay ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                </button>
                <button
                  onClick={() => setDataWindow((v) => !v)}
                  title="Data window (D)"
                  aria-label="Data window"
                  aria-pressed={dataWindow}
                  className="flex h-7 w-7 items-center justify-center rounded-full transition-all active:scale-90"
                  style={dataWindow ? { background: UP, color: "#000" } : { color: "var(--muted-foreground)" }}
                >
                  <Table className="size-3.5" />
                </button>
                <button
                  onClick={onShare}
                  title={copied ? "Copied!" : "Copy share link"}
                  aria-label="Share"
                  className="flex h-7 w-7 items-center justify-center rounded-full transition-all active:scale-90"
                  style={copied ? { background: UP, color: "#000" } : { color: "var(--muted-foreground)" }}
                >
                  {copied ? <Check className="size-3.5" /> : <Share2 className="size-3.5" />}
                </button>
                <button
                  onClick={onScreenshot}
                  title="Download PNG"
                  aria-label="Download PNG"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-all active:scale-90"
                >
                  <Camera className="size-3.5" />
                </button>
                <button
                  onClick={toggleFullscreen}
                  title="Fullscreen (F)"
                  aria-label="Fullscreen"
                  aria-pressed={isFullscreen}
                  className="flex h-7 w-7 items-center justify-center rounded-full transition-all active:scale-90"
                  style={isFullscreen ? { background: UP, color: "#000" } : { color: "var(--muted-foreground)" }}
                >
                  {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
                </button>
                <button
                  onClick={() => setShowHelp((v) => !v)}
                  title="Shortcuts (?)"
                  aria-label="Keyboard shortcuts"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-all active:scale-90"
                >
                  <HelpCircle className="size-3.5" />
                </button>
              </div>

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
                  className="w-24 bg-transparent font-mono text-xs uppercase tracking-wider text-foreground placeholder:text-muted-foreground/60 placeholder:normal-case focus:outline-none"
                />
              </form>
            </div>
          </div>

          {/* ── Chart card ────────────────────────────────────────────────── */}
          <div
            ref={cardRef}
            className={`relative mt-4 overflow-hidden border border-card-border bg-card p-3 sm:p-4 ${
              isFullscreen ? "flex flex-col rounded-none" : "rounded-3xl"
            }`}
            style={{
              boxShadow: `var(--card-shadow), 0 40px 90px -50px ${up ? UP_GLOW : DOWN_GLOW}`,
            }}
          >
            <div
              className={
                isFullscreen
                  ? "relative min-h-0 w-full flex-1"
                  : "relative h-[320px] w-full sm:h-[420px]"
              }
            >
              {data && (
                <CandleChart
                  ref={chartRef}
                  onToggleFullscreen={toggleFullscreen}
                  candles={data.candles}
                  interval={data.interval}
                  currency={data.currency}
                  range={data.range}
                  chartType={chartType}
                  showVolume={showVolume}
                  mas={mas}
                  emas={emas}
                  ribbon={ribbon}
                  crosses={crosses}
                  priceScale={priceScale}
                  indicators={indicators}
                  bollinger={bollinger}
                  maType={maType}
                  ichimoku={tvOn("ichimoku")}
                  psar={tvOn("psar")}
                  supertrend={tvOn("supertrend")}
                  keltner={tvOn("keltner")}
                  donchian={tvOn("donchian")}
                  linreg={tvOn("linreg")}
                  zigzag={tvOn("zigzag")}
                  pivots={pivots}
                  indicatorSettings={settings}
                  symbol={(data.symbol ?? symbol).toUpperCase()}
                  compare={compareData}
                  events={data.events}
                  vwap={vwap}
                  volumeProfile={volumeProfile}
                  dataWindow={dataWindow}
                  replayIndex={replay ? Math.min(replayIdx, data.candles.length - 1) : null}
                  onExitReplay={exitReplay}
                  onToggleDataWindow={() => setDataWindow((s) => !s)}
                  onToggleHelp={() => setShowHelp((s) => !s)}
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

              {/* Keyboard shortcuts / tools cheatsheet */}
              {showHelp && (
                <div
                  className="absolute inset-0 z-20 grid place-items-center p-4"
                  style={{ background: "color-mix(in oklab, var(--background-deep) 70%, transparent)", backdropFilter: "blur(4px)" }}
                  onClick={() => setShowHelp(false)}
                >
                  <div
                    className="max-h-full overflow-auto rounded-2xl border border-card-border bg-card p-4 font-mono text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="mb-2 flex items-center justify-between gap-6">
                      <span className="font-bold uppercase tracking-wider text-muted-foreground">Shortcuts</span>
                      <button onClick={() => setShowHelp(false)} className="text-muted-foreground hover:text-foreground">✕</button>
                    </div>
                    <div className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
                      {[
                        ["← →", "Pan"],
                        ["+ / −", "Zoom"],
                        ["R", "Reset zoom & scale"],
                        ["F", "Fullscreen"],
                        ["D", "Data window"],
                        ["A", "Auto-Fibonacci"],
                        ["C", "Cycle drawing colour"],
                        ["⌘Z / ⇧⌘Z", "Undo / redo"],
                        ["Delete", "Remove selected"],
                        ["Esc", "Cancel / deselect"],
                        ["?", "This help"],
                        ["Shift-drag", "Measure tool"],
                        ["Drag price axis", "Rescale (2× to auto)"],
                        ["Tools", "line · trend · ray · arrow · rect · vline · fib · channel · long/short · 🔔 alert · VWAP · text"],
                      ].map(([k, v]) => (
                        <div key={k} className="flex items-baseline gap-2">
                          <span className="whitespace-nowrap font-bold" style={{ color: "var(--accent)" }}>{k}</span>
                          <span className="text-muted-foreground">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
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

          {/* ── Replay control bar ───────────────────────────────────────── */}
          {replay && data && (
            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl border border-card-border bg-card px-3 py-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest"
                style={{ background: "color-mix(in oklab, var(--success) 16%, transparent)", color: UP }}
              >
                Replay
              </span>
              <button
                onClick={() => setReplayPlaying((p) => !p)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-black"
                style={{ background: UP }}
                title={replayPlaying ? "Pause" : "Play"}
              >
                {replayPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
              </button>
              <button
                onClick={() => setReplayIdx((i) => Math.max(1, i - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-card-border text-muted-foreground hover:text-foreground"
                title="Step back"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              <button
                onClick={() => setReplayIdx((i) => Math.min(candleCount - 1, i + 1))}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-card-border text-muted-foreground hover:text-foreground"
                title="Step forward"
              >
                <ChevronRight className="size-3.5" />
              </button>
              <input
                type="range"
                min={1}
                max={Math.max(1, candleCount - 1)}
                value={Math.min(replayIdx, candleCount - 1)}
                onChange={(e) => setReplayIdx(Number(e.target.value))}
                className="h-1 flex-1 min-w-32 accent-[var(--success)]"
                aria-label="Replay position"
              />
              <div className="inline-flex overflow-hidden rounded-full border border-card-border">
                {[1, 2, 4].map((sp) => (
                  <button
                    key={sp}
                    onClick={() => setReplaySpeed(sp)}
                    className="px-2 py-1 font-mono text-[10px] font-bold"
                    style={
                      replaySpeed === sp
                        ? { background: UP, color: "#000" }
                        : { color: "var(--muted-foreground)" }
                    }
                  >
                    {sp}×
                  </button>
                ))}
              </div>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {data.candles[Math.min(replayIdx, candleCount - 1)]
                  ? new Date(data.candles[Math.min(replayIdx, candleCount - 1)].time * 1000).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : ""}
              </span>
              <button
                onClick={exitReplay}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-card-border text-muted-foreground hover:text-foreground"
                title="Exit replay (Esc)"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}

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
              Data via {STOCK_INTRADAY_ENABLED ? "Yahoo Finance & Twelve Data" : "Yahoo Finance"} ·
              may be delayed · informational only,{" "}
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
