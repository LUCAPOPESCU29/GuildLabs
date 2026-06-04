import http from "node:http";
import { getHistory, getQuote, RANGES, DEFAULT_RANGE } from "./market.js";

/**
 * Minimal HTTP server for the bot's host (Fly).
 *
 *   GET /health  — Fly.io healthcheck. Returns { ok, bot }.
 *   GET /chart   — chart-data proxy for the GuildLabs web app. Yahoo hard-blocks
 *                  Vercel's datacenter IPs, so the web route relays intraday
 *                  requests here, where the bot's host can still reach Yahoo.
 *                  Returns the web app's ChartData shape. Optionally gated by
 *                  CHART_PROXY_TOKEN (sent as the x-chart-token header).
 */
export function startHealthServer(client, port = 8080) {
  const PROXY_TOKEN = process.env.CHART_PROXY_TOKEN ?? "";

  const server = http.createServer((req, res) => {
    const json = (status, body) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(body));
    };

    let url;
    try {
      url = new URL(req.url, "http://localhost");
    } catch {
      return json(400, { error: "Bad request" });
    }
    const path = url.pathname;

    if (path === "/health" || path === "/") {
      return json(200, { ok: true, bot: client.user?.tag ?? null });
    }

    if (path === "/chart") {
      if (req.method !== "GET") return json(405, { error: "Method not allowed" });
      if (PROXY_TOKEN && req.headers["x-chart-token"] !== PROXY_TOKEN) {
        return json(401, { error: "Unauthorized" });
      }
      const symbol = (url.searchParams.get("symbol") || "").trim();
      if (!symbol) return json(400, { error: "Missing symbol" });
      const reqRange = url.searchParams.get("range") || DEFAULT_RANGE;
      const range = RANGES[reqRange] ? reqRange : DEFAULT_RANGE;

      buildChartData(symbol, range)
        .then((data) => json(200, data))
        .catch((err) => json(502, { error: err?.message || "chart fetch failed" }));
      return;
    }

    return json(404, { error: "Not found" });
  });

  server.listen(port, () => {
    console.log(`[HEALTH] Listening on http://localhost:${port}/health`);
  });

  return server;
}

function num(v) {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/**
 * Assemble the web app's ChartData object for `symbol`/`range` from the bot's
 * market orchestrator. `noProxy` keeps these calls off the GuildLabs web proxy
 * so a relayed request can't bounce back to the web app (web → bot → web …).
 */
async function buildChartData(symbol, range) {
  const cfg = RANGES[range] ?? RANGES[DEFAULT_RANGE];

  const [histRes, quoteRes] = await Promise.allSettled([
    getHistory(symbol, range, { noProxy: true }),
    getQuote(symbol, { noProxy: true }),
  ]);
  if (histRes.status !== "fulfilled") throw histRes.reason;
  const hist = histRes.value;
  const quote = quoteRes.status === "fulfilled" ? quoteRes.value : null;

  const candles = [];
  const seen = new Set();
  for (const p of hist.points ?? []) {
    const time = Math.floor(new Date(p.date).getTime() / 1000);
    const close = num(p.close);
    if (!Number.isFinite(time) || close == null || seen.has(time)) continue;
    seen.add(time);
    candles.push({
      time,
      open: num(p.open) ?? close,
      high: num(p.high) ?? close,
      low: num(p.low) ?? close,
      close,
    });
  }
  candles.sort((a, b) => a.time - b.time);
  if (candles.length === 0) throw new Error(`no candles for "${symbol}"`);

  const lastClose = candles[candles.length - 1].close;
  const price = quote?.price ?? lastClose;
  const change = quote?.change ?? null;
  const prevClose =
    change != null && price != null
      ? price - change
      : candles.length > 1
        ? candles[candles.length - 2].close
        : candles[0].open;
  const changePercent =
    quote?.changePercent ?? (change != null && prevClose ? (change / prevClose) * 100 : null);

  return {
    symbol: String(quote?.symbol || hist.meta?.symbol || symbol).toUpperCase(),
    name: String(quote?.name || hist.meta?.symbol || symbol),
    currency: quote?.currency || hist.meta?.currency || "USD",
    exchange: quote?.exchange ?? null,
    marketState: quote?.marketState ?? null,
    price,
    prevClose,
    change,
    changePercent,
    dayHigh: quote?.dayHigh ?? null,
    dayLow: quote?.dayLow ?? null,
    volume: quote?.volume ?? null,
    range,
    interval: cfg.interval,
    rangeLabel: cfg.label,
    candles,
  };
}
