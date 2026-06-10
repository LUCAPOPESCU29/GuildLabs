/**
 * Nasdaq.com provider — free, no API key. A truly Yahoo-independent source for
 * US-listed stocks and ETFs, used to keep /chart alive when Yahoo's per-IP rate
 * limit hits both the bot's address and the GuildLabs proxy.
 *
 *   Quote:   https://api.nasdaq.com/api/quote/AAPL/info?assetclass=stocks
 *   History: https://api.nasdaq.com/api/quote/AAPL/historical?assetclass=stocks&fromdate=YYYY-MM-DD&todate=YYYY-MM-DD&limit=9999
 *
 * Values come back as display strings ("$310.83", "1.42%", "44,534,720"), so
 * everything is parsed defensively. Granularity is daily — there's no public
 * intraday endpoint, so the 1d range falls through to the next provider.
 * Symbols Nasdaq can't quote (indices like ^GSPC, crypto, forex) propagate an
 * error and the orchestrator's next fallback takes over.
 */

export const name = "nasdaq";

const BASE = "https://api.nasdaq.com/api/quote";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const TIMEOUT_MS = 7000;

// ── String parsers — Nasdaq returns display-formatted values ──────────────────
function parseMoney(s) {
  if (typeof s !== "string") return null;
  const n = parseFloat(s.replace(/[$,]/g, ""));
  return Number.isFinite(n) ? n : null;
}
function parsePercent(s) {
  if (typeof s !== "string") return null;
  const n = parseFloat(s.replace(/[%,]/g, ""));
  return Number.isFinite(n) ? n : null;
}
function parseLargeNum(s) {
  if (typeof s !== "string") return null;
  const n = parseFloat(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}
function parseUSDate(s) {
  if (typeof s !== "string") return null;
  const [m, d, y] = s.split("/").map(Number);
  if (!m || !d || !y) return null;
  // Use UTC noon so the date isn't pushed across a boundary by local TZ.
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}
function formatDate(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function jsonFetch(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "User-Agent": UA,
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`nasdaq HTTP ${res.status}`);
  return res.json();
}

// Most symbols resolve under assetclass=stocks; pure ETFs fall back to etf.
// Anything else (indices, crypto, forex) errors out — the orchestrator handles it.
const ASSET_CLASSES = ["stocks", "etf"];

async function tryAssetClasses(buildPath) {
  let lastErr;
  for (const cls of ASSET_CLASSES) {
    try {
      const json = await jsonFetch(buildPath(cls));
      if (json?.status?.rCode === 200 && json?.data) return json;
      lastErr = new Error(
        json?.status?.bCodeMessage?.[0]?.errorMessage || "no data"
      );
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error("nasdaq: no data");
}

// Drop "(Common Stock|Class X|ADR)" suffixes Nasdaq appends to company names.
function tidyName(raw, symbol) {
  if (!raw) return symbol;
  return raw
    .replace(/\s+(Common Stock|Class\s+[A-Z]|ADR|Ordinary Shares)$/i, "")
    .trim();
}

function normalizeQuote(data, symbol) {
  const p = data?.primaryData;
  const price = parseMoney(p?.lastSalePrice);
  if (price == null) return null;

  let dayLow = null,
    dayHigh = null;
  const dr = data?.keyStats?.dayrange?.value;
  if (typeof dr === "string") {
    const parts = dr.split(/\s*-\s*/);
    if (parts.length === 2) {
      dayLow = parseMoney(parts[0]);
      dayHigh = parseMoney(parts[1]);
    }
  }

  return {
    symbol: data?.symbol || symbol,
    name: tidyName(data?.companyName, symbol),
    price,
    change: parseMoney(p?.netChange),
    changePercent: parsePercent(p?.percentageChange),
    currency: p?.currency || "USD", // Nasdaq omits currency for US listings
    dayHigh,
    dayLow,
    volume: parseLargeNum(p?.volume),
    marketState: data?.marketStatus || null,
    exchange: data?.exchange || null,
  };
}

export async function quote(symbol) {
  const sym = encodeURIComponent(symbol.toUpperCase());
  const json = await tryAssetClasses((cls) => `/${sym}/info?assetclass=${cls}`);
  const q = normalizeQuote(json.data, symbol);
  if (!q) throw new Error(`nasdaq: no quote for "${symbol}"`);
  return q;
}

export async function quotes(symbols) {
  const out = new Map();
  const unique = [...new Set(symbols)];
  if (unique.length === 0) return out;
  const settled = await Promise.allSettled(unique.map((s) => quote(s)));
  for (const r of settled) {
    if (r.status === "fulfilled" && r.value) out.set(r.value.symbol, r.value);
  }
  return out;
}

export async function history(symbol, cfg /* , range */) {
  // Daily granularity only. Caller's 1d (intraday) request will produce too
  // few/coarse points; the orchestrator's next provider handles that range.
  const today = new Date();
  const from = cfg.ytd
    ? new Date(Date.UTC(today.getUTCFullYear(), 0, 1))
    : new Date(Date.now() - cfg.days * 86_400_000);
  const fromdate = formatDate(from);
  const todate = formatDate(today);
  const sym = encodeURIComponent(symbol.toUpperCase());

  const json = await tryAssetClasses(
    (cls) =>
      `/${sym}/historical?assetclass=${cls}&fromdate=${fromdate}&todate=${todate}&limit=9999`
  );

  const rows = json?.data?.tradesTable?.rows;
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error(`nasdaq: no history for "${symbol}"`);
  }

  const points = [];
  for (const r of rows) {
    const date = parseUSDate(r?.date);
    const close = parseMoney(r?.close);
    if (!date || close == null) continue;
    points.push({
      date,
      open: parseMoney(r?.open) ?? close,
      high: parseMoney(r?.high) ?? close,
      low: parseMoney(r?.low) ?? close,
      close,
    });
  }
  // Nasdaq returns most-recent first; lightweight-charts wants ascending.
  points.sort((a, b) => a.date - b.date);

  if (points.length === 0) throw new Error(`nasdaq: no history for "${symbol}"`);

  return {
    points,
    meta: {
      symbol: symbol.toUpperCase(),
      currency: "USD",
      rangeLabel: cfg.label,
      interval: cfg.interval, // declared label; actual granularity is daily
    },
  };
}
