/**
 * Keyless market-data fetcher for the web (Vercel serverless / Node runtime).
 *
 * Mirrors the ChartIt bot's data model but talks to Yahoo's public v8 chart
 * endpoint directly — one request returns both the OHLC series and a live
 * quote (price, previous close, day range, volume). No API key required.
 *
 * Runs from Vercel's IPs, per request, so it's far less likely to hit Yahoo's
 * per-IP rate limit than the bot. We still fall back from query1 → query2 if
 * the first host throttles, and surface a friendly error otherwise.
 */

export type Range = "1d" | "5d" | "1mo" | "6mo" | "1y" | "ytd";

export interface RangeConfig {
  interval: string;
  label: string;
  short: string;
}

export const RANGES: Record<Range, RangeConfig> = {
  "1d": { interval: "5m", label: "1 Day", short: "1D" },
  "5d": { interval: "15m", label: "5 Days", short: "5D" },
  "1mo": { interval: "1d", label: "1 Month", short: "1M" },
  "6mo": { interval: "1d", label: "6 Months", short: "6M" },
  "1y": { interval: "1wk", label: "1 Year", short: "1Y" },
  ytd: { interval: "1d", label: "Year to Date", short: "YTD" },
};

export const DEFAULT_RANGE: Range = "1mo";

// Indicators (RSI 14, MACD 12/26/9, MA50) need a long warmup before they're
// defined: MACD needs ~35 prior bars, MA50 needs 50. A bare 1-month daily fetch
// (~22 bars) leaves them blank or stubby. So for the daily/weekly ranges we ask
// Yahoo for a longer window than we display, keeping the same interval, and tell
// the chart where the visible window starts (see displayStartSeconds). Intraday
// ranges (1d/5d) keep their native range — warmup there is handled by the extra
// pre-market/prior-session bars Yahoo already returns.
const FETCH_RANGE: Record<Range, string> = {
  "1d": "1d",
  "5d": "5d",
  "1mo": "6mo",
  "6mo": "1y",
  "1y": "5y",
  ytd: "2y",
};

/**
 * UTC seconds marking the first candle the user actually requested to see, given
 * the warmup-extended fetch above. Returns undefined for ranges fetched at their
 * native size (no warmup, so the whole array is visible).
 *
 * Snapped to UTC midnight so the value is stable across the 10-second live polls
 * — a drifting boundary would make the chart re-fit (and discard the user's
 * pan/zoom) on every refresh.
 */
function displayStartSeconds(range: Range): number | undefined {
  const midnightDaysAgo = (days: number) => {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    return Math.floor((d.getTime() - days * 86_400_000) / 1000);
  };
  switch (range) {
    case "1mo":
      return midnightDaysAgo(31);
    case "6mo":
      return midnightDaysAgo(186);
    case "1y":
      return midnightDaysAgo(366);
    case "ytd":
      return Math.floor(Date.UTC(new Date().getUTCFullYear(), 0, 1) / 1000);
    default:
      return undefined; // 1d / 5d: no warmup window
  }
}

export function isRange(value: string | null | undefined): value is Range {
  return !!value && value in RANGES;
}

export interface Candle {
  time: number; // UTC seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null; // shares/contracts traded in the bar; null when unknown
}

export interface ChartData {
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
  range: Range;
  interval: string;
  rangeLabel: string;
  candles: Candle[];
  // UTC seconds of the first candle the user asked to *see*. The candle array
  // can extend earlier than this (warmup bars fetched so RSI/MACD/MA50 are fully
  // defined across the visible window); the chart starts its view here and keeps
  // the warmup off-screen but pannable. Undefined when no warmup was fetched.
  displayStartTime?: number;
  // Corporate-action markers (Yahoo only): dividends + splits, for on-chart pins.
  events?: Array<{ time: number; type: "div" | "split"; text: string }>;
}

const HOSTS = ["https://query1.finance.yahoo.com", "https://query2.finance.yahoo.com"];

// A browser-like UA cuts down on Yahoo throttling bare server requests.
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

// ── Yahoo session (cookie + crumb) ───────────────────────────────────────────
// Yahoo hard-429s anonymous requests from shared datacenter IPs (Vercel runs
// many tenants behind a handful of egress IPs). Priming a session cookie + crumb
// — the same handshake a real browser does — lifts the per-IP limit enough to
// serve intraday data. Without it the route silently falls back to a daily-only
// source, which is why "1D" showed only a few bars. The session is cached for
// the lifetime of a warm lambda and re-primed on an auth failure.
interface YahooSession {
  cookie: string;
  crumb: string;
}
let sessionCache: YahooSession | null = null;
let sessionAt = 0;
let sessionInflight: Promise<YahooSession> | null = null;
const SESSION_TTL_MS = 30 * 60_000;

function readSetCookies(res: Response): string[] {
  // getSetCookie() exists on undici's Headers (Node fetch) but isn't in every
  // TS lib target — read it defensively.
  const fn = (res.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  return typeof fn === "function" ? fn.call(res.headers) : [];
}

async function primeSession(): Promise<YahooSession> {
  // 1) Obtain an A1/A3 consent cookie. fc.yahoo.com 404s but still Set-Cookies;
  //    finance.yahoo.com is the fallback.
  let cookie = "";
  for (const url of ["https://fc.yahoo.com/", "https://finance.yahoo.com/"]) {
    try {
      const r = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "text/html" },
        cache: "no-store",
        signal: AbortSignal.timeout(6000),
      });
      const jar = readSetCookies(r)
        .map((c) => c.split(";")[0])
        .filter(Boolean);
      if (jar.length) {
        cookie = jar.join("; ");
        break;
      }
    } catch {
      // try the next host
    }
  }
  if (!cookie) throw new Error("yahoo: no session cookie");

  // 2) Best-effort: exchange the cookie for a crumb. The v8 chart endpoint
  //    accepts the cookie alone, so a throttled getcrumb must NOT sink the
  //    session — we just send the cookie without a crumb in that case.
  let crumb = "";
  for (const host of HOSTS) {
    try {
      const r = await fetch(`${host}/v1/test/getcrumb`, {
        headers: { "User-Agent": UA, Cookie: cookie, Accept: "text/plain" },
        cache: "no-store",
        signal: AbortSignal.timeout(6000),
      });
      if (!r.ok) continue;
      const t = (await r.text()).trim();
      if (t && t.length < 64 && !/too many|<html/i.test(t)) {
        crumb = t;
        break;
      }
    } catch {
      // try the next host
    }
  }
  return { cookie, crumb };
}

async function getSession(force = false): Promise<YahooSession> {
  if (!force && sessionCache && Date.now() - sessionAt < SESSION_TTL_MS) {
    return sessionCache;
  }
  if (!sessionInflight) {
    sessionInflight = primeSession()
      .then((s) => {
        sessionCache = s;
        sessionAt = Date.now();
        return s;
      })
      .finally(() => {
        sessionInflight = null;
      });
  }
  return sessionInflight;
}

async function fetchYahoo(symbol: string, yahooRange: string, interval: string): Promise<unknown> {
  const buildPath = (crumb?: string) => {
    const qs = new URLSearchParams({
      range: yahooRange,
      interval,
      includePrePost: "false",
      events: "div,split",
    });
    if (crumb) qs.set("crumb", crumb);
    return `/v8/finance/chart/${encodeURIComponent(symbol)}?${qs}`;
  };

  let lastErr: unknown;
  // Two passes: the first uses the cached session, the second forces a fresh one
  // if Yahoo answered with an auth/throttle status (401/429).
  for (let attempt = 0; attempt < 2; attempt++) {
    let session: YahooSession | null = null;
    try {
      session = await getSession(attempt === 1);
    } catch (err) {
      lastErr = err; // priming failed — still try the bare endpoint below
    }
    const path = buildPath(session?.crumb);
    let throttled = false;
    for (const host of HOSTS) {
      try {
        const res = await fetch(`${host}${path}`, {
          headers: {
            "User-Agent": UA,
            Accept: "application/json",
            ...(session?.cookie ? { Cookie: session.cookie } : {}),
          },
          cache: "no-store",
          // bound the request so a stalled host can't hang the route
          signal: AbortSignal.timeout(8000),
        });
        if (res.status === 401 || res.status === 429) {
          throttled = true;
          lastErr = new Error(`yahoo ${res.status}`);
          continue; // a fresh session may help — try the other host / next pass
        }
        if (!res.ok) {
          lastErr = new Error(`yahoo ${res.status}`);
          continue;
        }
        return await res.json();
      } catch (err) {
        lastErr = err;
      }
    }
    if (!throttled) break; // non-auth failures won't be fixed by re-priming
  }
  throw lastErr ?? new Error("yahoo unreachable");
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

// ── Nasdaq fallback ─────────────────────────────────────────────────────────
// Yahoo-independent keyless source. Used when Yahoo throttles every host we
// can reach from this serverless invocation. Daily granularity only (no public
// intraday endpoint) — `1d` requests still try Yahoo first.

const NASDAQ_BASE = "https://api.nasdaq.com/api/quote";
const NASDAQ_CLASSES = ["stocks", "etf"] as const;

function parseMoney(s: unknown): number | null {
  if (typeof s !== "string") return null;
  const n = parseFloat(s.replace(/[$,]/g, ""));
  return Number.isFinite(n) ? n : null;
}
function parsePercent(s: unknown): number | null {
  if (typeof s !== "string") return null;
  const n = parseFloat(s.replace(/[%,]/g, ""));
  return Number.isFinite(n) ? n : null;
}
function parseLargeNum(s: unknown): number | null {
  if (typeof s !== "string") return null;
  const n = parseFloat(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}
function parseUSDate(s: unknown): Date | null {
  if (typeof s !== "string") return null;
  const [m, d, y] = s.split("/").map(Number);
  if (!m || !d || !y) return null;
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}
function ymd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function fetchNasdaqJson(path: string): Promise<{ status?: { rCode?: number }; data?: Record<string, unknown> } | null> {
  for (const cls of NASDAQ_CLASSES) {
    try {
      const res = await fetch(`${NASDAQ_BASE}${path}&assetclass=${cls}`, {
        headers: { "User-Agent": UA, Accept: "application/json, text/plain, */*" },
        cache: "no-store",
        signal: AbortSignal.timeout(7000),
      });
      if (!res.ok) continue;
      const j = await res.json();
      if (j?.status?.rCode === 200 && j?.data) return j;
    } catch {
      // try the next assetclass
    }
  }
  return null;
}

interface NasdaqHistRow { date?: string; open?: string; high?: string; low?: string; close?: string; volume?: string }
interface NasdaqQuoteData {
  symbol?: string;
  companyName?: string;
  exchange?: string;
  marketStatus?: string;
  primaryData?: {
    lastSalePrice?: string; netChange?: string; percentageChange?: string;
    volume?: string; currency?: string | null;
  };
  keyStats?: { dayrange?: { value?: string } };
}

function tidyName(raw: string | undefined, fallback: string): string {
  if (!raw) return fallback;
  return raw.replace(/\s+(Common Stock|Class\s+[A-Z]|ADR|Ordinary Shares)$/i, "").trim();
}

async function getChartDataFromNasdaq(symbol: string, range: Range): Promise<ChartData> {
  // Nasdaq has no public intraday endpoint, so the 1d range will be empty/coarse.
  // We still attempt it but propagate failures cleanly.
  const today = new Date();
  const cfg = RANGES[range];
  // Fetch a longer history than we display so RSI/MACD/MA50 are fully defined
  // across the visible window (MACD needs ~35 prior bars, MA50 needs 50). The
  // extra bars become warmup, kept off-screen via displayStartTime. ytd anchors
  // its window to Jan 1 but still pulls ~200 days before it for warmup.
  const warmupDaysByRange: Record<Range, number> = {
    "1d": 7, "5d": 21, "1mo": 200, "6mo": 400, "1y": 480, ytd: 200,
  };
  const from = range === "ytd"
    ? new Date(Date.UTC(today.getUTCFullYear(), 0, 1) - warmupDaysByRange.ytd * 86_400_000)
    : new Date(Date.now() - warmupDaysByRange[range] * 86_400_000);

  const sym = encodeURIComponent(symbol.toUpperCase());

  const [quoteJson, histJson] = await Promise.all([
    fetchNasdaqJson(`/${sym}/info?_=1`),
    fetchNasdaqJson(`/${sym}/historical?fromdate=${ymd(from)}&todate=${ymd(today)}&limit=9999`),
  ]);

  if (!quoteJson || !histJson) throw new Error(`nasdaq: no data for "${symbol}"`);

  const qd = quoteJson.data as NasdaqQuoteData;
  const rows = (histJson.data as { tradesTable?: { rows?: NasdaqHistRow[] } })?.tradesTable?.rows ?? [];

  const candles: Candle[] = [];
  const seen = new Set<number>();
  for (const r of rows) {
    const date = parseUSDate(r?.date);
    const close = parseMoney(r?.close);
    if (!date || close == null) continue;
    const time = Math.floor(date.getTime() / 1000);
    if (seen.has(time)) continue;
    seen.add(time);
    candles.push({
      time,
      open: parseMoney(r?.open) ?? close,
      high: parseMoney(r?.high) ?? close,
      low: parseMoney(r?.low) ?? close,
      close,
      volume: parseLargeNum(r?.volume),
    });
  }
  candles.sort((a, b) => a.time - b.time);
  if (candles.length === 0) throw new Error(`nasdaq: no history for "${symbol}"`);

  const p = qd?.primaryData;
  const price = parseMoney(p?.lastSalePrice) ?? candles[candles.length - 1].close;
  const change = parseMoney(p?.netChange);
  const changePercent = parsePercent(p?.percentageChange);
  const prevClose = change != null ? price - change : candles.length > 1 ? candles[candles.length - 2].close : null;

  let dayLow: number | null = null;
  let dayHigh: number | null = null;
  const dr = qd?.keyStats?.dayrange?.value;
  if (typeof dr === "string") {
    const parts = dr.split(/\s*-\s*/);
    if (parts.length === 2) { dayLow = parseMoney(parts[0]); dayHigh = parseMoney(parts[1]); }
  }

  return {
    symbol: (qd?.symbol || symbol).toUpperCase(),
    name: tidyName(qd?.companyName, symbol),
    currency: p?.currency || "USD",
    exchange: qd?.exchange ?? null,
    marketState: qd?.marketStatus ?? null,
    price,
    prevClose,
    change,
    changePercent,
    dayHigh,
    dayLow,
    volume: parseLargeNum(p?.volume),
    range,
    interval: cfg.interval,
    rangeLabel: cfg.label,
    candles,
    displayStartTime: displayStartSeconds(range),
  };
}

// ── Twelve Data intraday provider (keyed) ────────────────────────────────────
// Yahoo 429s Vercel's datacenter IPs for intraday (and now even daily), so stocks
// have no working intraday source from the cloud. Twelve Data's free tier (800
// req/day, 8 req/min) serves real intraday OHLC with an API key. Activated only
// when TWELVEDATA_API_KEY is set; otherwise this no-ops and the existing
// fallbacks run unchanged. One request per load (time_series) keeps us under the
// rate limit on the 10s poll; the quote header is derived from the bars.
const TWELVE_KEY = process.env.TWELVEDATA_API_KEY ?? "";
const TWELVE_INTRADAY: Partial<Record<Range, { interval: string; outputsize: number }>> = {
  "1d": { interval: "5min", outputsize: 110 },
  "5d": { interval: "15min", outputsize: 140 },
};

interface TwelveValue {
  datetime?: string;
  open?: string;
  high?: string;
  low?: string;
  close?: string;
  volume?: string;
}

const utcDay = (sec: number) => Math.floor(sec / 86_400);

async function getChartDataFromTwelveData(symbol: string, range: Range): Promise<ChartData> {
  if (!TWELVE_KEY) throw new Error("twelvedata: no api key");
  const map = TWELVE_INTRADAY[range];
  if (!map) throw new Error(`twelvedata: ${range} is not an intraday range`);

  const qs = new URLSearchParams({
    symbol: symbol.toUpperCase(),
    interval: map.interval,
    outputsize: String(map.outputsize),
    timezone: "UTC",
    apikey: TWELVE_KEY,
  });
  const res = await fetch(`https://api.twelvedata.com/time_series?${qs}`, {
    headers: { Accept: "application/json", "User-Agent": UA },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`twelvedata HTTP ${res.status}`);
  const j = (await res.json()) as {
    status?: string;
    message?: string;
    meta?: Record<string, unknown>;
    values?: TwelveValue[];
  };
  if (j?.status !== "ok" || !Array.isArray(j.values)) {
    throw new Error(j?.message || `twelvedata: no data for "${symbol}"`);
  }

  const candles: Candle[] = [];
  const seen = new Set<number>();
  for (const v of j.values) {
    // datetime is "YYYY-MM-DD HH:mm:ss" in UTC (we requested timezone=UTC).
    const ms = Date.parse((v.datetime ?? "").replace(" ", "T") + "Z");
    const close = num(v.close != null ? parseFloat(v.close) : null);
    if (!Number.isFinite(ms) || close == null) continue;
    const time = Math.floor(ms / 1000);
    if (seen.has(time)) continue;
    seen.add(time);
    candles.push({
      time,
      open: num(v.open != null ? parseFloat(v.open) : null) ?? close,
      high: num(v.high != null ? parseFloat(v.high) : null) ?? close,
      low: num(v.low != null ? parseFloat(v.low) : null) ?? close,
      close,
      volume: num(v.volume != null ? parseFloat(v.volume) : null),
    });
  }
  candles.sort((a, b) => a.time - b.time);
  if (candles.length === 0) throw new Error(`twelvedata: no history for "${symbol}"`);

  const meta = j.meta ?? {};
  const last = candles[candles.length - 1];
  const lastDay = utcDay(last.time);

  // Prior-session close → true daily change when the window spans >1 day; for a
  // single-session (1d) window fall back to the session's opening price.
  let prevClose = candles[0].open;
  for (let i = candles.length - 2; i >= 0; i--) {
    if (utcDay(candles[i].time) !== lastDay) {
      prevClose = candles[i].close;
      break;
    }
  }

  // Day range + volume from the most-recent session's bars.
  let dayHigh = -Infinity;
  let dayLow = Infinity;
  let dayVol = 0;
  for (const c of candles) {
    if (utcDay(c.time) !== lastDay) continue;
    if (c.high > dayHigh) dayHigh = c.high;
    if (c.low < dayLow) dayLow = c.low;
    if (typeof c.volume === "number") dayVol += c.volume;
  }

  const price = last.close;
  const change = price - prevClose;
  const changePercent = prevClose ? (change / prevClose) * 100 : null;
  const cfg = RANGES[range];

  return {
    symbol: String(meta.symbol ?? symbol).toUpperCase(),
    name: String(meta.symbol ?? symbol).toUpperCase(),
    currency: String(meta.currency ?? "USD"),
    exchange: (meta.exchange as string) ?? null,
    marketState: null,
    price,
    prevClose,
    change,
    changePercent,
    dayHigh: Number.isFinite(dayHigh) ? dayHigh : null,
    dayLow: Number.isFinite(dayLow) ? dayLow : null,
    volume: dayVol > 0 ? dayVol : null,
    range,
    interval: cfg.interval,
    rangeLabel: cfg.label,
    candles,
    // intraday: no warmup window, show the whole array
  };
}

// ── ChartIt bot proxy ────────────────────────────────────────────────────────
// Yahoo hard-blocks Vercel's shared datacenter IPs (even with a primed session),
// so intraday ranges silently die here. The ChartIt bot runs on a different host
// (Fly) whose IP Yahoo still serves, so we let it fetch the data and relay it.
// The bot's /chart endpoint returns this exact ChartData shape. Activated only
// when CHARTIT_BOT_URL is set, so the route still works (Yahoo → Nasdaq) without
// it. CHARTIT_BOT_TOKEN, if set on both sides, gates the bot endpoint.
const BOT_URL = (process.env.CHARTIT_BOT_URL ?? "").replace(/\/$/, "");
const BOT_TOKEN = process.env.CHARTIT_BOT_TOKEN ?? "";

async function getChartDataFromBot(symbol: string, range: Range): Promise<ChartData> {
  if (!BOT_URL) throw new Error("bot proxy: CHARTIT_BOT_URL not set");
  const url = `${BOT_URL}/chart?symbol=${encodeURIComponent(symbol)}&range=${encodeURIComponent(range)}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": UA,
      ...(BOT_TOKEN ? { "x-chart-token": BOT_TOKEN } : {}),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(9000),
  });
  if (!res.ok) throw new Error(`bot proxy: HTTP ${res.status}`);
  const data = (await res.json()) as ChartData;
  if (!Array.isArray(data?.candles) || data.candles.length === 0) {
    throw new Error(`bot proxy: no candles for "${symbol}"`);
  }
  // Trust the bot's range/interval but pin them to the request so the chart's
  // axis/countdown logic stays consistent with what the user selected.
  return { ...data, range, interval: RANGES[range].interval, rangeLabel: RANGES[range].label };
}

/** Fetch OHLC + a live quote for `symbol` over `range`. Throws on no data. */
export async function getChartData(symbol: string, range: Range): Promise<ChartData> {
  // Try Yahoo first (richest data, covers intraday + crypto + indices when it
  // isn't throttling our IP). On failure the fallback chain depends on the range:
  //   intraday → Twelve Data (keyed) → ChartIt bot relay  (Nasdaq has no intraday)
  //   daily    → ChartIt bot relay → Nasdaq
  // The original Yahoo error is surfaced if every fallback also comes up empty.
  const intraday =
    RANGES[range].interval.endsWith("m") || RANGES[range].interval.endsWith("h");
  try {
    return await getChartDataFromYahoo(symbol, range);
  } catch (yErr) {
    if (intraday) {
      // Twelve Data serves real stock intraday with a key; the bot reaches
      // Yahoo/CoinGecko intraday (covers crypto). Nasdaq is daily-only — skip it
      // so we don't render daily bars as if they were 5-minute candles.
      try {
        return await getChartDataFromTwelveData(symbol, range);
      } catch {
        // no key / unsupported symbol — try the relay
      }
      try {
        return await getChartDataFromBot(symbol, range);
      } catch {
        // relay unconfigured / unreachable
      }
      throw yErr;
    }
    // daily / weekly: bot relay first, then Nasdaq's keyless daily history.
    try {
      return await getChartDataFromBot(symbol, range);
    } catch {
      // relay unconfigured / unreachable — continue to Nasdaq
    }
    try {
      return await getChartDataFromNasdaq(symbol, range);
    } catch {
      throw yErr;
    }
  }
}

async function getChartDataFromYahoo(symbol: string, range: Range): Promise<ChartData> {
  const cfg = RANGES[range];
  const json = (await fetchYahoo(symbol, FETCH_RANGE[range], cfg.interval)) as {
    chart?: {
      result?: Array<{
        meta?: Record<string, unknown>;
        timestamp?: number[];
        indicators?: { quote?: Array<Record<string, Array<number | null>>> };
        events?: {
          dividends?: Record<string, { amount?: number; date?: number }>;
          splits?: Record<string, { date?: number; splitRatio?: string }>;
        };
      }>;
      error?: { description?: string } | null;
    };
  };

  const result = json?.chart?.result?.[0];
  if (!result || json?.chart?.error) {
    throw new Error(json?.chart?.error?.description || `No data for "${symbol}"`);
  }

  const meta = result.meta ?? {};
  const ts = result.timestamp ?? [];
  const q = result.indicators?.quote?.[0] ?? {};
  const opens = q.open ?? [];
  const highs = q.high ?? [];
  const lows = q.low ?? [];
  const closes = q.close ?? [];
  const volumes = q.volume ?? [];

  const candles: Candle[] = [];
  const seen = new Set<number>();
  for (let i = 0; i < ts.length; i++) {
    const time = ts[i];
    const close = num(closes[i]);
    if (!Number.isFinite(time) || close == null || seen.has(time)) continue;
    seen.add(time);
    candles.push({
      time,
      open: num(opens[i]) ?? close,
      high: num(highs[i]) ?? close,
      low: num(lows[i]) ?? close,
      close,
      volume: num(volumes[i]),
    });
  }
  candles.sort((a, b) => a.time - b.time);

  if (candles.length === 0) throw new Error(`No price history for "${symbol}"`);

  const price = num(meta.regularMarketPrice) ?? candles[candles.length - 1].close;
  const prevClose =
    num(meta.previousClose) ??
    num((meta as Record<string, unknown>).chartPreviousClose) ??
    candles[0].open;
  const change = price != null && prevClose != null ? price - prevClose : null;
  const changePercent =
    change != null && prevClose ? (change / prevClose) * 100 : null;

  // Corporate-action markers (dividends + splits) within the fetched window.
  const events: ChartData["events"] = [];
  const evDiv = result.events?.dividends;
  if (evDiv) {
    for (const k of Object.keys(evDiv)) {
      const d = evDiv[k];
      const t = num(d?.date) ?? Number(k);
      const amt = num(d?.amount);
      if (Number.isFinite(t) && amt != null) {
        events.push({ time: Math.floor(t), type: "div", text: `Dividend ${amt}` });
      }
    }
  }
  const evSplit = result.events?.splits;
  if (evSplit) {
    for (const k of Object.keys(evSplit)) {
      const s = evSplit[k];
      const t = num(s?.date) ?? Number(k);
      if (Number.isFinite(t)) {
        events.push({ time: Math.floor(t), type: "split", text: `Split ${s?.splitRatio ?? ""}`.trim() });
      }
    }
  }
  events.sort((a, b) => a.time - b.time);

  return {
    symbol: String(meta.symbol ?? symbol).toUpperCase(),
    name: String(
      meta.shortName || meta.longName || meta.symbol || symbol
    ),
    currency: String(meta.currency ?? "USD"),
    exchange: (meta.fullExchangeName as string) ?? (meta.exchangeName as string) ?? null,
    marketState: (meta.marketState as string) ?? null,
    price,
    prevClose,
    change,
    changePercent,
    dayHigh: num(meta.regularMarketDayHigh),
    dayLow: num(meta.regularMarketDayLow),
    volume: num(meta.regularMarketVolume),
    range,
    interval: cfg.interval,
    rangeLabel: cfg.label,
    candles,
    displayStartTime: displayStartSeconds(range),
    events: events.length > 0 ? events : undefined,
  };
}
