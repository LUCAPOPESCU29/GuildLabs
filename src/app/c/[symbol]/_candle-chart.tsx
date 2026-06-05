"use client";

import * as React from "react";

// GuildLabs candlestick chart — hand-built, no third-party charting runtime.
//
// Why Canvas (not SVG): an intraday range can hold a few hundred bars, and the
// whole point of this rewrite was buttery pan/zoom (the old lib felt laggy and
// couldn't zoom out). A single <canvas> repainted inside requestAnimationFrame
// keeps every interaction off React's render path — pointer/wheel handlers only
// mutate refs and schedule a frame, so dragging never triggers a re-render. All
// the imperative machinery lives in one mount effect as plain closures; the data
// effect reaches it through apiRef so React Compiler can reason about the rest.

// Colours are not hard-coded: they're resolved from the FORGE design tokens
// (globals.css) at runtime so the chart shares the site's exact palette and
// reacts to light/dark theme switches. The chart runs a purple + green scheme:
// green (`--success`) for up bars, violet (`--secondary`) for down bars, with
// the blurple `--primary` on the crosshair chips. Grid / axis text map to the
// same surface/foreground tokens the rest of the UI uses. See `resolvePalette()`.
const FONT = "12px ui-monospace, SFMono-Regular, Menlo, Monaco, monospace";

interface Palette {
  up: string;
  down: string;
  grid: string;
  gridSoft: string;
  axisText: string;
  cross: string;
  chipBg: string;
  chipText: string;
  onColorText: string;
  legendLabel: string;
  ma: string[]; // distinct overlay-line colours, one per moving average
}

// Moving-average overlay colours — kept constant (not theme tokens) and distinct
// from the green/purple candles so the indicator lines read as separate.
export const MA_COLORS = ["#e0a93b", "#5b9cf0", "#d678d6"];

// Plot insets: room for the right-hand price axis + bottom time axis.
const PRICE_W = 60;
const TIME_H = 22;
const PAD = 10;

export type ChartType = "candles" | "area";

export interface Candle {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number | null;
}

interface View {
  from: number; // left-most visible bar index (fractional, may be < 0)
  to: number; // right-most visible bar index (fractional, may exceed length)
}

interface CandleChartProps {
  candles: Candle[];
  interval: string;
  currency?: string;
  range: string;
  className?: string;
  chartType?: ChartType;
  showVolume?: boolean;
  mas?: number[]; // SMA periods to overlay, e.g. [20, 50]; empty = none
}

// ── Number / time formatting ─────────────────────────────────────────────────
function fmtPrice(n: number): string {
  const digits = Math.abs(n) < 1 ? 6 : 2;
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: digits,
  });
}

function fmtTimeLabel(sec: number, intraday: boolean): string {
  const d = new Date(sec * 1000);
  if (intraday) {
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// "Nice" axis ticks (1/2/5 × 10ⁿ) so the price grid lands on round numbers.
function niceNum(range: number, round: boolean): number {
  const exp = Math.floor(Math.log10(range));
  const frac = range / Math.pow(10, exp);
  let nice: number;
  if (round) {
    nice = frac < 1.5 ? 1 : frac < 3 ? 2 : frac < 7 ? 5 : 10;
  } else {
    nice = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10;
  }
  return nice * Math.pow(10, exp);
}

function priceTicks(min: number, max: number, count = 5): number[] {
  if (!(max > min)) return [min];
  const range = niceNum(max - min, false);
  const step = niceNum(range / Math.max(1, count - 1), true);
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + step * 0.5; v += step) {
    ticks.push(Math.round(v / step) * step); // kill float drift
  }
  return ticks;
}

// Simple moving average over close prices. Returns an array the same length as
// `cs`; entries before the period is reached are null (nothing to plot yet).
function computeSMA(cs: Candle[], period: number): Array<number | null> {
  const out: Array<number | null> = new Array(cs.length).fill(null);
  if (period <= 0 || cs.length < period) return out;
  let sum = 0;
  for (let i = 0; i < cs.length; i++) {
    sum += cs[i].close;
    if (i >= period) sum -= cs[i - period].close;
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

// Compact volume formatting: 12.3M, 4.5K, etc.
function fmtVol(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(Math.round(n));
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export default function CandleChart({
  candles,
  interval,
  currency,
  range,
  className,
  chartType = "candles",
  showVolume = true,
  mas = [],
}: CandleChartProps) {
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  // Live state the imperative renderer reads/writes (never triggers re-render).
  const candlesRef = React.useRef<Candle[]>(candles);
  const intervalRef = React.useRef(interval);
  const viewRef = React.useRef<View>({ from: 0, to: 1 });
  const rangeRef = React.useRef<string | null>(null);
  const prevLenRef = React.useRef(0);
  const chartTypeRef = React.useRef<ChartType>(chartType);
  const showVolumeRef = React.useRef(showVolume);
  const masRef = React.useRef<number[]>(mas);

  // Bridge to the mount-effect closures so the data effect can drive a repaint.
  const apiRef = React.useRef<{
    schedule: () => void;
    fit: () => void;
    reset: () => void;
  } | null>(null);

  // ── Build the whole renderer once, on mount ─────────────────────────────────
  React.useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resolve the FORGE design tokens to concrete sRGB colours. Canvas works in
    // sRGB and serialises whatever you assign to fillStyle back as #rrggbb, so
    // we round-trip each token (which may be authored in oklch) through it; that
    // also lets us derive translucent variants as rgba(). Re-run on theme change.
    const resolvePalette = (): Palette => {
      const s = getComputedStyle(wrap);
      const tok = (name: string, fallback: string) =>
        s.getPropertyValue(name).trim() || fallback;
      const hex = (color: string): string => {
        ctx.fillStyle = "#000000";
        ctx.fillStyle = color;
        return typeof ctx.fillStyle === "string" ? ctx.fillStyle : "#000000";
      };
      const rgb = (color: string): [number, number, number] => {
        const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex(color));
        return m
          ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
          : [255, 255, 255];
      };
      const rgba = (color: string, a: number) => {
        const [r, g, b] = rgb(color);
        return `rgba(${r},${g},${b},${a})`;
      };
      const fg = tok("--foreground", "#ffffff");
      const border = tok("--card-border", "#3a3a55");
      return {
        up: hex(tok("--success", "oklch(0.78 0.15 158)")),
        down: hex(tok("--secondary", "oklch(0.72 0.16 300)")),
        grid: rgba(border, 0.55),
        gridSoft: rgba(border, 0.3),
        axisText: hex(tok("--muted-foreground", "rgba(255,255,255,0.6)")),
        cross: rgba(fg, 0.38),
        chipBg: hex(tok("--primary", "#6b73ff")),
        chipText: hex(tok("--primary-foreground", "#0b0f1a")),
        onColorText: hex(tok("--background-deep", "#0b0f18")),
        legendLabel: rgba(fg, 0.5),
        ma: MA_COLORS,
      };
    };
    let pal = resolvePalette();

    const size = { w: 0, h: 0 };
    const crosshair = { x: 0, y: 0, on: false };
    const drag = { on: false, lastX: 0 };
    const pointers = new Map<number, { x: number; y: number }>();
    let pinchDist: number | null = null;
    let raf: number | null = null;

    const intraday = () =>
      intervalRef.current.endsWith("m") || intervalRef.current.endsWith("h");

    const layout = () => {
      const top = PAD;
      const bottom = size.h - TIME_H;
      const innerH = bottom - top;
      // When volume is on, reserve a band at the bottom of the plot for it and a
      // small gap so the bars don't crowd the price area.
      const volH = showVolumeRef.current ? Math.max(28, Math.round(innerH * 0.16)) : 0;
      const gap = volH > 0 ? 8 : 0;
      const priceTop = top;
      const priceBottom = bottom - volH - gap;
      return {
        w: size.w,
        h: size.h,
        left: PAD,
        top,
        right: size.w - PRICE_W,
        bottom,
        plotW: size.w - PRICE_W - PAD,
        plotH: innerH,
        priceTop,
        priceBottom,
        pricePlotH: priceBottom - priceTop,
        volTop: priceBottom + gap,
        volBottom: bottom,
        volH,
      };
    };

    const barWidth = () => {
      const v = viewRef.current;
      return layout().plotW / (v.to - v.from);
    };
    const xForIndex = (i: number) => {
      const v = viewRef.current;
      const L = layout();
      return L.left + (i - v.from) * (L.plotW / (v.to - v.from));
    };
    const indexForX = (x: number) => {
      const v = viewRef.current;
      const L = layout();
      return v.from + ((x - L.left) / L.plotW) * (v.to - v.from);
    };

    const priceRange = () => {
      const cs = candlesRef.current;
      const v = viewRef.current;
      let lo = Infinity;
      let hi = -Infinity;
      const start = Math.max(0, Math.floor(v.from));
      const end = Math.min(cs.length - 1, Math.ceil(v.to));
      for (let i = start; i <= end; i++) {
        if (cs[i].low < lo) lo = cs[i].low;
        if (cs[i].high > hi) hi = cs[i].high;
      }
      if (!isFinite(lo) || !isFinite(hi)) {
        for (const c of cs) {
          if (c.low < lo) lo = c.low;
          if (c.high > hi) hi = c.high;
        }
      }
      if (!isFinite(lo) || !isFinite(hi)) return { lo: 0, hi: 1 };
      const pad = (hi - lo) * 0.08 || Math.abs(hi) * 0.01 || 1;
      return { lo: lo - pad, hi: hi + pad };
    };

    const fit = () => {
      const len = candlesRef.current.length;
      if (len === 0) return;
      const rightPad = Math.max(2, Math.round(len * 0.04));
      viewRef.current = { from: -1, to: len + rightPad };
    };

    // ── The single source of pixels ──
    const draw = () => {
      const L = layout();
      const cs = candlesRef.current;
      if (L.w === 0 || L.h === 0) return;

      ctx.clearRect(0, 0, L.w, L.h);
      ctx.font = FONT;
      ctx.textBaseline = "middle";

      const { lo, hi } = priceRange();
      const span = hi - lo || 1;
      const yForPrice = (p: number) => L.priceTop + ((hi - p) / span) * L.pricePlotH;
      const priceForY = (y: number) => hi - ((y - L.priceTop) / L.pricePlotH) * span;

      // price grid + right-axis labels
      ctx.textAlign = "left";
      for (const p of priceTicks(lo, hi, 5)) {
        const y = yForPrice(p);
        if (y < L.priceTop - 1 || y > L.priceBottom + 1) continue;
        ctx.strokeStyle = pal.grid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(L.left, Math.round(y) + 0.5);
        ctx.lineTo(L.right, Math.round(y) + 0.5);
        ctx.stroke();
        ctx.fillStyle = pal.axisText;
        ctx.fillText(fmtPrice(p), L.right + 6, y);
      }

      // time grid + bottom-axis labels
      const bw = barWidth();
      const v = viewRef.current;
      ctx.textAlign = "center";
      const maxLabels = Math.max(2, Math.floor(L.plotW / 64));
      const stride = Math.max(1, Math.ceil((v.to - v.from) / maxLabels));
      const first = Math.max(0, Math.floor(v.from));
      const last = Math.min(cs.length - 1, Math.ceil(v.to));
      const intra = intraday();
      for (let i = first; i <= last; i++) {
        if (i % stride !== 0) continue;
        const x = xForIndex(i + 0.5);
        if (x < L.left || x > L.right) continue;
        ctx.strokeStyle = pal.gridSoft;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(Math.round(x) + 0.5, L.top);
        ctx.lineTo(Math.round(x) + 0.5, L.bottom);
        ctx.stroke();
        ctx.fillStyle = pal.axisText;
        ctx.fillText(fmtTimeLabel(cs[i].time, intra), x, L.bottom + TIME_H / 2 + 1);
      }

      const drawFrom = Math.max(0, Math.floor(v.from) - 1);
      const drawTo = Math.min(cs.length - 1, Math.ceil(v.to) + 1);

      // ── volume band (drawn first so price sits on top) ──
      if (L.volH > 0 && cs.length > 0) {
        let volMax = 0;
        for (let i = Math.max(0, Math.floor(v.from)); i <= Math.min(cs.length - 1, Math.ceil(v.to)); i++) {
          const vol = cs[i].volume;
          if (typeof vol === "number" && vol > volMax) volMax = vol;
        }
        if (volMax > 0) {
          const vbW = Math.max(1, bw * 0.7);
          ctx.save();
          ctx.beginPath();
          ctx.rect(L.left, L.volTop, L.plotW, L.volH);
          ctx.clip();
          ctx.globalAlpha = 0.45;
          for (let i = drawFrom; i <= drawTo; i++) {
            const c = cs[i];
            const vol = c.volume;
            if (typeof vol !== "number" || vol <= 0) continue;
            const cx = xForIndex(i + 0.5);
            if (cx < L.left - bw || cx > L.right + bw) continue;
            const barH = (vol / volMax) * L.volH;
            ctx.fillStyle = c.close >= c.open ? pal.up : pal.down;
            ctx.fillRect(cx - vbW / 2, L.volBottom - barH, vbW, Math.max(1, barH));
          }
          ctx.restore();
        }
      }

      // ── price series: candles or area, clipped to the price region ──
      const bodyW = Math.max(1, bw * 0.7);
      ctx.save();
      ctx.beginPath();
      ctx.rect(L.left, L.priceTop, L.plotW, L.pricePlotH);
      ctx.clip();
      if (chartTypeRef.current === "area") {
        // direction over the visible range tints the area green/purple
        const vf = cs[Math.max(0, Math.min(cs.length - 1, Math.floor(v.from < 0 ? 0 : v.from)))];
        const vl = cs[Math.min(cs.length - 1, Math.max(0, Math.ceil(v.to) - 1))];
        const rising = !!vf && !!vl && vl.close >= vf.close;
        const lineCol = rising ? pal.up : pal.down;
        const pts: Array<[number, number]> = [];
        for (let i = drawFrom; i <= drawTo; i++) {
          pts.push([xForIndex(i + 0.5), yForPrice(cs[i].close)]);
        }
        if (pts.length > 0) {
          const grad = ctx.createLinearGradient(0, L.priceTop, 0, L.priceBottom);
          const [gr, gg, gb] = (() => {
            const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(lineCol);
            return m
              ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
              : [120, 120, 120];
          })();
          grad.addColorStop(0, `rgba(${gr},${gg},${gb},0.32)`);
          grad.addColorStop(1, `rgba(${gr},${gg},${gb},0.02)`);
          ctx.beginPath();
          ctx.moveTo(pts[0][0], pts[0][1]);
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
          ctx.lineTo(pts[pts.length - 1][0], L.priceBottom);
          ctx.lineTo(pts[0][0], L.priceBottom);
          ctx.closePath();
          ctx.fillStyle = grad;
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(pts[0][0], pts[0][1]);
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
          ctx.strokeStyle = lineCol;
          ctx.lineWidth = 1.5;
          ctx.lineJoin = "round";
          ctx.stroke();
        }
      } else {
        for (let i = drawFrom; i <= drawTo; i++) {
          const c = cs[i];
          const cx = xForIndex(i + 0.5);
          if (cx < L.left - bw || cx > L.right + bw) continue;
          const up = c.close >= c.open;
          const color = up ? pal.up : pal.down;
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(Math.round(cx) + 0.5, yForPrice(c.high));
          ctx.lineTo(Math.round(cx) + 0.5, yForPrice(c.low));
          ctx.stroke();
          const yTop = yForPrice(Math.max(c.open, c.close));
          const yBot = yForPrice(Math.min(c.open, c.close));
          ctx.fillStyle = color;
          ctx.fillRect(cx - bodyW / 2, yTop, bodyW, Math.max(1, yBot - yTop));
        }
      }

      // ── moving-average overlays (inside the same price clip) ──
      const periods = masRef.current;
      if (periods.length > 0) {
        for (let mi = 0; mi < periods.length; mi++) {
          const series = computeSMA(cs, periods[mi]);
          ctx.strokeStyle = pal.ma[mi % pal.ma.length];
          ctx.lineWidth = 1.5;
          ctx.lineJoin = "round";
          ctx.beginPath();
          let started = false;
          for (let i = drawFrom; i <= drawTo; i++) {
            const val = series[i];
            if (val == null) {
              started = false;
              continue;
            }
            const x = xForIndex(i + 0.5);
            const y = yForPrice(val);
            if (!started) {
              ctx.moveTo(x, y);
              started = true;
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        }
      }
      ctx.restore();

      // last-price dashed line + axis chip (subtle "live" cue)
      if (cs.length > 0) {
        const lastC = cs[cs.length - 1];
        const ly = yForPrice(lastC.close);
        if (ly >= L.priceTop && ly <= L.priceBottom) {
          const col = lastC.close >= lastC.open ? pal.up : pal.down;
          ctx.save();
          ctx.strokeStyle = col;
          ctx.globalAlpha = 0.5;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(L.left, Math.round(ly) + 0.5);
          ctx.lineTo(L.right, Math.round(ly) + 0.5);
          ctx.stroke();
          ctx.restore();
          const label = fmtPrice(lastC.close);
          const tw = ctx.measureText(label).width;
          ctx.fillStyle = col;
          roundRect(ctx, L.right + 2, ly - 9, Math.min(tw + 10, PRICE_W - 4), 18, 5);
          ctx.fill();
          ctx.fillStyle = pal.onColorText;
          ctx.textAlign = "left";
          ctx.fillText(label, L.right + 7, ly);
        }
      }

      // ── always-on moving-average legend (top-left, first row) ──
      const maPeriods = masRef.current;
      if (maPeriods.length > 0 && cs.length > 0) {
        ctx.textAlign = "left";
        let mlx = L.left + 4;
        const mly = L.top + 9;
        for (let mi = 0; mi < maPeriods.length; mi++) {
          const series = computeSMA(cs, maPeriods[mi]);
          let lastVal: number | null = null;
          for (let i = series.length - 1; i >= 0; i--) {
            if (series[i] != null) {
              lastVal = series[i];
              break;
            }
          }
          const label = `MA${maPeriods[mi]}`;
          const valText = lastVal != null ? ` ${fmtPrice(lastVal)}` : "";
          ctx.fillStyle = pal.ma[mi % pal.ma.length];
          ctx.fillText(label + valText, mlx, mly);
          mlx += ctx.measureText(label + valText).width + 12;
        }
      }
      // OHLC hover legend drops to a second row when the MA legend owns the first.
      const ohlcRowY = maPeriods.length > 0 ? L.top + 25 : L.top + 9;

      // crosshair + hovered-candle OHLC legend
      if (crosshair.on && !drag.on) {
        const idx = Math.floor(indexForX(crosshair.x));
        const hasBar = idx >= 0 && idx < cs.length;
        const snapX = hasBar ? xForIndex(idx + 0.5) : crosshair.x;

        ctx.save();
        ctx.strokeStyle = pal.cross;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        if (snapX >= L.left && snapX <= L.right) {
          ctx.beginPath();
          ctx.moveTo(Math.round(snapX) + 0.5, L.top);
          ctx.lineTo(Math.round(snapX) + 0.5, L.bottom);
          ctx.stroke();
        }
        if (crosshair.y >= L.priceTop && crosshair.y <= L.priceBottom) {
          ctx.beginPath();
          ctx.moveTo(L.left, Math.round(crosshair.y) + 0.5);
          ctx.lineTo(L.right, Math.round(crosshair.y) + 0.5);
          ctx.stroke();
        }
        ctx.restore();

        if (crosshair.y >= L.priceTop && crosshair.y <= L.priceBottom) {
          const plabel = fmtPrice(priceForY(crosshair.y));
          const tw = ctx.measureText(plabel).width;
          ctx.fillStyle = pal.chipBg;
          roundRect(ctx, L.right + 2, crosshair.y - 9, Math.min(tw + 10, PRICE_W - 4), 18, 5);
          ctx.fill();
          ctx.fillStyle = pal.chipText;
          ctx.textAlign = "left";
          ctx.fillText(plabel, L.right + 7, crosshair.y);
        }
        if (hasBar && snapX >= L.left && snapX <= L.right) {
          const tlabel = fmtTimeLabel(cs[idx].time, intra);
          const tw = ctx.measureText(tlabel).width;
          const cxp = Math.max(L.left + tw / 2 + 4, Math.min(snapX, L.right - tw / 2 - 4));
          ctx.fillStyle = pal.chipBg;
          roundRect(ctx, cxp - tw / 2 - 5, L.bottom + 2, tw + 10, 18, 5);
          ctx.fill();
          ctx.fillStyle = pal.chipText;
          ctx.textAlign = "center";
          ctx.fillText(tlabel, cxp, L.bottom + 11);
        }

        if (hasBar) {
          const c = cs[idx];
          const up = c.close >= c.open;
          const pct = c.open !== 0 ? ((c.close - c.open) / c.open) * 100 : 0;
          const parts: Array<[string, string]> = [
            ["O", fmtPrice(c.open)],
            ["H", fmtPrice(c.high)],
            ["L", fmtPrice(c.low)],
            ["C", fmtPrice(c.close)],
          ];
          if (typeof c.volume === "number" && c.volume > 0) {
            parts.push(["V", fmtVol(c.volume)]);
          }
          ctx.textAlign = "left";
          let lx = L.left + 4;
          const ly = ohlcRowY;
          for (const [k, val] of parts) {
            ctx.fillStyle = pal.legendLabel;
            ctx.fillText(k, lx, ly);
            lx += ctx.measureText(k).width + 4;
            ctx.fillStyle = up ? pal.up : pal.down;
            ctx.fillText(val, lx, ly);
            lx += ctx.measureText(val).width + 12;
          }
          ctx.fillStyle = up ? pal.up : pal.down;
          ctx.fillText(`${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`, lx, ly);
        }
      }
    };

    const schedule = () => {
      if (raf != null) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        draw();
      });
    };

    const applySize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      size.w = rect.width;
      size.h = rect.height;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      schedule();
    };

    const reset = () => {
      fit();
      schedule();
    };

    // Expose the bits the data effect needs, then do the first layout.
    apiRef.current = { schedule, fit, reset };
    if (candlesRef.current.length > 0 && rangeRef.current === null) fit();
    applySize();

    const ro = new ResizeObserver(applySize);
    ro.observe(wrap);

    // Recolour when the site theme toggles (next-themes flips the `.dark` class
    // / color-scheme on <html>), so the canvas tracks light/dark like the DOM.
    const themeObs = new MutationObserver(() => {
      pal = resolvePalette();
      schedule();
    });
    themeObs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme"],
    });

    const rect = () => canvas.getBoundingClientRect();
    const relX = (clientX: number) => clientX - rect().left;
    const relY = (clientY: number) => clientY - rect().top;

    const onPointerDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: relX(e.clientX), y: relY(e.clientY) });
      if (pointers.size === 1) {
        drag.on = true;
        drag.lastX = relX(e.clientX);
        crosshair.on = false;
      } else {
        drag.on = false;
        pinchDist = null;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const x = relX(e.clientX);
      const y = relY(e.clientY);
      if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x, y });

      if (pointers.size >= 2) {
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        const mid = (a.x + b.x) / 2;
        if (pinchDist != null) {
          const v = viewRef.current;
          const L = layout();
          const sp = v.to - v.from;
          const anchor = v.from + ((mid - L.left) / L.plotW) * sp;
          let factor = pinchDist / dist;
          let newSpan = sp * factor;
          const maxSpan = Math.max(20, candlesRef.current.length * 4);
          newSpan = Math.min(Math.max(newSpan, 3), maxSpan);
          factor = newSpan / sp;
          v.from = anchor - (anchor - v.from) * factor;
          v.to = v.from + newSpan;
        }
        pinchDist = dist;
        schedule();
        return;
      }

      if (drag.on) {
        const dx = x - drag.lastX;
        drag.lastX = x;
        const shift = dx / barWidth();
        const v = viewRef.current;
        v.from -= shift;
        v.to -= shift;
        schedule();
        return;
      }

      crosshair.x = x;
      crosshair.y = y;
      crosshair.on = true;
      schedule();
    };

    const endPointer = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchDist = null;
      if (pointers.size === 0) drag.on = false;
    };

    const onPointerLeave = () => {
      crosshair.on = false;
      schedule();
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const x = relX(e.clientX);
      const v = viewRef.current;
      const L = layout();
      const sp = v.to - v.from;
      const anchor = v.from + ((x - L.left) / L.plotW) * sp;
      let factor = e.deltaY > 0 ? 1.1 : 1 / 1.1; // down = zoom out
      let newSpan = sp * factor;
      const maxSpan = Math.max(20, candlesRef.current.length * 4);
      newSpan = Math.min(Math.max(newSpan, 3), maxSpan);
      factor = newSpan / sp;
      v.from = anchor - (anchor - v.from) * factor;
      v.to = v.from + newSpan;
      schedule();
    };

    const onDblClick = (e: MouseEvent) => {
      e.preventDefault();
      reset();
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", endPointer);
    canvas.addEventListener("pointercancel", endPointer);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("dblclick", onDblClick);

    return () => {
      apiRef.current = null;
      ro.disconnect();
      themeObs.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", endPointer);
      canvas.removeEventListener("pointercancel", endPointer);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("dblclick", onDblClick);
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, []);

  // ── Reconcile incoming data without resetting the user's pan/zoom ────────────
  React.useEffect(() => {
    candlesRef.current = candles;
    intervalRef.current = interval;
    chartTypeRef.current = chartType;
    showVolumeRef.current = showVolume;
    masRef.current = mas;
    // currency is part of the props contract but the renderer formats numbers
    // without a currency symbol; reference it so the dep stays honest.
    void currency;

    const api = apiRef.current;
    const prevLen = prevLenRef.current;
    if (rangeRef.current !== range || prevLen === 0) {
      // First paint or range switch: fit the whole set once.
      api?.fit();
      rangeRef.current = range;
    } else if (candles.length !== prevLen) {
      // New bar(s) on a live poll: follow the right edge only if the user was
      // already looking at it; otherwise leave their view untouched.
      const diff = candles.length - prevLen;
      if (viewRef.current.to >= prevLen) {
        viewRef.current.from += diff;
        viewRef.current.to += diff;
      }
    }
    prevLenRef.current = candles.length;
    api?.schedule();
  }, [candles, interval, currency, range, chartType, showVolume, mas]);

  return (
    <div ref={wrapRef} className={className}>
      <canvas ref={canvasRef} style={{ display: "block", touchAction: "none" }} />
      <button
        type="button"
        onClick={() => apiRef.current?.reset()}
        title="Reset zoom (or double-click the chart)"
        aria-label="Reset zoom"
        className="absolute bottom-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-card-border text-muted-foreground transition-colors hover:text-foreground"
        style={{
          background: "color-mix(in oklab, var(--card) 78%, transparent)",
          backdropFilter: "blur(8px)",
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 12a9 9 0 1 0 9-9 9 9 0 0 0-6.36 2.64L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>
    </div>
  );
}
