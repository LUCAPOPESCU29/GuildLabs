/**
 * Market-data orchestrator. Presents one stable API to the rest of the bot
 * (getQuote / getQuotes / getHistory) and fans out across providers, returning
 * the first one that answers. Providers are tried in priority order; each call
 * is bounded by a timeout so a stalled or blocked source can't hang a command.
 *
 * No API keys required. Quotes come from Yahoo or Stooq; chart history from
 * Yahoo (stocks + crypto) with CoinGecko as a key-free crypto fallback. Yahoo
 * rate-limits by IP, so a circuit breaker (below) cools it off after a failure
 * — and a final GuildLabs proxy provider routes stock requests through the web
 * app (Vercel's IPs) so a throttled bot IP can't take the bot offline.
 */

import * as stooq from "./providers/stooq.js";
import * as coingecko from "./providers/coingecko.js";
import * as yahoo from "./providers/yahoo.js";
import * as nasdaq from "./providers/nasdaq.js";
import * as guildlabs from "./providers/guildlabs.js";
import * as yahooNews from "./providers/yahoo-news.js";

// ── Range → granularity + lookback window ────────────────────────────────────
export const RANGES = {
  "1d": { interval: "5m", days: 1, label: "1 Day" },
  "5d": { interval: "15m", days: 5, label: "5 Days" },
  "1mo": { interval: "1d", days: 31, label: "1 Month" },
  "6mo": { interval: "1d", days: 186, label: "6 Months" },
  "1y": { interval: "1wk", days: 366, label: "1 Year" },
  "ytd": { interval: "1d", ytd: true, label: "Year to Date" },
};

export const DEFAULT_RANGE = "1mo";

const PROVIDER_TIMEOUT_MS = 8000;

// ── Tiny in-memory caches — gentle on upstream endpoints (esp. Yahoo's IP
//    rate limit). Quotes move fast so they expire quickly; chart history barely
//    changes within a minute, so it gets a longer TTL to absorb repeat /chart
//    calls for the same symbol+range without re-hitting the source. ──────────
const quoteCache = new Map(); // symbol -> { at, data }
const QUOTE_TTL_MS = 30_000;

const historyCache = new Map(); // `${symbol}|${range}` -> { at, data }
const HISTORY_TTL_MS = 60_000;

const newsCache = new Map(); // symbol -> { at, data }
const NEWS_TTL_MS = 5 * 60_000; // headlines move slowly; cache generously

/** Reject if `promise` hasn't settled within `ms`. Clears its timer either way. */
function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
  });
  return Promise.race([
    Promise.resolve(promise).finally(() => clearTimeout(timer)),
    timeout,
  ]);
}

// Yahoo is the preferred source (richest data) but rate-limits hard by IP. A
// small circuit breaker keeps it first while it's healthy and skips it for a
// cooldown after a failure, so an IP block can't slow every command — and the
// moment Yahoo answers again, the bot goes back to serving its data.
const YAHOO_COOLDOWN_MS = 5 * 60_000;
let yahooFailedAt = 0;
const yahooAvailable = () => Date.now() - yahooFailedAt >= YAHOO_COOLDOWN_MS;

async function runProvider(src, work) {
  try {
    const result = await withTimeout(work(), PROVIDER_TIMEOUT_MS, src.name);
    if (src === yahoo) yahooFailedAt = 0; // recovered → trust it again
    return result;
  } catch (err) {
    if (src === yahoo) yahooFailedAt = Date.now(); // blocked → cool off
    throw err;
  }
}

// `noProxy` drops the GuildLabs web provider. The web app's /api/chart route now
// relays through this bot's /chart endpoint when its own Yahoo access is blocked;
// if those bot calls then fell back to GuildLabs (→ web → bot), the two hosts
// would bounce a request between them. Serving an external proxy request with
// noProxy keeps the chain finite (bot → Yahoo/Nasdaq only).
function quoteSources(noProxy = false) {
  const list = [];
  if (yahooAvailable()) list.push(yahoo); // prefer Yahoo whenever it's reachable
  list.push(nasdaq); // Yahoo-independent keyless source for US stocks/ETFs
  list.push(stooq); // broader coverage (forex, intl) when nasdaq has no match
  if (!noProxy) list.push(guildlabs); // last-resort web proxy (different IPs than the bot)
  return list;
}

function historySources(symbol, noProxy = false) {
  const list = [];
  if (yahooAvailable()) list.push(yahoo); // prefer Yahoo whenever it's reachable
  if (coingecko.isCrypto(symbol)) list.push(coingecko);
  list.push(nasdaq); // keyless daily history for US stocks/ETFs — no Yahoo dependency
  if (!noProxy) list.push(guildlabs); // last-resort web proxy — keeps stocks alive when Yahoo throttles the bot's IP
  return list;
}

/**
 * Fetch a single live quote. Returns a normalized object or throws an Error
 * whose message is safe to show users.
 */
export async function getQuote(symbol, { noProxy = false } = {}) {
  const cached = quoteCache.get(symbol);
  if (cached && Date.now() - cached.at < QUOTE_TTL_MS) return cached.data;

  for (const src of quoteSources(noProxy)) {
    try {
      const data = await runProvider(src, () => src.quote(symbol));
      if (data && data.price != null) {
        quoteCache.set(symbol, { at: Date.now(), data });
        return data;
      }
    } catch (err) {
      console.error(`[MARKET] quote ${symbol} via ${src.name}:`, err.message);
    }
  }
  throw new Error(`No data for "${symbol}". Check the ticker (e.g. AAPL, MSFT, BTC-USD).`);
}

/**
 * Batch-fetch quotes for many symbols. Returns a Map of symbol -> normalized
 * quote (only successful ones). Never throws.
 */
export async function getQuotes(symbols) {
  const unique = [...new Set(symbols)];
  if (unique.length === 0) return new Map();

  for (const src of quoteSources()) {
    try {
      const map = await runProvider(src, () => src.quotes(unique));
      if (map && map.size > 0) return map;
    } catch (err) {
      console.error(`[MARKET] batch quotes via ${src.name}:`, err.message);
    }
  }
  return new Map();
}

/**
 * Fetch historical OHLC for a chart. Returns
 * { points: [{date, open, high, low, close}], meta }. `range` must be a key of RANGES.
 */
export async function getHistory(symbol, range = DEFAULT_RANGE, { noProxy = false } = {}) {
  const cfg = RANGES[range] ?? RANGES[DEFAULT_RANGE];

  const cacheKey = `${symbol}|${range}`;
  const cached = historyCache.get(cacheKey);
  if (cached && Date.now() - cached.at < HISTORY_TTL_MS) return cached.data;

  for (const src of historySources(symbol, noProxy)) {
    try {
      // Pass `range` (the RANGES key) so providers that talk in range strings
      // — e.g. the GuildLabs web proxy — can map without reverse-lookup. Older
      // providers (yahoo, coingecko) ignore the extra arg.
      const hist = await runProvider(src, () => src.history(symbol, cfg, range));
      if (hist && hist.points?.length) {
        historyCache.set(cacheKey, { at: Date.now(), data: hist });
        return hist;
      }
    } catch (err) {
      console.error(`[MARKET] history ${symbol} ${range} via ${src.name}:`, err.message);
    }
  }

  throw new Error(
    `No price history for "${symbol}". Double-check the ticker (e.g. AAPL, MSFT, BTC-USD) — if it's valid, the data source may be briefly rate-limited, so try again in a minute.`
  );
}

/**
 * Fetch up to `count` recent headlines for a symbol. News is decorative, so
 * this NEVER throws — it returns [] on any failure (and caches that briefly too
 * so a flaky source doesn't get hammered).
 * @returns {Promise<{title:string, publisher:string, link:string, publishedAt:number|null}[]>}
 */
export async function getNews(symbol, count = 3) {
  const cached = newsCache.get(symbol);
  if (cached && Date.now() - cached.at < NEWS_TTL_MS) return cached.data;

  let data = [];
  try {
    data = await withTimeout(yahooNews.news(symbol, count), PROVIDER_TIMEOUT_MS, yahooNews.name);
  } catch (err) {
    console.error(`[MARKET] news ${symbol}:`, err.message);
    data = [];
  }
  newsCache.set(symbol, { at: Date.now(), data });
  return data;
}
