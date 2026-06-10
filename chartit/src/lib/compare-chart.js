/**
 * Renders a multi-ticker comparison chart as a PNG.
 *
 * Unlike chart.js (a single candlestick series), this overlays several line
 * series on one set of axes. Because tickers trade at wildly different absolute
 * prices (BTC in the tens of thousands, a stock in the tens), each series is
 * normalized to its **percent change from its first close** so they're visually
 * comparable on a shared "% change" axis. A small legend lists each symbol with
 * its final return, coloured to match its line.
 *
 * Shares the one headless browser + lightweight-charts build with chart.js via
 * ./browser.js and the exported LWC_SRC.
 */

import { renderWithPage } from "./browser.js";
import { LWC_SRC } from "./chart.js";

// Distinct, legible line colours (brand green first, then a spread that reads
// clearly on the dark card). Supports up to 5 series — the command caps there.
export const COMPARE_COLORS = [
  "#16c784", // brand green
  "#5b9dff", // blue
  "#fbbf24", // amber
  "#c084fc", // purple
  "#fb7185", // rose
];

const CARD_WIDTH = 760;
const CHART_WIDTH = 724;
const CHART_HEIGHT = 360;

/**
 * Convert one symbol's OHLC points into a normalized percent-change line:
 * value = (close / firstClose - 1) * 100, with unique ascending UTC-second times.
 * @returns {{ line: {time:number, value:number}[], finalPct: number|null }}
 */
function toPercentLine(points) {
  const seen = new Set();
  const rows = [];
  for (const p of points ?? []) {
    const time = Math.floor(new Date(p.date).getTime() / 1000);
    const close = Number(p.close);
    if (!Number.isFinite(time) || !Number.isFinite(close) || seen.has(time)) continue;
    seen.add(time);
    rows.push({ time, close });
  }
  rows.sort((a, b) => a.time - b.time);
  if (rows.length === 0) return { line: [], finalPct: null };

  const base = rows[0].close;
  if (!base) return { line: [], finalPct: null };

  const line = rows.map((r) => ({ time: r.time, value: (r.close / base - 1) * 100 }));
  return { line, finalPct: line[line.length - 1].value };
}

/**
 * @param {{symbol: string, points: {date:Date, close:number}[], color: string}[]} series
 * @param {{rangeLabel: string}} meta
 * @returns {Promise<{ png: Buffer, finals: {symbol:string, color:string, finalPct:number|null}[] }>}
 */
export async function buildCompareImage(series, meta) {
  // Build normalized lines; drop any series that yielded no usable points.
  const prepared = [];
  for (const s of series) {
    const { line, finalPct } = toPercentLine(s.points);
    if (line.length === 0) continue;
    prepared.push({ symbol: s.symbol, color: s.color, line, finalPct });
  }
  if (prepared.length < 2) throw new Error("Not enough comparable data to chart.");

  const finals = prepared.map(({ symbol, color, finalPct }) => ({ symbol, color, finalPct }));

  const png = await renderWithPage(async (page) => {
    await page.setViewport({
      width: CARD_WIDTH + 40,
      height: CHART_HEIGHT + 180,
      deviceScaleFactor: 2,
    });
    await page.setContent(shellHtml(meta, prepared), { waitUntil: "load" });
    await page.addScriptTag({ content: LWC_SRC });

    await page.evaluate(
      async ({ prepared, width, height }) => {
        const chart = window.LightweightCharts.createChart(
          document.getElementById("chart"),
          {
            width,
            height,
            layout: {
              background: { type: "solid", color: "#0a0a0c" },
              textColor: "rgba(255,255,255,0.5)",
              fontSize: 12,
              fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
            },
            grid: {
              vertLines: { color: "rgba(255,255,255,0.05)" },
              horzLines: { color: "rgba(255,255,255,0.05)" },
            },
            rightPriceScale: { borderColor: "rgba(255,255,255,0.10)" },
            timeScale: {
              borderColor: "rgba(255,255,255,0.10)",
              timeVisible: false,
              secondsVisible: false,
              fixLeftEdge: true,
              fixRightEdge: true,
            },
            // Format the value axis as a signed percentage.
            localization: {
              priceFormatter: (v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`,
            },
            crosshair: { mode: 0 },
            handleScroll: false,
            handleScale: false,
          }
        );

        for (const s of prepared) {
          const line = chart.addLineSeries({
            color: s.color,
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          line.setData(s.line);
        }
        chart.timeScale().fitContent();

        await new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve))
        );
      },
      { prepared, width: CHART_WIDTH, height: CHART_HEIGHT }
    );

    const card = await page.$("#card");
    const shot = await card.screenshot({ type: "png", omitBackground: true });
    return Buffer.from(shot);
  });

  return { png, finals };
}

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function legendHtml(prepared) {
  return prepared
    .map((s) => {
      const pct =
        s.finalPct == null
          ? ""
          : ` <span class="lp">${s.finalPct >= 0 ? "+" : ""}${s.finalPct.toFixed(2)}%</span>`;
      return `<span class="chip"><span class="dot" style="background:${s.color}"></span>${escapeHtml(s.symbol)}${pct}</span>`;
    })
    .join("");
}

function shellHtml(meta, prepared) {
  const range = escapeHtml(meta.rangeLabel ?? "");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { background: transparent; }
    #card {
      width: ${CARD_WIDTH}px; background: #0a0a0c;
      border: 1px solid rgba(255,255,255,0.08); border-radius: 16px;
      padding: 18px 18px 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 12px; }
    #title { color: #fff; font-size: 20px; font-weight: 700; letter-spacing: 0.3px; }
    #range { color: rgba(255,255,255,0.45); font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; }
    #legend { display: flex; flex-wrap: wrap; gap: 14px; margin-bottom: 12px; }
    .chip { color: rgba(255,255,255,0.85); font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; }
    .dot { width: 10px; height: 10px; border-radius: 50%; margin-right: 6px; display: inline-block; }
    .lp { color: rgba(255,255,255,0.55); font-weight: 600; margin-left: 5px; }
    #chart { width: ${CHART_WIDTH}px; height: ${CHART_HEIGHT}px; position: relative; }
  </style></head>
  <body><div id="card">
    <div id="head"><div id="title">Comparison · % change</div><div id="range">${range}</div></div>
    <div id="legend">${legendHtml(prepared)}</div>
    <div id="chart"></div>
  </div></body></html>`;
}
