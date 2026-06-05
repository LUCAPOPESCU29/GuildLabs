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

export type ChartType = "candles" | "hollow" | "heikin" | "area" | "baseline";

// Price-axis mapping. "linear" is plain price; "log" spaces bars by log10(price)
// so equal % moves take equal vertical space (good for long ranges / volatile
// crypto); "percent" keeps linear positioning but relabels the axis as % change
// from the left-most visible bar (percent is a linear function of price, so the
// plotted shape is identical to linear — only the labels differ).
export type PriceScale = "linear" | "log" | "percent";

// Oscillators drawn in stacked sub-panels below the chart. Multiple may be active
// at once (each gets its own pane): RSI(14), MACD(12/26/9), Stochastic(14/3),
// ATR(14), OBV.
export type Indicator = "rsi" | "macd" | "stoch" | "atr" | "obv";

export interface Candle {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number | null;
}

// User drawings, stored in time/price space so they survive pan/zoom + re-fit.
export type DrawTool = "cursor" | "hline" | "trend" | "fib" | "erase";
interface Drawing {
  id: string;
  type: "hline" | "trend" | "fib";
  points: Array<{ t: number; p: number }>; // hline: 1 point (price); trend/fib: 2
}
let _drawSeq = 0;
function genDrawId(): string {
  _drawSeq += 1;
  return `d${Date.now().toString(36)}${_drawSeq}`;
}
const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 1];

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
  priceScale?: PriceScale;
  indicators?: Indicator[]; // stacked oscillator sub-panels below the chart
  bollinger?: boolean; // Bollinger Bands (20, 2σ) overlay on the price series
  symbol?: string; // primary ticker (for drawings key + compare legend)
  compare?: { symbol: string; candles: Candle[] } | null; // overlay (normalized %)
  events?: Array<{ time: number; type: "div" | "split"; text: string }>; // div/split pins
  onToggleFullscreen?: () => void; // invoked by the "F" shortcut
  // UTC seconds of the first candle to *show*. The `candles` array may extend
  // earlier (warmup bars so RSI/MACD/MA are fully defined across the visible
  // window); the initial view starts here and the warmup stays off-screen but
  // pannable. Undefined = show the whole array.
  displayStartTime?: number;
}

// Imperative handle the wrapper can call (e.g. to download a PNG of the chart).
export interface CandleChartHandle {
  exportPng: (filename: string) => void;
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

// Heikin-Ashi transform of an OHLC series (smoothed candles that emphasise trend).
// haClose = (o+h+l+c)/4; haOpen = (prevHaOpen + prevHaClose)/2 (seed = (o+c)/2);
// haHigh/haLow extend to include haOpen/haClose. Same length; volume passthrough.
function computeHeikinAshi(cs: Candle[]): Candle[] {
  const out: Candle[] = new Array(cs.length);
  let prevOpen = 0;
  let prevClose = 0;
  for (let i = 0; i < cs.length; i++) {
    const c = cs[i];
    const haClose = (c.open + c.high + c.low + c.close) / 4;
    const haOpen = i === 0 ? (c.open + c.close) / 2 : (prevOpen + prevClose) / 2;
    const haHigh = Math.max(c.high, haOpen, haClose);
    const haLow = Math.min(c.low, haOpen, haClose);
    out[i] = { time: c.time, open: haOpen, high: haHigh, low: haLow, close: haClose, volume: c.volume };
    prevOpen = haOpen;
    prevClose = haClose;
  }
  return out;
}

// Bollinger Bands: mid = SMA(period), upper/lower = mid ± mult·σ where σ is the
// population standard deviation of the last `period` closes. Same-length, null-
// padded arrays (correct on short ranges thanks to the warmup bars).
function computeBollinger(
  cs: Candle[],
  period = 20,
  mult = 2
): { mid: Array<number | null>; upper: Array<number | null>; lower: Array<number | null> } {
  const mid: Array<number | null> = new Array(cs.length).fill(null);
  const upper: Array<number | null> = new Array(cs.length).fill(null);
  const lower: Array<number | null> = new Array(cs.length).fill(null);
  if (period <= 0 || cs.length < period) return { mid, upper, lower };
  let sum = 0;
  let sumSq = 0;
  for (let i = 0; i < cs.length; i++) {
    const c = cs[i].close;
    sum += c;
    sumSq += c * c;
    if (i >= period) {
      const old = cs[i - period].close;
      sum -= old;
      sumSq -= old * old;
    }
    if (i >= period - 1) {
      const mean = sum / period;
      const variance = Math.max(0, sumSq / period - mean * mean); // guard fp drift
      const sd = Math.sqrt(variance);
      mid[i] = mean;
      upper[i] = mean + mult * sd;
      lower[i] = mean - mult * sd;
    }
  }
  return { mid, upper, lower };
}

// Wilder's RSI over close prices. Returns same-length array; nulls until the
// first value is computable (index `period`).
function computeRSI(cs: Candle[], period = 14): Array<number | null> {
  const out: Array<number | null> = new Array(cs.length).fill(null);
  if (cs.length <= period) return out;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const ch = cs[i].close - cs[i - 1].close;
    if (ch >= 0) gain += ch;
    else loss -= ch;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < cs.length; i++) {
    const ch = cs[i].close - cs[i - 1].close;
    const g = ch > 0 ? ch : 0;
    const l = ch < 0 ? -ch : 0;
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

// Exponential moving average over a plain number series, seeded with the SMA of
// the first `period` values. Same-length output; nulls before `period - 1`.
function computeEMA(values: number[], period: number): Array<number | null> {
  const out: Array<number | null> = new Array(values.length).fill(null);
  if (values.length < period || period <= 0) return out;
  const k = 2 / (period + 1);
  let sum = 0;
  for (let i = 0; i < period; i++) sum += values[i];
  let ema = sum / period;
  out[period - 1] = ema;
  for (let i = period; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
    out[i] = ema;
  }
  return out;
}

// MACD(fast, slow, signal): line = EMAfast - EMAslow, signal = EMA of the line,
// histogram = line - signal. All three are same-length, null-padded arrays.
function computeMACD(
  cs: Candle[],
  fast = 12,
  slow = 26,
  signalPeriod = 9
): { macd: Array<number | null>; signal: Array<number | null>; hist: Array<number | null> } {
  const closes = cs.map((c) => c.close);
  const emaFast = computeEMA(closes, fast);
  const emaSlow = computeEMA(closes, slow);
  const macd: Array<number | null> = closes.map((_, i) =>
    emaFast[i] != null && emaSlow[i] != null ? (emaFast[i] as number) - (emaSlow[i] as number) : null
  );
  // EMA the macd line, but only over its non-null span (then scatter back).
  const compact: number[] = [];
  const idxMap: number[] = [];
  for (let i = 0; i < macd.length; i++) {
    if (macd[i] != null) {
      compact.push(macd[i] as number);
      idxMap.push(i);
    }
  }
  const sigCompact = computeEMA(compact, signalPeriod);
  const signal: Array<number | null> = new Array(cs.length).fill(null);
  for (let j = 0; j < sigCompact.length; j++) {
    if (sigCompact[j] != null) signal[idxMap[j]] = sigCompact[j];
  }
  const hist: Array<number | null> = macd.map((m, i) =>
    m != null && signal[i] != null ? m - (signal[i] as number) : null
  );
  return { macd, signal, hist };
}

// Stochastic oscillator: %K = 100·(close − lowestLow_n)/(highestHigh_n − lowestLow_n),
// %D = SMA(%K, dPeriod). Same-length, null-padded.
function computeStochastic(
  cs: Candle[],
  kPeriod = 14,
  dPeriod = 3
): { k: Array<number | null>; d: Array<number | null> } {
  const k: Array<number | null> = new Array(cs.length).fill(null);
  for (let i = kPeriod - 1; i < cs.length; i++) {
    let hh = -Infinity;
    let ll = Infinity;
    for (let j = i - kPeriod + 1; j <= i; j++) {
      if (cs[j].high > hh) hh = cs[j].high;
      if (cs[j].low < ll) ll = cs[j].low;
    }
    k[i] = hh === ll ? 50 : (100 * (cs[i].close - ll)) / (hh - ll);
  }
  const d: Array<number | null> = new Array(cs.length).fill(null);
  for (let i = kPeriod - 1 + dPeriod - 1; i < cs.length; i++) {
    let sum = 0;
    let cnt = 0;
    for (let j = i - dPeriod + 1; j <= i; j++) {
      const kv = k[j];
      if (kv != null) {
        sum += kv;
        cnt++;
      }
    }
    d[i] = cnt > 0 ? sum / cnt : null;
  }
  return { k, d };
}

// Wilder's Average True Range (volatility). Same-length, null until index `period`.
function computeATR(cs: Candle[], period = 14): Array<number | null> {
  const out: Array<number | null> = new Array(cs.length).fill(null);
  if (cs.length <= period) return out;
  const tr = (i: number) => {
    const pc = cs[i - 1].close;
    return Math.max(cs[i].high - cs[i].low, Math.abs(cs[i].high - pc), Math.abs(cs[i].low - pc));
  };
  let sum = 0;
  for (let i = 1; i <= period; i++) sum += tr(i);
  let atr = sum / period;
  out[period] = atr;
  for (let i = period + 1; i < cs.length; i++) {
    atr = (atr * (period - 1) + tr(i)) / period;
    out[i] = atr;
  }
  return out;
}

// On-Balance Volume: running total of volume signed by close-vs-prevclose.
function computeOBV(cs: Candle[]): Array<number | null> {
  const out: Array<number | null> = new Array(cs.length).fill(null);
  if (cs.length === 0) return out;
  let obv = 0;
  out[0] = 0;
  for (let i = 1; i < cs.length; i++) {
    const vol = typeof cs[i].volume === "number" ? (cs[i].volume as number) : 0;
    if (cs[i].close > cs[i - 1].close) obv += vol;
    else if (cs[i].close < cs[i - 1].close) obv -= vol;
    out[i] = obv;
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

const CandleChart = React.forwardRef<CandleChartHandle, CandleChartProps>(function CandleChart(
  {
    candles,
    interval,
    currency,
    range,
    className,
    chartType = "candles",
    showVolume = true,
    mas = [],
    priceScale = "linear",
    indicators = [],
    bollinger = false,
    symbol,
    compare,
    events,
    onToggleFullscreen,
    displayStartTime,
  },
  ref
) {
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  // Active drawing tool (React state for the toolbar; mirrored to a ref the
  // imperative pointer handlers read).
  const [tool, setTool] = React.useState<DrawTool>("cursor");
  const toolRef = React.useRef<DrawTool>("cursor");
  React.useEffect(() => {
    toolRef.current = tool;
    const c = canvasRef.current;
    if (c) c.style.cursor = tool === "cursor" ? "" : tool === "erase" ? "not-allowed" : "crosshair";
  }, [tool]);

  // Live state the imperative renderer reads/writes (never triggers re-render).
  const candlesRef = React.useRef<Candle[]>(candles);
  const intervalRef = React.useRef(interval);
  const viewRef = React.useRef<View>({ from: 0, to: 1 });
  const rangeRef = React.useRef<string | null>(null);
  const prevLenRef = React.useRef(0);
  const chartTypeRef = React.useRef<ChartType>(chartType);
  const showVolumeRef = React.useRef(showVolume);
  const masRef = React.useRef<number[]>(mas);
  const priceScaleRef = React.useRef<PriceScale>(priceScale);
  const indicatorsRef = React.useRef<Indicator[]>(indicators);
  const bollingerRef = React.useRef<boolean>(bollinger);
  const symbolRef = React.useRef<string | undefined>(symbol);
  const compareRef = React.useRef<{ symbol: string; candles: Candle[] } | null | undefined>(compare);
  const eventsRef = React.useRef(events);
  const onFsRef = React.useRef(onToggleFullscreen);
  const displayStartRef = React.useRef<number | undefined>(displayStartTime);

  // Bridge to the mount-effect closures so the data effect can drive a repaint.
  const apiRef = React.useRef<{
    schedule: () => void;
    fit: () => void;
    reset: () => void;
    exportPng: (filename: string) => void;
  } | null>(null);

  // Expose imperative actions (PNG export) to the wrapper via ref.
  React.useImperativeHandle(
    ref,
    () => ({
      exportPng: (filename: string) => apiRef.current?.exportPng(filename),
    }),
    []
  );

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
    // Shift-drag measurement (Δprice / Δ% / bars between two points).
    const measure = { on: false, x1: 0, y1: 0, x2: 0, y2: 0 };
    const pointers = new Map<number, { x: number; y: number }>();
    let pinchDist: number | null = null;
    let raf: number | null = null;
    // Eased zoom: wheel/reset set a target viewport; the rAF step lerps toward it.
    let viewTarget: View | null = null;
    // Auto-thin: when bars get too narrow we draw a close line instead of bodies.
    // Hysteresis (separate enter/exit thresholds) stops it flickering while zooming.
    let thinMode = false;
    // Low-rate repaint so the last-price marker can gently breathe.
    let pulseRaf: number | null = null;
    let lastPulseTs = 0;
    // Whether the pointer is over the chart — gates keyboard shortcuts.
    let hovered = false;

    const intraday = () =>
      intervalRef.current.endsWith("m") || intervalRef.current.endsWith("h");

    // Regular-session detection (NYSE 9:30–16:00 ET) for intraday shading. The
    // ET formatter is cached, and the per-bar flags are memoised per candle array
    // so we don't re-run Intl every frame.
    let etFmt: Intl.DateTimeFormat | null = null;
    try {
      etFmt = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      etFmt = null;
    }
    const etMinutes = (sec: number): number | null => {
      if (!etFmt) return null;
      let h = 0;
      let m = 0;
      for (const part of etFmt.formatToParts(new Date(sec * 1000))) {
        if (part.type === "hour") h = parseInt(part.value, 10) % 24;
        else if (part.type === "minute") m = parseInt(part.value, 10);
      }
      return h * 60 + m;
    };
    let sessionCache: { ref: Candle[]; flags: boolean[] } | null = null;
    const sessionFlags = (cs: Candle[]): boolean[] => {
      if (sessionCache && sessionCache.ref === cs) return sessionCache.flags;
      const flags = cs.map((c) => {
        const mins = etMinutes(c.time);
        return mins == null ? true : mins >= 570 && mins < 960; // 9:30–16:00 ET
      });
      sessionCache = { ref: cs, flags };
      return flags;
    };

    const layout = () => {
      const top = PAD;
      const bottom = size.h - TIME_H;
      const innerH = bottom - top;
      const gap = 8;
      // Stack from the bottom up: N indicator panes, then volume, then price takes
      // whatever's left. Each band only claims space + a gap when enabled.
      const nInd = indicatorsRef.current.length;
      const paneH = nInd > 0 ? Math.max(36, Math.round(innerH * 0.16)) : 0;
      const volH = showVolumeRef.current ? Math.max(28, Math.round(innerH * 0.16)) : 0;

      // panes ordered top→bottom; the lowest sits just above the time axis
      const indPanes: Array<{ top: number; bottom: number; h: number }> = [];
      for (let i = 0; i < nInd; i++) {
        const pb = bottom - (nInd - 1 - i) * (paneH + gap);
        indPanes.push({ top: pb - paneH, bottom: pb, h: paneH });
      }
      const indRegionTop = nInd > 0 ? indPanes[0].top : bottom;

      const volBottom = nInd > 0 ? indRegionTop - gap : bottom;
      const volTop = volBottom - volH;
      const priceTop = top;
      const priceBottom = volH > 0 ? volTop - gap : nInd > 0 ? indRegionTop - gap : bottom;
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
        volTop,
        volBottom,
        volH,
        indPanes,
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

    // ── drawings: persisted per symbol, stored in time/price space ──
    let drawings: Drawing[] = [];
    let pending: { type: "trend" | "fib"; points: Array<{ t: number; p: number }> } | null = null;
    const pendingCursor = { x: 0, y: 0 };
    // selection + endpoint/body editing (cursor tool)
    let selectedId: string | null = null;
    let editDrag:
      | { id: string; handle: number | "body"; startX: number; startY: number; origin: Array<{ t: number; p: number }> }
      | null = null;
    // last price mapping, refreshed each draw so pointer handlers can invert it
    const mapState = { priceTop: 0, pricePlotH: 1, lo: 0, hi: 1, useLog: false, logHi: 0, logSpan: 1 };
    const drawKey = () => `chartit:drawings:${(symbolRef.current ?? "").toUpperCase()}`;
    try {
      const raw = typeof localStorage !== "undefined" ? localStorage.getItem(drawKey()) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) drawings = parsed;
      }
    } catch {
      // ignore corrupt storage
    }
    const saveDrawings = () => {
      try {
        localStorage.setItem(drawKey(), JSON.stringify(drawings));
      } catch {
        // storage disabled — non-fatal
      }
    };
    const priceToY = (p: number) => {
      const m = mapState;
      return m.useLog && p > 0
        ? m.priceTop + ((m.logHi - Math.log10(p)) / m.logSpan) * m.pricePlotH
        : m.priceTop + ((m.hi - p) / ((m.hi - m.lo) || 1)) * m.pricePlotH;
    };
    const yToPrice = (y: number) => {
      const m = mapState;
      return m.useLog
        ? Math.pow(10, m.logHi - ((y - m.priceTop) / m.pricePlotH) * m.logSpan)
        : m.hi - ((y - m.priceTop) / m.pricePlotH) * ((m.hi - m.lo) || 1);
    };
    const timeToXc = (t: number) => {
      const cs = candlesRef.current;
      if (cs.length === 0) return layout().left;
      if (t <= cs[0].time) return xForIndex(0.5);
      if (t >= cs[cs.length - 1].time) return xForIndex(cs.length - 1 + 0.5);
      let lo = 0;
      let hi = cs.length - 1;
      while (lo <= hi) {
        const m = (lo + hi) >> 1;
        if (cs[m].time < t) lo = m + 1;
        else hi = m - 1;
      }
      const i1 = Math.max(0, hi);
      const i2 = Math.min(cs.length - 1, lo);
      const t1 = cs[i1].time;
      const t2 = cs[i2].time;
      const frac = t2 > t1 ? (t - t1) / (t2 - t1) : 0;
      return xForIndex(i1 + frac + 0.5);
    };
    const xToTime = (x: number) => {
      const cs = candlesRef.current;
      if (cs.length === 0) return 0;
      const i = Math.max(0, Math.min(cs.length - 1, Math.round(indexForX(x))));
      return cs[i].time;
    };
    const distToSeg = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len2 = dx * dx + dy * dy || 1;
      let tt = ((px - x1) * dx + (py - y1) * dy) / len2;
      tt = Math.max(0, Math.min(1, tt));
      return Math.hypot(px - (x1 + tt * dx), py - (y1 + tt * dy));
    };
    const hitTestDrawing = (x: number, y: number): string | null => {
      const tol = 6;
      for (let k = drawings.length - 1; k >= 0; k--) {
        const d = drawings[k];
        if (d.type === "hline") {
          if (Math.abs(y - priceToY(d.points[0].p)) <= tol) return d.id;
        } else if (d.type === "trend" && d.points.length === 2) {
          const x1 = timeToXc(d.points[0].t);
          const y1 = priceToY(d.points[0].p);
          const x2 = timeToXc(d.points[1].t);
          const y2 = priceToY(d.points[1].p);
          if (distToSeg(x, y, x1, y1, x2, y2) <= tol) return d.id;
        } else if (d.type === "fib" && d.points.length === 2) {
          const hiP = Math.max(d.points[0].p, d.points[1].p);
          const loP = Math.min(d.points[0].p, d.points[1].p);
          for (const lv of FIB_LEVELS) {
            if (Math.abs(y - priceToY(hiP - (hiP - loP) * lv)) <= tol) return d.id;
          }
        }
      }
      return null;
    };
    // screen position of a drawing's editable handle #i
    const handlePos = (d: Drawing, i: number): { x: number; y: number } => {
      if (d.type === "hline") return { x: layout().right - 8, y: priceToY(d.points[0].p) };
      return { x: timeToXc(d.points[i].t), y: priceToY(d.points[i].p) };
    };
    // which handle of a drawing is under (x,y), or null
    const handleAt = (d: Drawing, x: number, y: number): number | null => {
      for (let i = 0; i < d.points.length; i++) {
        const h = handlePos(d, i);
        if (Math.hypot(x - h.x, y - h.y) <= 7) return i;
      }
      return null;
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
      const cs = candlesRef.current;
      const len = cs.length;
      if (len === 0) return;
      // Start the view at the first candle the user asked to see; bars before it
      // are warmup (fetched only so indicators are defined here) and stay
      // off-screen but pannable. Without a display window, show everything.
      const dst = displayStartRef.current;
      let startIdx = 0;
      if (dst != null) {
        const found = cs.findIndex((c) => c.time >= dst);
        startIdx = found < 0 ? 0 : found;
      }
      const shown = Math.max(1, len - startIdx);
      const rightPad = Math.max(2, Math.round(shown * 0.04));
      viewRef.current = { from: startIdx - 1, to: len + rightPad };
    };

    // ── The single source of pixels ──
    const draw = () => {
      const L = layout();
      const cs = candlesRef.current;
      if (L.w === 0 || L.h === 0) return;

      ctx.clearRect(0, 0, L.w, L.h);
      ctx.font = FONT;
      ctx.textBaseline = "middle";

      // hex (#rrggbb, as resolvePalette emits) → rgba() for translucent fills.
      const toRgba = (hexColor: string, a: number) => {
        const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hexColor);
        const [r, g, b] = m
          ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
          : [120, 120, 120];
        return `rgba(${r},${g},${b},${a})`;
      };

      const { lo, hi } = priceRange();
      const span = hi - lo || 1;
      // Log positioning needs strictly-positive bounds; fall back to linear if a
      // series dips to/below zero (shouldn't happen for prices, but stay safe).
      const scale = priceScaleRef.current;
      const useLog = scale === "log" && lo > 0 && hi > 0;
      const logLo = useLog ? Math.log10(lo) : 0;
      const logHi = useLog ? Math.log10(hi) : 0;
      const logSpan = logHi - logLo || 1;
      const yForPrice = (p: number) =>
        useLog && p > 0
          ? L.priceTop + ((logHi - Math.log10(p)) / logSpan) * L.pricePlotH
          : L.priceTop + ((hi - p) / span) * L.pricePlotH;
      const priceForY = (y: number) =>
        useLog
          ? Math.pow(10, logHi - ((y - L.priceTop) / L.pricePlotH) * logSpan)
          : hi - ((y - L.priceTop) / L.pricePlotH) * span;

      // expose the current price mapping so pointer handlers can invert clicks
      mapState.priceTop = L.priceTop;
      mapState.pricePlotH = L.pricePlotH;
      mapState.lo = lo;
      mapState.hi = hi;
      mapState.useLog = useLog;
      mapState.logHi = logHi;
      mapState.logSpan = logSpan;

      // Percent mode relabels the price axis as % change from the left-most
      // visible bar's close; everything else (positioning) is unchanged.
      const vNow = viewRef.current;
      const baseIdx = Math.max(0, Math.min(cs.length - 1, Math.floor(vNow.from < 0 ? 0 : vNow.from)));
      const pctBase = cs.length > 0 ? cs[baseIdx].close : 0;
      const fmtAxis = (p: number) =>
        scale === "percent" && pctBase
          ? `${(p / pctBase - 1) * 100 >= 0 ? "+" : ""}${((p / pctBase - 1) * 100).toFixed(2)}%`
          : fmtPrice(p);

      // price grid + right-axis labels (alternating major/minor for a calmer grid)
      ctx.textAlign = "left";
      const ticks = priceTicks(lo, hi, 5);
      for (let ti = 0; ti < ticks.length; ti++) {
        const p = ticks[ti];
        const y = yForPrice(p);
        if (y < L.priceTop - 1 || y > L.priceBottom + 1) continue;
        ctx.strokeStyle = ti % 2 === 0 ? pal.grid : pal.gridSoft;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(L.left, Math.round(y) + 0.5);
        ctx.lineTo(L.right, Math.round(y) + 0.5);
        ctx.stroke();
        ctx.fillStyle = pal.axisText;
        ctx.fillText(fmtAxis(p), L.right + 6, y);
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

      // Auto-thin hysteresis: enter line-mode under 2.2px/bar, exit above 3.2px.
      if (!thinMode && bw < 2.2) thinMode = true;
      else if (thinMode && bw > 3.2) thinMode = false;

      // ── intraday session shading (pre-market / after-hours columns) ──
      if (intra && cs.length > 0) {
        const flags = sessionFlags(cs);
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = pal.gridSoft;
        for (let i = first; i <= last; i++) {
          if (flags[i]) continue; // regular session — leave clear
          ctx.fillRect(xForIndex(i), L.top, Math.max(1, bw), L.bottom - L.top);
        }
        ctx.restore();
      }

      // ── hovered-candle column tint (behind everything) ──
      if (crosshair.on && !drag.on && !measure.on) {
        const hIdx = Math.floor(indexForX(crosshair.x));
        if (hIdx >= 0 && hIdx < cs.length) {
          const colLeft = xForIndex(hIdx);
          ctx.save();
          ctx.globalAlpha = 0.5;
          ctx.fillStyle = pal.gridSoft;
          ctx.fillRect(colLeft, L.top, Math.max(1, bw), L.bottom - L.top);
          ctx.restore();
        }
      }

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

      // ── indicator sub-panels (each clipped to its own pane) ──
      const inds = indicatorsRef.current;
      if (inds.length > 0 && cs.length > 0) {
        type Pane = { top: number; bottom: number; h: number };
        const strokeSeries = (
          arr: Array<number | null>,
          color: string,
          yFor: (v: number) => number,
          width = 1.5
        ) => {
          ctx.strokeStyle = color;
          ctx.lineWidth = width;
          ctx.lineJoin = "round";
          ctx.beginPath();
          let started = false;
          for (let i = drawFrom; i <= drawTo; i++) {
            const val = arr[i];
            if (val == null) {
              started = false;
              continue;
            }
            const x = xForIndex(i + 0.5);
            const y = yFor(val);
            if (!started) {
              ctx.moveTo(x, y);
              started = true;
            } else ctx.lineTo(x, y);
          }
          ctx.stroke();
        };
        const visExtent = (arrays: Array<Array<number | null>>) => {
          let mn = Infinity;
          let mx = -Infinity;
          for (let i = Math.max(0, Math.floor(v.from)); i <= Math.min(cs.length - 1, Math.ceil(v.to)); i++) {
            for (const arr of arrays) {
              const val = arr[i];
              if (val != null) {
                if (val < mn) mn = val;
                if (val > mx) mx = val;
              }
            }
          }
          if (!isFinite(mn) || !isFinite(mx)) {
            mn = 0;
            mx = 1;
          }
          if (mn === mx) {
            mn -= 1;
            mx += 1;
          }
          return { mn, mx };
        };
        const lastVal = (arr: Array<number | null>): number | null => {
          for (let i = arr.length - 1; i >= 0; i--) if (arr[i] != null) return arr[i] as number;
          return null;
        };
        const clipPane = (pane: Pane) => {
          ctx.beginPath();
          ctx.rect(L.left, pane.top, L.plotW, pane.h);
          ctx.clip();
        };
        const legend = (pane: Pane, text: string) => {
          ctx.fillStyle = pal.legendLabel;
          ctx.textAlign = "left";
          ctx.fillText(text, L.left + 4, pane.top + 9);
        };
        // RSI / Stochastic share a banded 0–100 layout with shaded extremes.
        const drawBanded = (
          pane: Pane,
          lines: Array<{ arr: Array<number | null>; color: string }>,
          hiLvl: number,
          loLvl: number,
          label: string,
          firstArr: Array<number | null>
        ) => {
          const yFor = (val: number) => pane.top + ((100 - val) / 100) * pane.h;
          const yHi = yFor(hiLvl);
          const yLo = yFor(loLvl);
          ctx.save();
          clipPane(pane);
          ctx.save();
          ctx.globalAlpha = 0.1;
          ctx.fillStyle = pal.down;
          ctx.fillRect(L.left, pane.top, L.plotW, yHi - pane.top);
          ctx.fillStyle = pal.up;
          ctx.fillRect(L.left, yLo, L.plotW, pane.bottom - yLo);
          ctx.restore();
          if (label.startsWith("RSI")) {
            ctx.fillStyle = pal.legendLabel;
            ctx.textAlign = "right";
            if (yHi - pane.top > 11) ctx.fillText("PREMIUM", L.right - 4, pane.top + 7);
            if (pane.bottom - yLo > 11) ctx.fillText("DISCOUNT", L.right - 4, pane.bottom - 6);
            ctx.textAlign = "left";
          }
          ctx.strokeStyle = pal.gridSoft;
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          for (const lvl of [loLvl, hiLvl]) {
            const gy = yFor(lvl);
            ctx.beginPath();
            ctx.moveTo(L.left, Math.round(gy) + 0.5);
            ctx.lineTo(L.right, Math.round(gy) + 0.5);
            ctx.stroke();
          }
          ctx.setLineDash([]);
          for (const ln of lines) strokeSeries(ln.arr, ln.color, yFor);
          ctx.restore();
          ctx.fillStyle = pal.axisText;
          ctx.textAlign = "left";
          for (const lvl of [loLvl, hiLvl]) ctx.fillText(String(lvl), L.right + 6, yFor(lvl));
          const lv = lastVal(firstArr);
          legend(pane, `${label}${lv != null ? `  ${lv.toFixed(1)}` : ""}`);
        };
        const drawMACD = (pane: Pane) => {
          const { macd, signal, hist } = computeMACD(cs);
          const { mn, mx } = visExtent([macd, signal, hist]);
          const mag = Math.max(Math.abs(mn), Math.abs(mx)) || 1;
          const span2 = 2 * mag;
          const yFor = (val: number) => pane.top + ((mag - val) / span2) * pane.h;
          const zeroY = yFor(0);
          ctx.save();
          clipPane(pane);
          const hw = Math.max(1, bw * 0.7);
          ctx.globalAlpha = 0.5;
          for (let i = drawFrom; i <= drawTo; i++) {
            const hVal = hist[i];
            if (hVal == null) continue;
            const cx = xForIndex(i + 0.5);
            const y = yFor(hVal);
            ctx.fillStyle = hVal >= 0 ? pal.up : pal.down;
            ctx.fillRect(cx - hw / 2, Math.min(y, zeroY), hw, Math.max(1, Math.abs(y - zeroY)));
          }
          ctx.globalAlpha = 1;
          ctx.strokeStyle = pal.gridSoft;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(L.left, Math.round(zeroY) + 0.5);
          ctx.lineTo(L.right, Math.round(zeroY) + 0.5);
          ctx.stroke();
          strokeSeries(macd, pal.ma[1], yFor);
          strokeSeries(signal, pal.ma[0], yFor);
          ctx.restore();
          legend(pane, "MACD 12 26 9");
        };
        const drawSingle = (
          pane: Pane,
          arr: Array<number | null>,
          color: string,
          label: string,
          fmt: (n: number) => string
        ) => {
          const { mn, mx } = visExtent([arr]);
          const pad = (mx - mn) * 0.1 || 1;
          const lo2 = mn - pad;
          const hi2 = mx + pad;
          const sp2 = hi2 - lo2 || 1;
          const yFor = (val: number) => pane.top + ((hi2 - val) / sp2) * pane.h;
          ctx.save();
          clipPane(pane);
          strokeSeries(arr, color, yFor);
          ctx.restore();
          ctx.fillStyle = pal.axisText;
          ctx.textAlign = "left";
          ctx.fillText(fmt(hi2), L.right + 6, pane.top + 7);
          ctx.fillText(fmt(lo2), L.right + 6, pane.bottom - 6);
          const lv = lastVal(arr);
          legend(pane, `${label}${lv != null ? `  ${fmt(lv)}` : ""}`);
        };

        for (let pi = 0; pi < inds.length; pi++) {
          const pane = L.indPanes[pi];
          if (!pane) continue;
          const kind = inds[pi];
          if (kind === "rsi") {
            const rsi = computeRSI(cs, 14);
            drawBanded(pane, [{ arr: rsi, color: pal.chipBg }], 70, 30, "RSI 14", rsi);
          } else if (kind === "macd") {
            drawMACD(pane);
          } else if (kind === "stoch") {
            const { k, d } = computeStochastic(cs, 14, 3);
            drawBanded(
              pane,
              [
                { arr: k, color: pal.ma[1] },
                { arr: d, color: pal.ma[0] },
              ],
              80,
              20,
              "STOCH 14 3",
              k
            );
          } else if (kind === "atr") {
            drawSingle(pane, computeATR(cs, 14), pal.ma[2] ?? pal.chipBg, "ATR 14", (n) => fmtPrice(n));
          } else if (kind === "obv") {
            drawSingle(pane, computeOBV(cs), pal.ma[1], "OBV", (n) => fmtVol(n));
          }
        }
      }

      // ── price series: candles or area, clipped to the price region ──
      const bodyW = Math.max(1, bw * 0.7);
      ctx.save();
      ctx.beginPath();
      ctx.rect(L.left, L.priceTop, L.plotW, L.pricePlotH);
      ctx.clip();
      const ct = chartTypeRef.current;
      if (ct === "area" || ct === "baseline") {
        const pts: Array<[number, number]> = [];
        for (let i = drawFrom; i <= drawTo; i++) {
          pts.push([xForIndex(i + 0.5), yForPrice(cs[i].close)]);
        }
        if (pts.length > 0 && ct === "baseline") {
          // Baseline: fill + line split around a reference price (first visible
          // close). Above the line reads green, below reads violet.
          const baseY = yForPrice(pctBase);
          const fillSide = (clipTop: number, clipBot: number, color: string) => {
            if (clipBot <= clipTop) return;
            ctx.save();
            ctx.beginPath();
            ctx.rect(L.left, clipTop, L.plotW, clipBot - clipTop);
            ctx.clip();
            const grad = ctx.createLinearGradient(0, L.priceTop, 0, L.priceBottom);
            grad.addColorStop(0, toRgba(color, 0.28));
            grad.addColorStop(1, toRgba(color, 0.02));
            ctx.beginPath();
            ctx.moveTo(pts[0][0], baseY);
            for (const p of pts) ctx.lineTo(p[0], p[1]);
            ctx.lineTo(pts[pts.length - 1][0], baseY);
            ctx.closePath();
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.restore();
          };
          const lineSide = (clipTop: number, clipBot: number, color: string) => {
            if (clipBot <= clipTop) return;
            ctx.save();
            ctx.beginPath();
            ctx.rect(L.left, clipTop, L.plotW, clipBot - clipTop);
            ctx.clip();
            ctx.beginPath();
            ctx.moveTo(pts[0][0], pts[0][1]);
            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.lineJoin = "round";
            ctx.stroke();
            ctx.restore();
          };
          fillSide(L.priceTop, baseY, pal.up);
          fillSide(baseY, L.priceBottom, pal.down);
          lineSide(L.priceTop, baseY, pal.up);
          lineSide(baseY, L.priceBottom, pal.down);
          ctx.save();
          ctx.strokeStyle = pal.gridSoft;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(L.left, Math.round(baseY) + 0.5);
          ctx.lineTo(L.right, Math.round(baseY) + 0.5);
          ctx.stroke();
          ctx.restore();
        } else if (pts.length > 0) {
          // area: direction over the visible range tints the fill + line
          const vf = cs[Math.max(0, Math.min(cs.length - 1, Math.floor(v.from < 0 ? 0 : v.from)))];
          const vl = cs[Math.min(cs.length - 1, Math.max(0, Math.ceil(v.to) - 1))];
          const rising = !!vf && !!vl && vl.close >= vf.close;
          const lineCol = rising ? pal.up : pal.down;
          const grad = ctx.createLinearGradient(0, L.priceTop, 0, L.priceBottom);
          grad.addColorStop(0, toRgba(lineCol, 0.32));
          grad.addColorStop(1, toRgba(lineCol, 0.02));
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
      } else if (thinMode) {
        // too dense for bodies — draw a 1px close line tinted by visible direction
        const src = ct === "heikin" ? computeHeikinAshi(cs) : cs;
        const vf = src[Math.max(0, Math.min(src.length - 1, Math.floor(v.from < 0 ? 0 : v.from)))];
        const vl = src[Math.min(src.length - 1, Math.max(0, Math.ceil(v.to) - 1))];
        const rising = !!vf && !!vl && vl.close >= vf.close;
        ctx.strokeStyle = rising ? pal.up : pal.down;
        ctx.lineWidth = 1;
        ctx.lineJoin = "round";
        ctx.beginPath();
        let started = false;
        for (let i = drawFrom; i <= drawTo; i++) {
          const x = xForIndex(i + 0.5);
          const y = yForPrice(src[i].close);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else ctx.lineTo(x, y);
        }
        ctx.stroke();
      } else {
        // candle-like: candles | hollow | heikin (HA uses a transformed series,
        // but the crosshair legend below still reads the real OHLC from `cs`).
        const src = ct === "heikin" ? computeHeikinAshi(cs) : cs;
        const hollow = ct === "hollow";
        for (let i = drawFrom; i <= drawTo; i++) {
          const c = src[i];
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
          const h = Math.max(1, yBot - yTop);
          if (hollow && up) {
            // hollow up-candle: outline only
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.strokeRect(
              Math.round(cx - bodyW / 2) + 0.5,
              Math.round(yTop) + 0.5,
              Math.max(1, Math.round(bodyW) - 1),
              Math.max(1, h - 1)
            );
          } else {
            ctx.fillStyle = color;
            ctx.fillRect(cx - bodyW / 2, yTop, bodyW, h);
          }
        }
      }

      // ── Bollinger Bands (20, 2σ) — inside the same price clip ──
      if (bollingerRef.current) {
        const bb = computeBollinger(cs, 20, 2);
        const col = pal.ma[2] ?? pal.chipBg; // distinct from MA20/MA50 colours
        // translucent fill between the upper and lower band
        ctx.save();
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = col;
        ctx.beginPath();
        let filled = false;
        for (let i = drawFrom; i <= drawTo; i++) {
          const u = bb.upper[i];
          if (u == null) continue;
          const x = xForIndex(i + 0.5);
          const y = yForPrice(u);
          if (!filled) {
            ctx.moveTo(x, y);
            filled = true;
          } else ctx.lineTo(x, y);
        }
        for (let i = drawTo; i >= drawFrom; i--) {
          const l = bb.lower[i];
          if (l == null) continue;
          ctx.lineTo(xForIndex(i + 0.5), yForPrice(l));
        }
        if (filled) {
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
        // the three lines (mid dashed so it reads apart from the MAs)
        const drawBand = (arr: Array<number | null>, dash: number[]) => {
          ctx.strokeStyle = col;
          ctx.lineWidth = 1;
          ctx.lineJoin = "round";
          ctx.setLineDash(dash);
          ctx.beginPath();
          let started = false;
          for (let i = drawFrom; i <= drawTo; i++) {
            const v = arr[i];
            if (v == null) {
              started = false;
              continue;
            }
            const x = xForIndex(i + 0.5);
            const y = yForPrice(v);
            if (!started) {
              ctx.moveTo(x, y);
              started = true;
            } else ctx.lineTo(x, y);
          }
          ctx.stroke();
        };
        drawBand(bb.upper, []);
        drawBand(bb.lower, []);
        drawBand(bb.mid, [4, 3]);
        ctx.setLineDash([]);
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

      // ── compare overlay: a 2nd ticker normalized to % from the first visible
      //    point, aligned by time, sharing the primary's baseline ──
      const cmp = compareRef.current;
      if (cmp && cmp.candles.length > 1 && cs.length > 0) {
        const ccs = cmp.candles;
        const idxForTime = (t: number) => {
          if (t <= ccs[0].time) return 0;
          if (t >= ccs[ccs.length - 1].time) return ccs.length - 1;
          let lo = 0;
          let hi = ccs.length - 1;
          while (lo <= hi) {
            const m = (lo + hi) >> 1;
            if (ccs[m].time < t) lo = m + 1;
            else hi = m - 1;
          }
          return Math.max(0, Math.min(ccs.length - 1, lo));
        };
        // map a unix time onto the primary's index/x space (interpolated)
        const timeToX = (t: number) => {
          if (t <= cs[0].time) return xForIndex(0.5);
          if (t >= cs[cs.length - 1].time) return xForIndex(cs.length - 1 + 0.5);
          let lo = 0;
          let hi = cs.length - 1;
          while (lo <= hi) {
            const m = (lo + hi) >> 1;
            if (cs[m].time < t) lo = m + 1;
            else hi = m - 1;
          }
          const i1 = Math.max(0, hi);
          const i2 = Math.min(cs.length - 1, lo);
          const t1 = cs[i1].time;
          const t2 = cs[i2].time;
          const frac = t2 > t1 ? (t - t1) / (t2 - t1) : 0;
          return xForIndex(i1 + frac + 0.5);
        };
        const baseTime = cs[baseIdx]?.time ?? cs[0].time;
        const cmpBase = ccs[idxForTime(baseTime)].close || ccs[0].close;
        const tFrom = cs[Math.max(0, Math.floor(v.from))]?.time ?? cs[0].time;
        const tTo = cs[Math.min(cs.length - 1, Math.ceil(v.to))]?.time ?? cs[cs.length - 1].time;
        ctx.strokeStyle = pal.ma[1];
        ctx.lineWidth = 1.5;
        ctx.lineJoin = "round";
        ctx.setLineDash([]);
        ctx.beginPath();
        let cstarted = false;
        for (let i = 0; i < ccs.length; i++) {
          const t = ccs[i].time;
          if (t < tFrom || t > tTo) continue;
          const pct = cmpBase ? ccs[i].close / cmpBase - 1 : 0;
          const x = timeToX(t);
          const y = yForPrice(pctBase * (1 + pct));
          if (!cstarted) {
            ctx.moveTo(x, y);
            cstarted = true;
          } else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // ── user drawings (hline / trend / fib) — inside the price clip ──
      if (drawings.length > 0 || pending) {
        ctx.lineJoin = "round";
        ctx.setLineDash([]);
        for (const d of drawings) {
          const sel = d.id === selectedId;
          ctx.strokeStyle = pal.chipBg;
          ctx.lineWidth = sel ? 2.5 : 1.5;
          if (d.type === "hline") {
            const y = priceToY(d.points[0].p);
            ctx.beginPath();
            ctx.moveTo(L.left, Math.round(y) + 0.5);
            ctx.lineTo(L.right, Math.round(y) + 0.5);
            ctx.stroke();
            ctx.fillStyle = pal.chipBg;
            ctx.textAlign = "left";
            ctx.fillText(fmtPrice(d.points[0].p), L.left + 4, y - 6);
          } else if (d.type === "trend" && d.points.length === 2) {
            ctx.beginPath();
            ctx.moveTo(timeToXc(d.points[0].t), priceToY(d.points[0].p));
            ctx.lineTo(timeToXc(d.points[1].t), priceToY(d.points[1].p));
            ctx.stroke();
          } else if (d.type === "fib" && d.points.length === 2) {
            const x1 = timeToXc(d.points[0].t);
            const x2 = timeToXc(d.points[1].t);
            const xa = Math.min(x1, x2);
            const xb = Math.max(x1, x2);
            const hiP = Math.max(d.points[0].p, d.points[1].p);
            const loP = Math.min(d.points[0].p, d.points[1].p);
            for (const lv of FIB_LEVELS) {
              const p = hiP - (hiP - loP) * lv;
              const y = priceToY(p);
              ctx.globalAlpha = 0.65;
              ctx.beginPath();
              ctx.moveTo(xa, Math.round(y) + 0.5);
              ctx.lineTo(xb, Math.round(y) + 0.5);
              ctx.stroke();
              ctx.globalAlpha = 1;
              ctx.fillStyle = pal.legendLabel;
              ctx.textAlign = "left";
              ctx.fillText(`${(lv * 100).toFixed(1)}%  ${fmtPrice(p)}`, xa + 4, y - 5);
            }
          }
          // selection handles
          if (sel) {
            ctx.fillStyle = pal.chipBg;
            ctx.strokeStyle = pal.onColorText;
            ctx.lineWidth = 1;
            for (let i = 0; i < d.points.length; i++) {
              const h = handlePos(d, i);
              ctx.beginPath();
              ctx.rect(h.x - 3.5, h.y - 3.5, 7, 7);
              ctx.fill();
              ctx.stroke();
            }
          }
        }
        if (pending && pending.points.length === 1) {
          ctx.strokeStyle = pal.chipBg;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(timeToXc(pending.points[0].t), priceToY(pending.points[0].p));
          ctx.lineTo(pendingCursor.x, pendingCursor.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      ctx.restore();

      // last-price dashed line + breathing dot + axis chip (subtle "live" cue)
      if (cs.length > 0) {
        const lastC = cs[cs.length - 1];
        const ly = yForPrice(lastC.close);
        // 0..1 sine over ~1.5s; drives the gentle pulse
        const breathe = 0.5 + 0.5 * Math.sin(performance.now() / 700);
        if (ly >= L.priceTop && ly <= L.priceBottom) {
          const col = lastC.close >= lastC.open ? pal.up : pal.down;
          ctx.save();
          ctx.strokeStyle = col;
          ctx.globalAlpha = 0.3 + 0.3 * breathe;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(L.left, Math.round(ly) + 0.5);
          ctx.lineTo(L.right, Math.round(ly) + 0.5);
          ctx.stroke();
          ctx.restore();
          // pulsing dot at the latest close
          const lastX = xForIndex(cs.length - 1 + 0.5);
          if (lastX >= L.left && lastX <= L.right) {
            ctx.save();
            ctx.fillStyle = col;
            ctx.globalAlpha = 0.16 + 0.24 * breathe;
            ctx.beginPath();
            ctx.arc(lastX, ly, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.arc(lastX, ly, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
          const label = fmtAxis(lastC.close);
          const tw = ctx.measureText(label).width;
          ctx.fillStyle = col;
          roundRect(ctx, L.right + 2, ly - 9, Math.min(tw + 10, PRICE_W - 4), 18, 5);
          ctx.fill();
          ctx.fillStyle = pal.onColorText;
          ctx.textAlign = "left";
          ctx.fillText(label, L.right + 7, ly);
        }
      }

      // ── visible-range high / low annotations ──
      if (cs.length > 0) {
        let hiV = -Infinity;
        let loV = Infinity;
        let hiI = -1;
        let loI = -1;
        const a = Math.max(0, Math.floor(v.from));
        const b = Math.min(cs.length - 1, Math.ceil(v.to));
        for (let i = a; i <= b; i++) {
          if (cs[i].high > hiV) {
            hiV = cs[i].high;
            hiI = i;
          }
          if (cs[i].low < loV) {
            loV = cs[i].low;
            loI = i;
          }
        }
        ctx.fillStyle = pal.legendLabel;
        ctx.textAlign = "center";
        if (hiI >= 0) {
          const x = Math.max(L.left + 24, Math.min(xForIndex(hiI + 0.5), L.right - 24));
          const y = Math.max(L.priceTop + 8, yForPrice(hiV) - 8);
          ctx.fillText(`▲ ${fmtAxis(hiV)}`, x, y);
        }
        if (loI >= 0) {
          const x = Math.max(L.left + 24, Math.min(xForIndex(loI + 0.5), L.right - 24));
          const y = Math.min(L.priceBottom - 8, yForPrice(loV) + 8);
          ctx.fillText(`▼ ${fmtAxis(loV)}`, x, y);
        }
      }

      // ── always-on overlay legend (top-left, first row): MAs + Bollinger + compare ──
      const maPeriods = masRef.current;
      const hasOverlayLegend =
        maPeriods.length > 0 || bollingerRef.current || !!compareRef.current;
      if (hasOverlayLegend && cs.length > 0) {
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
        if (bollingerRef.current) {
          const bb2 = computeBollinger(cs, 20, 2);
          const li = cs.length - 1;
          const u = bb2.upper[li];
          const l = bb2.lower[li];
          const m = bb2.mid[li];
          let extra = "";
          if (u != null && l != null && m != null && u !== l && m !== 0) {
            const pctB = ((cs[li].close - l) / (u - l)) * 100;
            const bw = ((u - l) / m) * 100;
            extra = `  %B ${pctB.toFixed(0)}  BW ${bw.toFixed(1)}`;
          }
          ctx.fillStyle = pal.ma[2] ?? pal.chipBg;
          const label = `BB 20 2${extra}`;
          ctx.fillText(label, mlx, mly);
          mlx += ctx.measureText(label).width + 12;
        }
        const cmpL = compareRef.current;
        if (cmpL && cmpL.candles.length > 1) {
          const ccs = cmpL.candles;
          const vto = Math.min(cs.length - 1, Math.ceil(v.to));
          const primPct = pctBase ? (cs[vto].close / pctBase - 1) * 100 : 0;
          const baseTime = cs[baseIdx]?.time ?? cs[0].time;
          const lastTime = cs[vto]?.time ?? cs[cs.length - 1].time;
          let cb = ccs[0].close;
          for (let i = 0; i < ccs.length; i++)
            if (ccs[i].time >= baseTime) {
              cb = ccs[i].close;
              break;
            }
          let cv = ccs[ccs.length - 1].close;
          for (let i = ccs.length - 1; i >= 0; i--)
            if (ccs[i].time <= lastTime) {
              cv = ccs[i].close;
              break;
            }
          const cmpPct = cb ? (cv / cb - 1) * 100 : 0;
          const sgn = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
          if (symbolRef.current) {
            const t1 = `${symbolRef.current} ${sgn(primPct)}`;
            ctx.fillStyle = primPct >= 0 ? pal.up : pal.down;
            ctx.fillText(t1, mlx, mly);
            mlx += ctx.measureText(t1).width + 12;
          }
          const t2 = `${cmpL.symbol} ${sgn(cmpPct)}`;
          ctx.fillStyle = pal.ma[1];
          ctx.fillText(t2, mlx, mly);
          mlx += ctx.measureText(t2).width + 12;
        }
      }
      // OHLC hover legend drops to a second row when the overlay legend owns the first.
      const ohlcRowY = hasOverlayLegend ? L.top + 25 : L.top + 9;

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
          const plabel = fmtAxis(priceForY(crosshair.y));
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

      // ── dividend / split markers on the time axis ──
      const evs = eventsRef.current;
      if (evs && evs.length > 0 && cs.length > 0) {
        const tFrom = cs[Math.max(0, Math.floor(v.from))]?.time ?? cs[0].time;
        const tTo = cs[Math.min(cs.length - 1, Math.ceil(v.to))]?.time ?? cs[cs.length - 1].time;
        const r = 7;
        const my = L.bottom - r - 2;
        ctx.textBaseline = "middle";
        for (const ev of evs) {
          if (ev.time < tFrom || ev.time > tTo) continue;
          const x = timeToXc(ev.time);
          if (x < L.left || x > L.right) continue;
          ctx.beginPath();
          ctx.arc(x, my, r, 0, Math.PI * 2);
          ctx.fillStyle = ev.type === "div" ? pal.up : pal.chipBg;
          ctx.globalAlpha = 0.9;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.fillStyle = pal.onColorText;
          ctx.textAlign = "center";
          ctx.font = "bold 10px ui-monospace, monospace";
          ctx.fillText(ev.type === "div" ? "D" : "S", x, my + 0.5);
          ctx.font = FONT;
          if (crosshair.on && Math.abs(crosshair.x - x) <= r + 2) {
            const tw = ctx.measureText(ev.text).width;
            const bx = Math.max(L.left, Math.min(x - tw / 2 - 6, L.right - tw - 12));
            const byy = my - r - 22;
            roundRect(ctx, bx, byy, tw + 12, 18, 5);
            ctx.fillStyle = pal.chipBg;
            ctx.fill();
            ctx.fillStyle = pal.chipText;
            ctx.textAlign = "left";
            ctx.fillText(ev.text, bx + 6, byy + 9);
          }
        }
      }

      // ── measure tool overlay (shift-drag) ──
      if (measure.on) {
        const { x1, y1, x2, y2 } = measure;
        const p1 = priceForY(y1);
        const p2 = priceForY(y2);
        const dPrice = p2 - p1;
        const dPct = p1 !== 0 ? (dPrice / p1) * 100 : 0;
        const bars = Math.abs(Math.round(indexForX(x2)) - Math.round(indexForX(x1)));
        const rising = dPrice >= 0;
        const col = rising ? pal.up : pal.down;

        ctx.save();
        const rx = Math.min(x1, x2);
        const ry = Math.min(y1, y2);
        const rw = Math.abs(x2 - x1);
        const rh = Math.abs(y2 - y1);
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = col;
        ctx.fillRect(rx, ry, rw, rh);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = col;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(Math.round(rx) + 0.5, Math.round(ry) + 0.5, rw, rh);
        ctx.setLineDash([]);

        const sign = rising ? "+" : "";
        const lines = [
          `${sign}${fmtPrice(dPrice)}`,
          `${sign}${dPct.toFixed(2)}%`,
          `${bars} bar${bars === 1 ? "" : "s"}`,
        ];
        ctx.font = FONT;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        const tw = Math.max(...lines.map((t) => ctx.measureText(t).width));
        const padX = 8;
        const lineH = 15;
        const boxW = tw + padX * 2;
        const boxH = lines.length * lineH + 8;
        let bx = x2 + 12;
        let by = y2 + 12;
        if (bx + boxW > L.right) bx = x2 - boxW - 12;
        if (by + boxH > L.bottom) by = y2 - boxH - 12;
        if (bx < L.left) bx = L.left + 2;
        if (by < L.top) by = L.top + 2;
        roundRect(ctx, bx, by, boxW, boxH, 6);
        ctx.fillStyle = col;
        ctx.fill();
        ctx.fillStyle = pal.onColorText;
        for (let i = 0; i < lines.length; i++) {
          ctx.fillText(lines[i], bx + padX, by + 4 + lineH / 2 + i * lineH);
        }
        ctx.restore();
      }
    };

    const schedule = () => {
      if (raf != null) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        if (viewTarget) {
          const v = viewRef.current;
          const t = viewTarget;
          const nf = v.from + (t.from - v.from) * 0.25;
          const nt = v.to + (t.to - v.to) * 0.25;
          if (Math.abs(nf - t.from) < 0.02 && Math.abs(nt - t.to) < 0.02) {
            viewRef.current = { from: t.from, to: t.to };
            viewTarget = null;
          } else {
            viewRef.current = { from: nf, to: nt };
            schedule(); // keep easing
          }
        }
        draw();
      });
    };

    // Ease the viewport toward a target span (used by wheel zoom + reset).
    const animateTo = (target: View) => {
      viewTarget = target;
      schedule();
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
      // ease from the current view to the fit target
      const cur = { ...viewRef.current };
      fit();
      const target = { ...viewRef.current };
      viewRef.current = cur;
      animateTo(target);
    };

    // Download the current chart as a PNG. The canvas is already backed at
    // devicePixelRatio resolution, so the export is crisp. We force a fresh draw
    // so the saved frame matches exactly what's on screen.
    const exportPng = (filename: string) => {
      try {
        draw();
        const url = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = url;
        a.download = filename || "chart.png";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch {
        // tainted canvas / blocked download — non-fatal
      }
    };

    // Expose the bits the data effect needs, then do the first layout.
    apiRef.current = { schedule, fit, reset, exportPng };
    if (candlesRef.current.length > 0 && rangeRef.current === null) fit();
    applySize();

    // Low-rate (~15fps) repaint so the last-price marker breathes; paused when the
    // tab is hidden so backgrounded charts cost nothing.
    const pulseLoop = (ts: number) => {
      pulseRaf = requestAnimationFrame(pulseLoop);
      if (typeof document !== "undefined" && document.hidden) return;
      if (ts - lastPulseTs < 66) return;
      lastPulseTs = ts;
      schedule();
    };
    pulseRaf = requestAnimationFrame(pulseLoop);

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
      viewTarget = null; // any direct interaction cancels an in-flight zoom ease
      const px = relX(e.clientX);
      const py = relY(e.clientY);
      pointers.set(e.pointerId, { x: px, y: py });

      // Drawing tools take priority over pan/measure on a single primary click.
      const dt = toolRef.current;
      if (dt !== "cursor" && pointers.size === 1 && !e.shiftKey) {
        drag.on = false;
        crosshair.on = false;
        if (dt === "erase") {
          const hit = hitTestDrawing(px, py);
          if (hit) {
            drawings = drawings.filter((d) => d.id !== hit);
            saveDrawings();
          }
          schedule();
          return;
        }
        const price = yToPrice(py);
        const time = xToTime(px);
        if (dt === "hline") {
          drawings.push({ id: genDrawId(), type: "hline", points: [{ t: time, p: price }] });
          saveDrawings();
          schedule();
          return;
        }
        // trend / fib: two clicks
        if (!pending) {
          pending = { type: dt, points: [{ t: time, p: price }] };
          pendingCursor.x = px;
          pendingCursor.y = py;
        } else {
          pending.points.push({ t: time, p: price });
          drawings.push({ id: genDrawId(), type: pending.type, points: pending.points });
          pending = null;
          saveDrawings();
        }
        schedule();
        return;
      }

      // Cursor tool: select / drag existing drawings before falling back to pan.
      if (dt === "cursor" && pointers.size === 1 && !e.shiftKey) {
        // dragging a handle of the already-selected drawing?
        if (selectedId) {
          const sd = drawings.find((d) => d.id === selectedId);
          if (sd) {
            const h = handleAt(sd, px, py);
            if (h != null) {
              editDrag = { id: sd.id, handle: h, startX: px, startY: py, origin: sd.points.map((q) => ({ ...q })) };
              drag.on = false;
              crosshair.on = false;
              schedule();
              return;
            }
          }
        }
        const hit = hitTestDrawing(px, py);
        if (hit) {
          selectedId = hit;
          const sd = drawings.find((d) => d.id === hit)!;
          editDrag = { id: hit, handle: "body", startX: px, startY: py, origin: sd.points.map((q) => ({ ...q })) };
          drag.on = false;
          crosshair.on = false;
          schedule();
          return;
        }
        if (selectedId) {
          selectedId = null; // clicked empty space — deselect
          schedule();
        }
      }

      if (pointers.size === 1) {
        if (e.shiftKey) {
          // Shift-drag = measure, not pan.
          measure.on = true;
          measure.x1 = measure.x2 = px;
          measure.y1 = measure.y2 = py;
          drag.on = false;
          crosshair.on = false;
        } else {
          drag.on = true;
          drag.lastX = px;
          crosshair.on = false;
        }
      } else {
        drag.on = false;
        measure.on = false;
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

      if (editDrag) {
        const d = drawings.find((dd) => dd.id === editDrag!.id);
        if (d) {
          if (editDrag.handle === "body") {
            const dx = x - editDrag.startX;
            const dy = y - editDrag.startY;
            d.points = editDrag.origin.map((pt) => ({
              t: xToTime(timeToXc(pt.t) + dx),
              p: yToPrice(priceToY(pt.p) + dy),
            }));
          } else {
            d.points[editDrag.handle] = { t: xToTime(x), p: yToPrice(y) };
          }
        }
        schedule();
        return;
      }

      if (pending) {
        pendingCursor.x = x;
        pendingCursor.y = y;
        schedule();
        return;
      }

      if (measure.on) {
        measure.x2 = x;
        measure.y2 = y;
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
      if (pointers.size === 0) {
        drag.on = false;
        if (editDrag) {
          editDrag = null;
          saveDrawings();
          schedule();
        }
        if (measure.on) {
          measure.on = false;
          schedule(); // clear the overlay
        }
      }
    };

    const onPointerLeave = () => {
      crosshair.on = false;
      schedule();
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const x = relX(e.clientX);
      const L = layout();
      // Zoom about the cursor, compounding off the pending target so rapid wheel
      // ticks accumulate smoothly into one eased motion.
      const base = viewTarget ?? viewRef.current;
      const sp = base.to - base.from;
      const anchor = base.from + ((x - L.left) / L.plotW) * sp;
      let factor = e.deltaY > 0 ? 1.1 : 1 / 1.1; // down = zoom out
      let newSpan = sp * factor;
      const maxSpan = Math.max(20, candlesRef.current.length * 4);
      newSpan = Math.min(Math.max(newSpan, 3), maxSpan);
      factor = newSpan / sp;
      const from = anchor - (anchor - base.from) * factor;
      animateTo({ from, to: from + newSpan });
    };

    const onDblClick = (e: MouseEvent) => {
      e.preventDefault();
      reset();
    };

    // Zoom about the viewport centre (keyboard +/−).
    const zoomCenter = (factor: number) => {
      const base = viewTarget ?? viewRef.current;
      const sp = base.to - base.from;
      const center = (base.from + base.to) / 2;
      const maxSpan = Math.max(20, candlesRef.current.length * 4);
      const newSpan = Math.min(Math.max(sp * factor, 3), maxSpan);
      const from = center - newSpan / 2;
      animateTo({ from, to: from + newSpan });
    };

    const onMouseEnter = () => {
      hovered = true;
    };
    const onMouseLeave = () => {
      hovered = false;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!hovered) return;
      const ae = document.activeElement as HTMLElement | null;
      if (ae && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA" || ae.isContentEditable)) return;
      const v = viewRef.current;
      const step = (v.to - v.from) * 0.12;
      switch (e.key) {
        case "ArrowLeft":
          viewTarget = null;
          v.from -= step;
          v.to -= step;
          schedule();
          e.preventDefault();
          break;
        case "ArrowRight":
          viewTarget = null;
          v.from += step;
          v.to += step;
          schedule();
          e.preventDefault();
          break;
        case "+":
        case "=":
          zoomCenter(1 / 1.2);
          e.preventDefault();
          break;
        case "-":
        case "_":
          zoomCenter(1.2);
          e.preventDefault();
          break;
        case "r":
        case "R":
          reset();
          e.preventDefault();
          break;
        case "f":
        case "F":
          onFsRef.current?.();
          e.preventDefault();
          break;
        case "Delete":
        case "Backspace":
          if (selectedId) {
            drawings = drawings.filter((d) => d.id !== selectedId);
            selectedId = null;
            saveDrawings();
            schedule();
            e.preventDefault();
          }
          break;
        case "Escape":
          if (pending) {
            pending = null;
            schedule();
          } else if (selectedId) {
            selectedId = null;
            schedule();
          } else if (typeof document !== "undefined" && document.fullscreenElement) {
            document.exitFullscreen?.();
          }
          break;
      }
    };

    canvas.addEventListener("mouseenter", onMouseEnter);
    canvas.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("keydown", onKeyDown);
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
      canvas.removeEventListener("mouseenter", onMouseEnter);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("keydown", onKeyDown);
      if (raf != null) cancelAnimationFrame(raf);
      if (pulseRaf != null) cancelAnimationFrame(pulseRaf);
    };
  }, []);

  // ── Reconcile incoming data without resetting the user's pan/zoom ────────────
  React.useEffect(() => {
    candlesRef.current = candles;
    intervalRef.current = interval;
    chartTypeRef.current = chartType;
    showVolumeRef.current = showVolume;
    masRef.current = mas;
    priceScaleRef.current = priceScale;
    indicatorsRef.current = indicators;
    bollingerRef.current = bollinger;
    symbolRef.current = symbol;
    compareRef.current = compare;
    eventsRef.current = events;
    onFsRef.current = onToggleFullscreen;
    displayStartRef.current = displayStartTime;
    // currency is part of the props contract but the renderer formats numbers
    // without a currency symbol; reference it so the dep stays honest.
    void currency;

    const api = apiRef.current;
    const prevLen = prevLenRef.current;
    if (rangeRef.current !== range || prevLen === 0) {
      // First paint or range switch: fit to the display window once.
      api?.fit();
      rangeRef.current = range;
    } else if (candles.length !== prevLen) {
      const diff = candles.length - prevLen;
      // A small append (1-3 bars) is a live poll adding fresh candles: follow the
      // right edge only if the user was already looking at it. A larger swing
      // means the source changed (Yahoo↔bot↔Nasdaq) or the warmup size shifted,
      // so the index mapping is no longer comparable — re-fit cleanly instead of
      // sliding the stale view by a bogus offset.
      if (diff > 0 && diff <= 3) {
        if (viewRef.current.to >= prevLen) {
          viewRef.current.from += diff;
          viewRef.current.to += diff;
        }
      } else {
        api?.fit();
      }
    }
    prevLenRef.current = candles.length;
    api?.schedule();
  }, [candles, interval, currency, range, chartType, showVolume, mas, priceScale, indicators, bollinger, symbol, compare, events, onToggleFullscreen, displayStartTime]);

  return (
    <div ref={wrapRef} className={className} tabIndex={0} style={{ outline: "none" }}>
      <canvas ref={canvasRef} style={{ display: "block", touchAction: "none" }} />

      {/* Drawing toolbar (bottom-left): cursor · h-line · trend · fib · erase */}
      <div
        className="absolute bottom-2 left-2 z-10 inline-flex items-center gap-0.5 rounded-full border border-card-border p-0.5"
        style={{
          background: "color-mix(in oklab, var(--card) 78%, transparent)",
          backdropFilter: "blur(8px)",
        }}
      >
        {(
          [
            ["cursor", "↖", "Cursor / pan"],
            ["hline", "─", "Horizontal line"],
            ["trend", "╱", "Trend line"],
            ["fib", "≣", "Fibonacci retracement"],
            ["erase", "⌫", "Erase (click a drawing)"],
          ] as const
        ).map(([key, glyph, label]) => {
          const active = tool === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTool((t) => (t === key ? "cursor" : key))}
              title={label}
              aria-label={label}
              aria-pressed={active}
              className="flex h-6 w-6 items-center justify-center rounded-full font-mono text-xs transition-colors"
              style={
                active
                  ? { background: "var(--success)", color: "#000" }
                  : { color: "var(--muted-foreground)" }
              }
            >
              {glyph}
            </button>
          );
        })}
      </div>
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
});

export default CandleChart;
