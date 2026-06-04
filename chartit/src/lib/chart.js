/**
 * Renders a candlestick chart as a PNG using TradingView's lightweight-charts
 * (https://github.com/tradingview/lightweight-charts).
 *
 * lightweight-charts is a browser/canvas renderer, so there's no way to draw it
 * in plain Node. We load its standalone build into a headless Chromium page,
 * feed it the OHLC data, and screenshot the result. The HTML is set directly on
 * the page (no network round-trip, no localhost server), and the rendered PNG
 * is attached inline to the Discord reply.
 *
 * The browser is launched lazily, reused across renders, and closed after a few
 * idle minutes to keep the bot's resting memory low. Renders are serialized so
 * a burst of commands can't spawn many Chromium pages at once.
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import puppeteer from "puppeteer";

const require = createRequire(import.meta.url);

// The standalone UMD build exposes a global `LightweightCharts`. Resolve it via
// the package root (not a deep subpath) so the package's `exports` map can't
// block the lookup, then read the file once at startup.
const LWC_DIR = dirname(require.resolve("lightweight-charts/package.json"));
const LWC_SRC = readFileSync(
  join(LWC_DIR, "dist", "lightweight-charts.standalone.production.js"),
  "utf8"
);

const UP = "#16c784";
const DOWN = "#ea3943";

const CARD_WIDTH = 760;
const CHART_WIDTH = 724;
const CHART_HEIGHT = 360;

const IDLE_SHUTDOWN_MS = 5 * 60_000;

let browserPromise = null;
let idleTimer = null;

// In Docker we run the system Chromium; locally puppeteer uses its own
// downloaded build (undefined → puppeteer resolves it). Alpine has shipped the
// binary under both names across versions, so probe rather than hardcode.
function chromiumPath() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
  return candidates.find((p) => p && existsSync(p)) || undefined;
}

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer
      .launch({
        headless: true,
        executablePath: chromiumPath(),
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage", // /dev/shm is tiny in containers
          "--disable-gpu",
        ],
      })
      .catch((err) => {
        browserPromise = null; // let the next call retry a fresh launch
        throw err;
      });
  }
  return browserPromise;
}

/** Close the shared browser — called on shutdown and after an idle period. */
export async function closeBrowser() {
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
  const pending = browserPromise;
  browserPromise = null;
  if (!pending) return;
  try {
    const browser = await pending;
    await browser.close();
  } catch {
    // already gone — nothing to clean up
  }
}

function scheduleIdleClose() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(closeBrowser, IDLE_SHUTDOWN_MS);
  idleTimer.unref?.(); // don't keep the process alive for the timer
}

// Run renders one at a time. A page render briefly spikes Chromium's memory, so
// serializing keeps a burst of /chart commands from launching parallel pages.
let chain = Promise.resolve();
function serialize(task) {
  const run = chain.then(task, task);
  chain = run.then(
    () => {},
    () => {}
  );
  return run;
}

/**
 * @param {{date: Date, open: number, high: number, low: number, close: number}[]} points
 * @param {{symbol: string, rangeLabel: string, interval: string}} meta
 * @returns {Promise<Buffer>} a PNG of the candlestick chart
 */
export async function buildChartImage(points, meta) {
  if (!points?.length) throw new Error("No data points to chart.");

  // lightweight-charts requires unique, ascending integer times (UTC seconds).
  const seen = new Set();
  const candles = [];
  for (const p of points) {
    const time = Math.floor(new Date(p.date).getTime() / 1000);
    const close = Number(p.close);
    if (!Number.isFinite(time) || !Number.isFinite(close) || seen.has(time)) continue;
    seen.add(time);
    candles.push({
      time,
      open: Number(p.open ?? close),
      high: Number(p.high ?? close),
      low: Number(p.low ?? close),
      close,
    });
  }
  candles.sort((a, b) => a.time - b.time);
  if (candles.length === 0) throw new Error("No valid candles to chart.");

  const intraday = meta.interval.endsWith("m") || meta.interval.endsWith("h");

  return serialize(async () => {
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
      await page.setViewport({
        width: CARD_WIDTH + 40,
        height: CHART_HEIGHT + 120,
        deviceScaleFactor: 2, // crisp output for retina displays
      });
      const countdown = candleCountdown(points, meta.interval);
      await page.setContent(shellHtml(meta), { waitUntil: "load" });
      await page.addScriptTag({ content: LWC_SRC });

      await page.evaluate(
        async ({ candles, intraday, up, down, width, height, countdown }) => {
          const chart = window.LightweightCharts.createChart(
            document.getElementById("chart"),
            {
              width,
              height,
              layout: {
                background: { type: "solid", color: "#0a0a0c" },
                textColor: "rgba(255,255,255,0.5)",
                fontSize: 12,
                fontFamily:
                  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
              },
              grid: {
                vertLines: { color: "rgba(255,255,255,0.05)" },
                horzLines: { color: "rgba(255,255,255,0.05)" },
              },
              rightPriceScale: { borderColor: "rgba(255,255,255,0.10)" },
              timeScale: {
                borderColor: "rgba(255,255,255,0.10)",
                timeVisible: intraday,
                secondsVisible: false,
                fixLeftEdge: true,
                fixRightEdge: true,
              },
              crosshair: { mode: 0 },
              handleScroll: false,
              handleScale: false,
            }
          );
          const series = chart.addCandlestickSeries({
            upColor: up,
            downColor: down,
            borderUpColor: up,
            borderDownColor: down,
            wickUpColor: up,
            wickDownColor: down,
          });
          series.setData(candles);
          chart.timeScale().fitContent();

          // First settle: let lightweight-charts lay out the time scale so
          // timeToCoordinate() returns valid pixel positions below.
          await new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve))
          );

          // ── Countdown badge on the time axis (TradingView-style) ────────────
          if (countdown) {
            const lastTime = candles[candles.length - 1].time;
            const raw = chart.timeScale().timeToCoordinate(lastTime);
            if (raw !== null) {
              // Keep the centred badge fully on-canvas at the right edge.
              const x = Math.min(Math.max(raw, 28), width - 28);
              const chartEl = document.getElementById("chart");
              const badge = document.createElement("div");
              badge.textContent = countdown;
              Object.assign(badge.style, {
                position: "absolute",
                bottom: "4px",
                left: `${Math.round(x)}px`,
                transform: "translateX(-50%)",
                background: "rgba(251,191,36,0.95)",
                color: "#111",
                fontSize: "10px",
                fontWeight: "700",
                padding: "2px 6px",
                borderRadius: "3px",
                whiteSpace: "nowrap",
                fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
                zIndex: "10",
                pointerEvents: "none",
              });
              chartEl.appendChild(badge);
            }
          }

          // Second settle: paint the freshly-appended badge (and any final
          // chart frame) BEFORE the screenshot is taken — without this the
          // badge is in the DOM but absent from the captured PNG.
          await new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve))
          );
        },
        { candles, intraday, up: UP, down: DOWN, width: CHART_WIDTH, height: CHART_HEIGHT, countdown }
      );

      const card = await page.$("#card");
      const png = await card.screenshot({ type: "png", omitBackground: true });
      return Buffer.from(png);
    } finally {
      await page.close().catch(() => {});
      scheduleIdleClose();
    }
  });
}

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

/** Current time as a Date whose getHours/getMinutes etc. reflect ET (handles DST). */
function nowInET() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
}

/** Format a millisecond duration into a compact countdown string, e.g. "3m 42s". */
function formatCountdown(ms) {
  if (ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

/**
 * Returns a human-readable string for how long until the current candle closes,
 * e.g. "3m 42s", "2h 15m", "1d 4h". Returns null when the candle is already
 * closed or the interval is unrecognised.
 *
 * Intraday candles (5m, 15m …): offset from the last candle's open timestamp so
 * the countdown is anchored to actual Yahoo data, not a UTC-modulo guess.
 * Daily/weekly candles: time until 4 PM ET (NYSE close).
 */
function candleCountdown(points, interval) {
  const minuteMatch = interval.match(/^(\d+)m$/);
  const hourMatch   = interval.match(/^(\d+)h$/);

  if (minuteMatch || hourMatch) {
    if (!points?.length) return null;
    const lastTs     = new Date(points[points.length - 1].date).getTime();
    const intervalMs = minuteMatch
      ? parseInt(minuteMatch[1], 10) * 60_000
      : parseInt(hourMatch[1],   10) * 3_600_000;
    return formatCountdown(lastTs + intervalMs - Date.now());
  }

  if (interval === "1d") {
    const et    = nowInET();
    const close = new Date(et);
    close.setHours(16, 0, 0, 0); // 4 PM ET
    return formatCountdown(close - et);
  }

  if (interval === "1wk") {
    const et        = nowInET();
    const daysToFri = (5 - et.getDay() + 7) % 7; // 0 when today IS Friday
    const close     = new Date(et);
    close.setDate(et.getDate() + daysToFri);
    close.setHours(16, 0, 0, 0); // 4 PM ET
    let ms = close - et;
    if (ms <= 0) {
      // Friday after close (or edge case) — roll to next Friday
      close.setDate(close.getDate() + 7);
      ms = close - et;
    }
    return formatCountdown(ms);
  }

  return null;
}

function shellHtml(meta) {
  const symbol = escapeHtml(meta.symbol ?? "");
  const range  = escapeHtml(meta.rangeLabel ?? "");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { background: transparent; }
    #card {
      width: ${CARD_WIDTH}px; background: #0a0a0c;
      border: 1px solid rgba(255,255,255,0.08); border-radius: 16px;
      padding: 18px 18px 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 14px; }
    #sym  { color: #fff; font-size: 22px; font-weight: 700; letter-spacing: 0.3px; }
    #range{ color: rgba(255,255,255,0.45); font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; }
    /* position:relative lets the JS-injected countdown badge sit inside the chart */
    #chart { width: ${CHART_WIDTH}px; height: ${CHART_HEIGHT}px; position: relative; }
  </style></head>
  <body><div id="card">
    <div id="head"><div id="sym">${symbol}</div><div id="range">${range}</div></div>
    <div id="chart"></div>
  </div></body></html>`;
}
