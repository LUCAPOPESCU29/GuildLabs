/**
 * Stooq provider — free, no API key. Powers live quotes for stocks, crypto,
 * forex and indices. Stooq's CSV "light quote" endpoint returns the previous
 * close, so we can compute an exact day change without a second request.
 *
 *   https://stooq.com/q/l/?s=aapl.us+msft.us&f=snd1ohlcvp&h&e=csv
 *   Symbol,Name,Date,Open,High,Low,Close,Volume,Prev
 *   AAPL.US,APPLE INC,20260602,307.46,315.1,306.72,314.41,17072681,306.31
 *
 * Note: historical OHLC on Stooq now requires an API key, so this provider only
 * serves quotes. History comes from Yahoo (stocks + crypto) with CoinGecko as a
 * key-free crypto fallback.
 */

export const name = "stooq";

const BASE = "https://stooq.com/q/l/";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// A crypto/forex pair like BTC-USD or ETH-EUR (Yahoo-style with a dash).
const PAIR_RE = /^([A-Z0-9]{2,10})-(USD|USDT|USDC|EUR|GBP|JPY|BTC|ETH)$/;

// Common index tickers map from Yahoo-style (^GSPC) to Stooq (^spx).
const INDEX_MAP = {
  "^GSPC": "^spx",
  "^DJI": "^dji",
  "^IXIC": "^ndq",
  "^RUT": "^rut",
  "^VIX": "^vix",
  "^FTSE": "^ukx",
  "^GDAXI": "^dax",
  "^N225": "^nkx",
};

// Stooq exchange suffix → quote currency.
const SUFFIX_CCY = {
  us: "USD", uk: "GBP", de: "EUR", fr: "EUR", pl: "PLN",
  jp: "JPY", hk: "HKD", ca: "CAD", au: "AUD", ch: "CHF",
};

/** Map a Yahoo-style ticker to the symbol Stooq expects. */
function toStooqSymbol(sym) {
  const s = sym.toUpperCase();
  const pair = s.match(PAIR_RE);
  if (pair) return (pair[1] + pair[2]).toLowerCase(); // BTC-USD → btcusd
  if (s.endsWith("=X")) return s.slice(0, -2).toLowerCase(); // EURUSD=X → eurusd
  if (s.startsWith("^")) return INDEX_MAP[s] ?? s.toLowerCase();
  if (s.includes(".")) return s.toLowerCase(); // already exchange-qualified
  return `${s.toLowerCase()}.us`; // bare ticker → assume US equity
}

/** Best-effort display currency for the original (Yahoo-style) symbol. */
function currencyFor(sym) {
  const s = sym.toUpperCase();
  const pair = s.match(PAIR_RE);
  if (pair) return pair[2];
  if (s.endsWith("=X")) return s.slice(3, 6); // EURUSD=X → USD
  const dot = s.lastIndexOf(".");
  if (dot !== -1) return SUFFIX_CCY[s.slice(dot + 1).toLowerCase()] ?? "USD";
  return "USD";
}

function num(v) {
  if (v == null) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function prettyName(rawName, isPair) {
  const n = (rawName ?? "").trim();
  if (!n) return null;
  if (isPair) return n; // "BTC/USD" — keep as-is
  return n.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()); // "APPLE INC" → "Apple Inc"
}

/**
 * Parse one CSV data row. The first column is the Stooq symbol and the last
 * seven are fixed (Date,Open,High,Low,Close,Volume,Prev); anything between is
 * the name, which may itself contain commas — so we slice from both ends.
 */
function parseRow(row) {
  const parts = row.split(",");
  if (parts.length < 9) return null;

  const stooqSym = parts[0].trim().toLowerCase();
  const name = parts.slice(1, parts.length - 7).join(",").trim();
  const tail = parts.slice(-7); // date, open, high, low, close, volume, prev
  const [, open, high, low, close, volume, prev] = tail;

  const price = num(close);
  if (price == null) return null; // unknown symbol → Stooq returns "N/D"

  return { stooqSym, name, price, open: num(open), high: num(high), low: num(low), volume: num(volume), prev: num(prev) };
}

function normalize(originalSym, parsed) {
  const isPair = PAIR_RE.test(originalSym.toUpperCase()) || originalSym.toUpperCase().endsWith("=X");
  const change = parsed.prev != null ? parsed.price - parsed.prev : null;
  const changePercent = change != null && parsed.prev ? (change / parsed.prev) * 100 : null;
  return {
    symbol: originalSym,
    name: prettyName(parsed.name, isPair) || originalSym,
    price: parsed.price,
    change,
    changePercent,
    currency: currencyFor(originalSym),
    dayHigh: parsed.high,
    dayLow: parsed.low,
    volume: parsed.volume,
    marketState: null,
    exchange: null,
  };
}

/** Batch-fetch quotes. Returns Map<originalSymbol, normalizedQuote>. */
export async function quotes(symbols) {
  const out = new Map();
  const unique = [...new Set(symbols)];
  if (unique.length === 0) return out;

  // stooqSymbol → original requested symbol, so we can map results back.
  const back = new Map();
  for (const s of unique) back.set(toStooqSymbol(s), s);

  const query = [...back.keys()].map(encodeURIComponent).join("+");
  const url = `${BASE}?s=${query}&f=snd1ohlcvp&h&e=csv`;

  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`stooq HTTP ${res.status}`);
  const text = await res.text();

  const rows = text.trim().split(/\r?\n/).slice(1); // drop header
  for (const row of rows) {
    const parsed = parseRow(row);
    if (!parsed) continue;
    const original = back.get(parsed.stooqSym);
    if (!original) continue;
    out.set(original, normalize(original, parsed));
  }
  return out;
}

/** Fetch a single quote. Throws if Stooq has no data for the symbol. */
export async function quote(symbol) {
  const map = await quotes([symbol]);
  const q = map.get(symbol);
  if (!q) throw new Error(`stooq: no data for "${symbol}"`);
  return q;
}
