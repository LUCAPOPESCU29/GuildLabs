/**
 * Yahoo Finance provider — talks to the public v8 chart endpoint directly.
 *
 *   https://query1.finance.yahoo.com/v8/finance/chart/AAPL?range=1d&interval=1d
 *
 * One request returns both the OHLC series and a live quote (price, previous
 * close, day range, volume) in its `meta`. We deliberately avoid the
 * yahoo-finance2 client here: its quote() path runs a crumb/cookie/consent
 * handshake that hammers Yahoo and is the first thing to get 429-throttled by
 * IP — which would take stock charts down with it (Yahoo is the only key-free
 * source for equities). The bare v8 endpoint needs no crumb, so it keeps
 * answering when the handshake is blocked. We still try query1 then query2 so a
 * single throttled host can't sink a request.
 */

export const name = "yahoo";

const HOSTS = ["https://query1.finance.yahoo.com", "https://query2.finance.yahoo.com"];

// A browser-like UA noticeably reduces throttling of bare server requests.
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const PER_HOST_TIMEOUT_MS = 6000;

function num(v) {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/**
 * GET the v8 chart endpoint for `symbol` with the given query params, trying
 * query1 then query2. Returns the parsed `chart.result[0]`. Throws on failure.
 */
async function fetchChart(symbol, params) {
  const qs = new URLSearchParams({ includePrePost: "false", ...params });
  const path = `/v8/finance/chart/${encodeURIComponent(symbol)}?${qs}`;

  let lastErr;
  for (const host of HOSTS) {
    try {
      const res = await fetch(`${host}${path}`, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(PER_HOST_TIMEOUT_MS),
      });
      if (!res.ok) {
        lastErr = new Error(`yahoo HTTP ${res.status}`);
        continue; // throttled/blocked on this host — try the next
      }
      const json = await res.json();
      const result = json?.chart?.result?.[0];
      if (!result) {
        const desc = json?.chart?.error?.description;
        lastErr = new Error(desc || `yahoo: no data for "${symbol}"`);
        continue;
      }
      return result;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error("yahoo: unreachable");
}

function normalizeQuote(meta, symbol) {
  const price = num(meta?.regularMarketPrice);
  if (price == null) return null;
  // Prefer previousClose; on a 1d range Yahoo usually sends only
  // chartPreviousClose, which is the same prior-day close — so either way this
  // yields the true daily change.
  const prev = num(meta.previousClose) ?? num(meta.chartPreviousClose);
  const change = prev != null ? price - prev : null;
  const changePercent = change != null && prev ? (change / prev) * 100 : null;
  return {
    symbol: meta.symbol ?? symbol,
    name: meta.shortName || meta.longName || meta.symbol || symbol,
    price,
    change,
    changePercent,
    currency: meta.currency ?? "USD",
    dayHigh: num(meta.regularMarketDayHigh),
    dayLow: num(meta.regularMarketDayLow),
    volume: num(meta.regularMarketVolume),
    marketState: meta.marketState ?? null,
    exchange: meta.fullExchangeName ?? meta.exchangeName ?? null,
  };
}

export async function quote(symbol) {
  const result = await fetchChart(symbol, { range: "1d", interval: "1d" });
  const data = normalizeQuote(result.meta ?? {}, symbol);
  if (!data) throw new Error(`yahoo: no data for "${symbol}"`);
  return data;
}

export async function quotes(symbols) {
  const out = new Map();
  const unique = [...new Set(symbols)];
  if (unique.length === 0) return out;

  // The keyless batch quote endpoint now requires a crumb, so fan out across
  // per-symbol chart requests. Watchlists are small; failures fall through to
  // Stooq's true batch upstream in the orchestrator.
  const settled = await Promise.allSettled(unique.map((s) => quote(s)));
  for (const r of settled) {
    if (r.status === "fulfilled" && r.value) out.set(r.value.symbol, r.value);
  }
  return out;
}

// Intraday granularities (minutes/hours). Yahoo silently truncates these when
// queried with period1/period2 — it only returns the full intraday series for a
// `range` query (e.g. range=1d&interval=5m). Daily/weekly intervals are fine
// with period1/period2, which let us request an exact lookback window.
const INTRADAY = /[mh]$/;

export async function history(symbol, cfg, range) {
  let params;
  if (INTRADAY.test(cfg.interval) && range) {
    // range here is a RANGES key ("1d", "5d") — also a valid Yahoo range value.
    params = { range, interval: cfg.interval };
  } else {
    const period2 = Math.floor(Date.now() / 1000);
    const start = cfg.ytd
      ? new Date(new Date().getFullYear(), 0, 1)
      : new Date(Date.now() - cfg.days * 86_400_000);
    const period1 = Math.floor(start.getTime() / 1000);
    params = {
      period1: String(period1),
      period2: String(period2),
      interval: cfg.interval,
    };
  }

  const result = await fetchChart(symbol, params);

  const ts = Array.isArray(result.timestamp) ? result.timestamp : [];
  const q = result.indicators?.quote?.[0] ?? {};
  const opens = q.open ?? [];
  const highs = q.high ?? [];
  const lows = q.low ?? [];
  const closes = q.close ?? [];
  const volumes = q.volume ?? [];

  const points = [];
  for (let i = 0; i < ts.length; i++) {
    const close = num(closes[i]);
    if (!Number.isFinite(ts[i]) || close == null) continue; // skip gap/null rows
    points.push({
      date: new Date(ts[i] * 1000),
      open: num(opens[i]) ?? close,
      high: num(highs[i]) ?? close,
      low: num(lows[i]) ?? close,
      close,
      volume: num(volumes[i]),
    });
  }

  if (points.length === 0) throw new Error(`yahoo: no history for "${symbol}"`);

  const meta = result.meta ?? {};
  return {
    points,
    meta: {
      symbol: meta.symbol ?? symbol,
      currency: meta.currency ?? "USD",
      rangeLabel: cfg.label,
      interval: cfg.interval,
    },
  };
}
