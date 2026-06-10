/**
 * GuildLabs proxy provider — fetches market data through the GuildLabs web
 * app's /api/chart endpoint instead of hitting Yahoo directly. The web route
 * runs on Vercel's serverless IPs (a wide, rotating pool), so when the bot's
 * own IP gets rate-limited by Yahoo — a common failure mode for keyless stock
 * data — this fallback still answers.
 *
 * One web request returns both a quote (price, prev close, day range, volume)
 * and the OHLC series, so we use the same endpoint for either path.
 *
 * Override the base via SITE_URL if the domain changes. Requires the web app
 * to be deployed; this provider is intentionally registered LAST in the
 * orchestrator so a healthy Yahoo from the bot's IP is still used first.
 */

export const name = "guildlabs";

const BASE = (process.env.SITE_URL || "https://www.guildlabs.fun").replace(/\/$/, "");
const UA = "ChartIt-bot/1.0 (+https://www.guildlabs.fun/bots/chartit)";
const TIMEOUT_MS = 7000;

async function fetchChart(symbol, range) {
  const url = `${BASE}/api/chart/${encodeURIComponent(symbol)}?range=${encodeURIComponent(range)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    // The web route surfaces a friendly `error` field on failures; pass it on.
    let detail = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      if (j?.error) detail = j.error;
    } catch {}
    throw new Error(`guildlabs: ${detail}`);
  }
  return res.json();
}

function toQuote(data) {
  if (!data || data.price == null) return null;
  return {
    symbol: data.symbol,
    name: data.name,
    price: data.price,
    change: data.change ?? null,
    changePercent: data.changePercent ?? null,
    currency: data.currency || "USD",
    dayHigh: data.dayHigh ?? null,
    dayLow: data.dayLow ?? null,
    volume: data.volume ?? null,
    marketState: data.marketState ?? null,
    exchange: data.exchange ?? null,
  };
}

export async function quote(symbol) {
  // range=1d gives the live quote (regularMarketPrice + prior-day close)
  // alongside an intraday candle series we discard here.
  const data = await fetchChart(symbol, "1d");
  const q = toQuote(data);
  if (!q) throw new Error(`guildlabs: no data for "${symbol}"`);
  return q;
}

export async function quotes(symbols) {
  const out = new Map();
  const unique = [...new Set(symbols)];
  if (unique.length === 0) return out;
  // The web route is per-symbol; fan out in parallel. Watchlists are small and
  // Vercel scales horizontally per request, so this is much safer than hammering
  // Yahoo directly from a single bot IP.
  const settled = await Promise.allSettled(unique.map((s) => quote(s)));
  for (const r of settled) {
    if (r.status === "fulfilled" && r.value) out.set(r.value.symbol, r.value);
  }
  return out;
}

export async function history(symbol, cfg, range) {
  // market.js passes the original RANGES key as the third arg; default to 1mo
  // if a caller (older signature) didn't supply it.
  const r = range || "1mo";
  const data = await fetchChart(symbol, r);
  const candles = Array.isArray(data.candles) ? data.candles : [];
  const points = candles
    .filter((c) => Number.isFinite(c?.time) && Number.isFinite(c?.close))
    .map((c) => ({
      date: new Date(c.time * 1000),
      open: c.open ?? c.close,
      high: c.high ?? c.close,
      low: c.low ?? c.close,
      close: c.close,
    }));
  if (points.length === 0) throw new Error(`guildlabs: no history for "${symbol}"`);
  return {
    points,
    meta: {
      symbol: data.symbol || symbol,
      currency: data.currency || "USD",
      rangeLabel: data.rangeLabel || cfg.label,
      interval: data.interval || cfg.interval,
    },
  };
}
