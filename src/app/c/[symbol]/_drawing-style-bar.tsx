"use client";

import * as React from "react";
import type { CandleChartHandle } from "./_candle-chart";

// Brand-leaning defaults + a couple of neutrals; users can also pick any custom
// colour. These are user data (free choice), not constrained to UI tokens.
const SWATCHES = ["#6b73ff", "#3fbf7f", "#e0a93b", "#5b9cf0", "#d678d6", "#ff5d6c", "#ffffff", "#8a939b"];

/**
 * Floating colour bar for the selected drawing. The drawing array lives in the
 * canvas engine's closure (off React for 60fps), so we read/write the selection
 * through the imperative handle and poll it for selection changes.
 */
export function DrawingStyleBar({ chartRef }: { chartRef: React.RefObject<CandleChartHandle | null> }) {
  const [selId, setSelId] = React.useState<string | null>(null);
  const [color, setColor] = React.useState<string | null>(null);

  React.useEffect(() => {
    const id = setInterval(() => {
      const sid = chartRef.current?.getSelectedId() ?? null;
      setSelId((prev) => (prev === sid ? prev : sid));
      if (sid) setColor(chartRef.current?.getSelectedColor() ?? null);
    }, 200);
    return () => clearInterval(id);
  }, [chartRef]);

  if (!selId) return null;

  function apply(c: string) {
    chartRef.current?.setSelectedColor(c);
    setColor(c);
  }

  return (
    <div
      className="absolute left-1/2 top-3 z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-card-border px-2.5 py-1.5 shadow-lg"
      style={{ background: "color-mix(in oklab, var(--card) 92%, transparent)", backdropFilter: "blur(10px)" }}
      role="toolbar"
      aria-label="Drawing colour"
    >
      <span className="px-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Colour</span>
      {SWATCHES.map((c) => {
        const on = color?.toLowerCase() === c.toLowerCase();
        return (
          <button
            key={c}
            type="button"
            onClick={() => apply(c)}
            aria-label={`Set colour ${c}`}
            aria-pressed={on}
            className="size-5 rounded-full transition-transform hover:scale-110"
            style={{ background: c, outline: on ? "2px solid var(--foreground)" : "1px solid var(--card-border)", outlineOffset: "1px" }}
          />
        );
      })}
      <label
        className="relative ml-0.5 grid size-5 cursor-pointer place-items-center rounded-full border border-card-border text-xs text-muted-foreground"
        title="Custom colour"
      >
        +
        <input
          type="color"
          value={color ?? "#6b73ff"}
          onChange={(e) => apply(e.target.value)}
          aria-label="Custom colour"
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
    </div>
  );
}
