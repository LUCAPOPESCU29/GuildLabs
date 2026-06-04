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

export function isRange(value: string | null | undefined): value is Range {
  return !!value && value in RANGES;
}

export interface Candle {
  time: number; // UTC seconds
  open: number;
  high: number;
  low: number;
  close: number;
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

async function fetchYahoo(symbol: string, range: Range): Promise<unknown> {
  const cfg = RANGES[range];
  const buildPath = (crumb?: string) => {
    const qs = new URLSearchParams({
      range,
      interval: cfg.interval,
      includePrePost: "false",
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

interface NasdaqHistRow { date?: string; open?: string; high?: string; low?: string; close?: string }
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
  const fromBase = range === "ytd"
    ? new Date(Date.UTC(today.getUTCFullYear(), 0, 1))
    : new Date(Date.now() - (cfg.interval === "5m" ? 7 : Math.max(31, 0)) * 86_400_000);
  // For non-ytd ranges, derive lookback days from the range key so we cover the
  // requested window precisely.
  const daysByRange: Record<Range, number> = { "1d": 5, "5d": 14, "1mo": 31, "6mo": 186, "1y": 366, ytd: 0 };
  const from = range === "ytd" ? fromBase : new Date(Date.now() - daysByRange[range] * 86_400_000);

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
  };
}

/** Fetch OHLC + a live quote for `symbol` over `range`. Throws on no data. */
export async function getChartData(symbol: string, range: Range): Promise<ChartData> {
  // Try Yahoo first (richer data, supports intraday + crypto + indices). If
  // Yahoo throttles every reachable host, fall back to Nasdaq (Yahoo-free,
  // daily-only — fine for chart ranges 5d → ytd). Original Yahoo error is
  // surfaced if Nasdaq also has nothing.
  try {
    return await getChartDataFromYahoo(symbol, range);
  } catch (yErr) {
    // Nasdaq is daily-only. For the intraday ranges (1d → 5m, 5d → 15m) it would
    // return a handful of daily bars that the chart then renders as if they were
    // 5-minute candles — the "1D has fewer candles than 1M" bug. Only fall back
    // for ranges that are natively daily/weekly.
    const intraday =
      RANGES[range].interval.endsWith("m") || RANGES[range].interval.endsWith("h");
    if (intraday) throw yErr;
    try {
      return await getChartDataFromNasdaq(symbol, range);
    } catch {
      throw yErr;
    }
  }
}

async function getChartDataFromYahoo(symbol: string, range: Range): Promise<ChartData> {
  const json = (await fetchYahoo(symbol, range)) as {
    chart?: {
      result?: Array<{
        meta?: Record<string, unknown>;
        timestamp?: number[];
        indicators?: { quote?: Array<Record<string, Array<number | null>>> };
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

  const cfg = RANGES[range];
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
  };
}
