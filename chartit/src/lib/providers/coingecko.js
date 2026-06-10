/**
 * CoinGecko provider — free, no API key. Powers crypto chart history.
 *
 *   https://api.coingecko.com/api/v3/coins/bitcoin/ohlc?vs_currency=usd&days=30
 *   [[ms, open, high, low, close], ...]
 *
 * The /ohlc endpoint only accepts a fixed set of day windows (1, 7, 14, 30,
 * 90, 180, 365) and picks candle granularity automatically from it
 * (days=1 → 30-min, 2–30 → 4-hour, 31+ → 4-day), so we map each requested
 * range to the nearest supported window.
 *
 * Only tickers in COIN_IDS resolve here; anything else falls through to the
 * next history source.
 */

export const name = "coingecko";

const BASE = "https://api.coingecko.com/api/v3";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Yahoo-style pair: BASE-QUOTE, e.g. BTC-USD, ETH-EUR.
const PAIR_RE = /^([A-Z0-9]{2,10})-([A-Z]{3,4})$/;

// vs_currency values CoinGecko supports that we care about.
const VS = new Set(["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "BTC", "ETH"]);

// Ticker → CoinGecko coin id, for the majors people actually chart.
const COIN_IDS = {
  BTC: "bitcoin", ETH: "ethereum", SOL: "solana", XRP: "ripple",
  ADA: "cardano", DOGE: "dogecoin", DOT: "polkadot", LTC: "litecoin",
  BCH: "bitcoin-cash", LINK: "chainlink", MATIC: "matic-network",
  AVAX: "avalanche-2", UNI: "uniswap", ATOM: "cosmos", XLM: "stellar",
  ALGO: "algorand", VET: "vechain", FIL: "filecoin", TRX: "tron",
  ETC: "ethereum-classic", BNB: "binancecoin", SHIB: "shiba-inu",
  NEAR: "near", APT: "aptos", ARB: "arbitrum", OP: "optimism",
  SUI: "sui", PEPE: "pepe", INJ: "injective-protocol", RNDR: "render-token",
  TON: "the-open-network", USDT: "tether", USDC: "usd-coin",
};

/** True when this symbol is a crypto pair CoinGecko can resolve. */
export function isCrypto(symbol) {
  const m = symbol.toUpperCase().match(PAIR_RE);
  if (!m) return false;
  return COIN_IDS[m[1]] !== undefined && VS.has(m[2]);
}

function daysSinceJan1() {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  return Math.max(1, Math.ceil((now - jan1) / 86_400_000));
}

// Day windows the free /ohlc endpoint accepts. We snap each request to the
// nearest one so any range still returns candles.
const OHLC_DAYS = [1, 7, 14, 30, 90, 180, 365];
function pickOhlcDays(want) {
  return OHLC_DAYS.reduce((best, d) =>
    Math.abs(d - want) < Math.abs(best - want) ? d : best
  );
}

/** Fetch crypto history. Returns { points: [{date, open, high, low, close}], meta }. */
export async function history(symbol, cfg) {
  const m = symbol.toUpperCase().match(PAIR_RE);
  if (!m || !COIN_IDS[m[1]]) throw new Error(`coingecko: unsupported symbol "${symbol}"`);

  const id = COIN_IDS[m[1]];
  const vs = m[2].toLowerCase();
  const days = pickOhlcDays(Math.min(365, cfg.ytd ? daysSinceJan1() : cfg.days));

  const url = `${BASE}/coins/${id}/ohlc?vs_currency=${vs}&days=${days}`;
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) throw new Error(`coingecko HTTP ${res.status}`);

  const json = await res.json();
  const rows = Array.isArray(json) ? json : [];
  const points = rows
    .filter((r) => Array.isArray(r) && r.length >= 5 && r[4] != null)
    .map(([ms, open, high, low, close]) => ({
      date: new Date(ms),
      open,
      high,
      low,
      close,
    }));

  if (points.length === 0) throw new Error(`coingecko: no history for "${symbol}"`);

  return {
    points,
    meta: {
      symbol,
      currency: m[2],
      rangeLabel: cfg.label,
      interval: cfg.interval,
    },
  };
}
