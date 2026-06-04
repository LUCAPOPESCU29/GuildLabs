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

const UP = "#16c784";
const DOWN = "#ea3943";
const GRID = "rgba(255,255,255,0.05)";
const GRID_SOFT = "rgba(255,255,255,0.035)";
const AXIS_TEXT = "rgba(255,255,255,0.5)";
const CROSS = "rgba(255,255,255,0.28)";
const CHIP_BG = "#27272a";
const FONT = "12px ui-monospace, SFMono-Regular, Menlo, Monaco, monospace";

// Plot insets: room for the right-hand price axis + bottom time axis.
const PRICE_W = 60;
const TIME_H = 22;
const PAD = 10;

export interface Candle {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
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
}: CandleChartProps) {
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  // Live state the imperative renderer reads/writes (never triggers re-render).
  const candlesRef = React.useRef<Candle[]>(candles);
  const intervalRef = React.useRef(interval);
  const viewRef = React.useRef<View>({ from: 0, to: 1 });
  const rangeRef = React.useRef<string | null>(null);
  const prevLenRef = React.useRef(0);

  // Bridge to the mount-effect closures so the data effect can drive a repaint.
  const apiRef = React.useRef<{ schedule: () => void; fit: () => void } | null>(null);

  // ── Build the whole renderer once, on mount ─────────────────────────────────
  React.useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = { w: 0, h: 0 };
    const crosshair = { x: 0, y: 0, on: false };
    const drag = { on: false, lastX: 0 };
    const pointers = new Map<number, { x: number; y: number }>();
    let pinchDist: number | null = null;
    let raf: number | null = null;

    const intraday = () =>
      intervalRef.current.endsWith("m") || intervalRef.current.endsWith("h");

    const layout = () => ({
      w: size.w,
      h: size.h,
      left: PAD,
      top: PAD,
      right: size.w - PRICE_W,
      bottom: size.h - TIME_H,
      plotW: size.w - PRICE_W - PAD,
      plotH: size.h - TIME_H - PAD,
    });

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
      const yForPrice = (p: number) => L.top + ((hi - p) / span) * L.plotH;
      const priceForY = (y: number) => hi - ((y - L.top) / L.plotH) * span;

      // price grid + right-axis labels
      ctx.textAlign = "left";
      for (const p of priceTicks(lo, hi, 5)) {
        const y = yForPrice(p);
        if (y < L.top - 1 || y > L.bottom + 1) continue;
        ctx.strokeStyle = GRID;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(L.left, Math.round(y) + 0.5);
        ctx.lineTo(L.right, Math.round(y) + 0.5);
        ctx.stroke();
        ctx.fillStyle = AXIS_TEXT;
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
        ctx.strokeStyle = GRID_SOFT;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(Math.round(x) + 0.5, L.top);
        ctx.lineTo(Math.round(x) + 0.5, L.bottom);
        ctx.stroke();
        ctx.fillStyle = AXIS_TEXT;
        ctx.fillText(fmtTimeLabel(cs[i].time, intra), x, L.bottom + TIME_H / 2 + 1);
      }

      // candles (clipped to the plot)
      const bodyW = Math.max(1, bw * 0.7);
      const drawFrom = Math.max(0, Math.floor(v.from) - 1);
      const drawTo = Math.min(cs.length - 1, Math.ceil(v.to) + 1);
      ctx.save();
      ctx.beginPath();
      ctx.rect(L.left, L.top, L.plotW, L.plotH);
      ctx.clip();
      for (let i = drawFrom; i <= drawTo; i++) {
        const c = cs[i];
        const cx = xForIndex(i + 0.5);
        if (cx < L.left - bw || cx > L.right + bw) continue;
        const up = c.close >= c.open;
        const color = up ? UP : DOWN;
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
      ctx.restore();

      // last-price dashed line + axis chip (subtle "live" cue)
      if (cs.length > 0) {
        const lastC = cs[cs.length - 1];
        const ly = yForPrice(lastC.close);
        if (ly >= L.top && ly <= L.bottom) {
          const col = lastC.close >= lastC.open ? UP : DOWN;
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
          roundRect(ctx, L.right + 2, ly - 9, Math.min(tw + 10, PRICE_W - 4), 18, 4);
          ctx.fill();
          ctx.fillStyle = "#06140d";
          ctx.textAlign = "left";
          ctx.fillText(label, L.right + 7, ly);
        }
      }

      // crosshair + hovered-candle OHLC legend
      if (crosshair.on && !drag.on) {
        const idx = Math.floor(indexForX(crosshair.x));
        const hasBar = idx >= 0 && idx < cs.length;
        const snapX = hasBar ? xForIndex(idx + 0.5) : crosshair.x;

        ctx.save();
        ctx.strokeStyle = CROSS;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        if (snapX >= L.left && snapX <= L.right) {
          ctx.beginPath();
          ctx.moveTo(Math.round(snapX) + 0.5, L.top);
          ctx.lineTo(Math.round(snapX) + 0.5, L.bottom);
          ctx.stroke();
        }
        if (crosshair.y >= L.top && crosshair.y <= L.bottom) {
          ctx.beginPath();
          ctx.moveTo(L.left, Math.round(crosshair.y) + 0.5);
          ctx.lineTo(L.right, Math.round(crosshair.y) + 0.5);
          ctx.stroke();
        }
        ctx.restore();

        if (crosshair.y >= L.top && crosshair.y <= L.bottom) {
          const plabel = fmtPrice(priceForY(crosshair.y));
          const tw = ctx.measureText(plabel).width;
          ctx.fillStyle = CHIP_BG;
          roundRect(ctx, L.right + 2, crosshair.y - 9, Math.min(tw + 10, PRICE_W - 4), 18, 4);
          ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.textAlign = "left";
          ctx.fillText(plabel, L.right + 7, crosshair.y);
        }
        if (hasBar && snapX >= L.left && snapX <= L.right) {
          const tlabel = fmtTimeLabel(cs[idx].time, intra);
          const tw = ctx.measureText(tlabel).width;
          const cxp = Math.max(L.left + tw / 2 + 4, Math.min(snapX, L.right - tw / 2 - 4));
          ctx.fillStyle = CHIP_BG;
          roundRect(ctx, cxp - tw / 2 - 5, L.bottom + 2, tw + 10, 18, 4);
          ctx.fill();
          ctx.fillStyle = "#fff";
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
          ctx.textAlign = "left";
          let lx = L.left + 4;
          const ly = L.top + 9;
          for (const [k, val] of parts) {
            ctx.fillStyle = "rgba(255,255,255,0.45)";
            ctx.fillText(k, lx, ly);
            lx += ctx.measureText(k).width + 4;
            ctx.fillStyle = up ? UP : DOWN;
            ctx.fillText(val, lx, ly);
            lx += ctx.measureText(val).width + 12;
          }
          ctx.fillStyle = up ? UP : DOWN;
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

    // Expose the bits the data effect needs, then do the first layout.
    apiRef.current = { schedule, fit };
    if (candlesRef.current.length > 0 && rangeRef.current === null) fit();
    applySize();

    const ro = new ResizeObserver(applySize);
    ro.observe(wrap);

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

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", endPointer);
    canvas.addEventListener("pointercancel", endPointer);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      apiRef.current = null;
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", endPointer);
      canvas.removeEventListener("pointercancel", endPointer);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("wheel", onWheel);
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, []);

  // ── Reconcile incoming data without resetting the user's pan/zoom ────────────
  React.useEffect(() => {
    candlesRef.current = candles;
    intervalRef.current = interval;
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
  }, [candles, interval, currency, range]);

  return (
    <div ref={wrapRef} className={className}>
      <canvas ref={canvasRef} style={{ display: "block", touchAction: "none" }} />
    </div>
  );
}
