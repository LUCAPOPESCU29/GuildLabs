/**
 * Renders a market heatmap as a PNG — a uniform grid of tiles, one per ticker,
 * each coloured by its daily % change (red for down, neutral slate at flat,
 * green for up) with the change clamped to ±5% so a single wild mover doesn't
 * wash out the rest of the grid.
 *
 * No charting library here — it's a plain HTML/CSS grid screenshotted in the
 * shared headless browser (see ./browser.js). Tile colours are computed in Node
 * and baked into inline styles so the page itself stays trivially static.
 */

import { renderWithPage } from "./browser.js";

const COLS = 6;          // tiles per row
const TILE_W = 118;
const TILE_H = 66;
const GAP = 6;
const PAD = 18;
const CLAMP_PCT = 5;     // % change at which a tile reaches full green/red

// Endpoints for the colour ramp: neutral slate → brand green / brand red.
const NEUTRAL = [0x2b, 0x2f, 0x36];
const GREEN = [0x16, 0xc7, 0x84];
const RED = [0xea, 0x39, 0x43];

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

/** Interpolated tile colour for a percent change, as a #rrggbb string. */
function tileColor(pct) {
  if (pct == null || Number.isNaN(pct)) return rgb(NEUTRAL);
  const t = Math.max(-1, Math.min(1, pct / CLAMP_PCT));
  const target = t >= 0 ? GREEN : RED;
  const m = Math.abs(t);
  return rgb([
    lerp(NEUTRAL[0], target[0], m),
    lerp(NEUTRAL[1], target[1], m),
    lerp(NEUTRAL[2], target[2], m),
  ]);
}

function rgb([r, g, b]) {
  return `rgb(${r},${g},${b})`;
}

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function fmtPct(pct) {
  if (pct == null || Number.isNaN(pct)) return "—";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

/** Strip a trailing "-USD" so crypto tiles read "BTC" not "BTC-USD". */
function tileLabel(symbol) {
  return String(symbol).replace(/-USD$/i, "");
}

/**
 * @param {{symbol: string, changePercent: number|null}[]} tiles
 * @param {{title: string}} meta
 * @returns {Promise<Buffer>}
 */
export async function buildHeatmapImage(tiles, meta) {
  if (!tiles?.length) throw new Error("No tickers to render.");

  // Strongest movers first so the grid leads with the action.
  const ordered = [...tiles].sort(
    (a, b) => (b.changePercent ?? -Infinity) - (a.changePercent ?? -Infinity)
  );

  const rows = Math.ceil(ordered.length / COLS);
  const cardWidth = PAD * 2 + COLS * TILE_W + (COLS - 1) * GAP;
  const cardHeight = PAD * 2 + 44 /* header */ + rows * TILE_H + (rows - 1) * GAP;

  return renderWithPage(async (page) => {
    await page.setViewport({
      width: cardWidth + 40,
      height: cardHeight + 40,
      deviceScaleFactor: 2,
    });
    await page.setContent(html(ordered, meta, cardWidth), { waitUntil: "load" });

    const card = await page.$("#card");
    const shot = await card.screenshot({ type: "png", omitBackground: true });
    return Buffer.from(shot);
  });
}

function html(tiles, meta, cardWidth) {
  const cells = tiles
    .map((t) => {
      const bg = tileColor(t.changePercent);
      return `<div class="tile" style="background:${bg}">
        <div class="sym">${escapeHtml(tileLabel(t.symbol))}</div>
        <div class="pct">${escapeHtml(fmtPct(t.changePercent))}</div>
      </div>`;
    })
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { background: transparent; }
    #card {
      width: ${cardWidth}px; background: #0a0a0c;
      border: 1px solid rgba(255,255,255,0.08); border-radius: 16px;
      padding: ${PAD}px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #head { color: #fff; font-size: 18px; font-weight: 700; letter-spacing: 0.3px; margin-bottom: 14px; }
    #head span { color: rgba(255,255,255,0.4); font-weight: 600; font-size: 13px; }
    #grid {
      display: grid;
      grid-template-columns: repeat(${COLS}, ${TILE_W}px);
      gap: ${GAP}px;
    }
    .tile {
      height: ${TILE_H}px; border-radius: 8px;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      color: #fff;
    }
    .sym { font-size: 15px; font-weight: 700; letter-spacing: 0.3px; }
    .pct { font-size: 12px; font-weight: 600; opacity: 0.92; margin-top: 2px; }
  </style></head>
  <body><div id="card">
    <div id="head">📊 Market heatmap <span>· ${escapeHtml(meta.title ?? "")}</span></div>
    <div id="grid">${cells}</div>
  </div></body></html>`;
}
