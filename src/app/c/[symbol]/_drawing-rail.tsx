"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { DrawTool } from "./_candle-chart";
import { EASE_EXPO } from "@/lib/motion";

/**
 * TradingView-style left drawing rail with grouped flyout menus. The geometry /
 * drawing engine is untouched — this only re-presents the existing tool picker.
 * Functional tools call `onSelect(DrawTool)`; everything else in TradingView's
 * taxonomy is shown but disabled ("coming soon") rather than shipped broken.
 *
 * Keep theme tokens only. Glyphs (mono) match the engine's existing tool icons.
 */

type ToolItem = { label: string; tool?: DrawTool; glyph: string; shortcut?: string; soon?: boolean };
type Section = { heading?: string; items: ToolItem[] };
type Group = { id: string; glyph: string; title: string; sections: Section[] };

const GROUPS: Group[] = [
  {
    id: "cursor",
    glyph: "✛",
    title: "Cursors",
    sections: [
      {
        items: [
          { label: "Cross", tool: "cursor", glyph: "✛" },
          { label: "Eraser", tool: "erase", glyph: "⌫" },
          { label: "Dot", glyph: "·", soon: true },
          { label: "Arrow", glyph: "↖", soon: true },
        ],
      },
    ],
  },
  {
    id: "lines",
    glyph: "╱",
    title: "Trend lines",
    sections: [
      {
        items: [
          { label: "Trend line", tool: "trend", glyph: "╱" },
          { label: "Ray", tool: "ray", glyph: "→" },
          { label: "Horizontal line", tool: "hline", glyph: "─" },
          { label: "Vertical line", tool: "vline", glyph: "│" },
          { label: "Parallel channel", tool: "channel", glyph: "▱" },
          { label: "Extended line", glyph: "↔", soon: true },
          { label: "Info line", glyph: "ℹ", soon: true },
          { label: "Trend angle", glyph: "∠", soon: true },
          { label: "Horizontal ray", glyph: "⊢", soon: true },
          { label: "Cross line", glyph: "✚", soon: true },
          { label: "Regression trend", glyph: "≈", soon: true },
          { label: "Flat top / bottom", glyph: "⊤", soon: true },
          { label: "Disjoint channel", glyph: "⫽", soon: true },
          { label: "Pitchfork", glyph: "Ψ", soon: true },
        ],
      },
    ],
  },
  {
    id: "fib",
    glyph: "≣",
    title: "Fibonacci & Gann",
    sections: [
      {
        heading: "Fibonacci",
        items: [
          { label: "Fib retracement", tool: "fib", glyph: "≣", shortcut: "⌥F" },
          { label: "Trend-based fib extension", glyph: "≣", soon: true },
          { label: "Fib channel", glyph: "⫽", soon: true },
          { label: "Fib time zone", glyph: "┊", soon: true },
          { label: "Fib speed resistance fan", glyph: "◹", soon: true },
          { label: "Trend-based fib time", glyph: "┊", soon: true },
          { label: "Fib circles", glyph: "◎", soon: true },
          { label: "Fib spiral", glyph: "@", soon: true },
          { label: "Pitchfan", glyph: "≺", soon: true },
        ],
      },
      {
        heading: "Gann",
        items: [
          { label: "Gann box", glyph: "▦", soon: true },
          { label: "Gann square fixed", glyph: "▦", soon: true },
          { label: "Gann square", glyph: "▦", soon: true },
          { label: "Gann fan", glyph: "◹", soon: true },
        ],
      },
    ],
  },
  {
    id: "forecast",
    glyph: "L",
    title: "Forecasting & measurers",
    sections: [
      {
        heading: "Forecasting",
        items: [
          { label: "Long position", tool: "long", glyph: "L↑" },
          { label: "Short position", tool: "short", glyph: "S↓" },
          { label: "Position forecast", glyph: "⤢", soon: true },
          { label: "Bars pattern", glyph: "▮", soon: true },
          { label: "Ghost feed", glyph: "◌", soon: true },
          { label: "Projection", glyph: "⤳", soon: true },
          { label: "Fixed range volume profile", glyph: "▤", soon: true },
          { label: "Anchored volume profile", glyph: "▤", soon: true },
        ],
      },
      {
        heading: "Measurers",
        items: [
          { label: "Price range", glyph: "↕", soon: true },
          { label: "Date range", glyph: "↔", soon: true },
          { label: "Date & price range", glyph: "⤡", soon: true },
        ],
      },
    ],
  },
  {
    id: "shapes",
    glyph: "▭",
    title: "Shapes",
    sections: [
      {
        items: [
          { label: "Rectangle", tool: "rect", glyph: "▭" },
          { label: "Arrow", tool: "arrow", glyph: "↗" },
          { label: "Rotated rectangle", glyph: "◇", soon: true },
          { label: "Ellipse", glyph: "◯", soon: true },
          { label: "Brush", glyph: "✎", soon: true },
          { label: "Highlighter", glyph: "▮", soon: true },
          { label: "Path", glyph: "⌇", soon: true },
          { label: "Polyline", glyph: "∿", soon: true },
          { label: "Arc", glyph: "◜", soon: true },
          { label: "Curve", glyph: "∽", soon: true },
        ],
      },
    ],
  },
  {
    id: "annotate",
    glyph: "T",
    title: "Annotation",
    sections: [
      {
        items: [
          { label: "Text", tool: "text", glyph: "T" },
          { label: "Note", glyph: "✑", soon: true },
          { label: "Callout", glyph: "❝", soon: true },
          { label: "Price label", glyph: "⌖", soon: true },
          { label: "Signpost", glyph: "⚑", soon: true },
          { label: "Flag mark", glyph: "⚐", soon: true },
          { label: "Table", glyph: "▦", soon: true },
        ],
      },
    ],
  },
  {
    id: "tools",
    glyph: "⩒",
    title: "Tools",
    sections: [
      {
        items: [
          { label: "Anchored VWAP", tool: "avwap", glyph: "⩒" },
          { label: "Price alert", tool: "alert", glyph: "🔔" },
          { label: "Measure (shift-drag)", glyph: "📏", soon: true },
        ],
      },
    ],
  },
  {
    id: "patterns",
    glyph: "◇",
    title: "Patterns",
    sections: [
      {
        items: [
          { label: "XABCD pattern", glyph: "◇", soon: true },
          { label: "Cypher pattern", glyph: "◇", soon: true },
          { label: "ABCD pattern", glyph: "◇", soon: true },
          { label: "Head & shoulders", glyph: "⩙", soon: true },
          { label: "Elliott impulse wave", glyph: "∿", soon: true },
          { label: "Three drives", glyph: "⋰", soon: true },
        ],
      },
    ],
  },
  {
    id: "emoji",
    glyph: "☺",
    title: "Emoji & icons",
    sections: [{ items: [{ label: "Emoji / icons / stickers", glyph: "☺", soon: true }] }],
  },
];

export function DrawingRail({
  tool,
  onSelect,
  magnet,
  onToggleMagnet,
  onUndo,
  onRedo,
  onClear,
}: {
  tool: DrawTool;
  onSelect: (t: DrawTool) => void;
  magnet: boolean;
  onToggleMagnet: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
}) {
  const reduce = useReducedMotion();
  const [openGroup, setOpenGroup] = React.useState<string | null>(null);
  const [magnetTip, setMagnetTip] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpenGroup(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenGroup(null);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Which group holds the active tool (so the rail highlights it).
  const activeGroup = GROUPS.find((g) =>
    g.sections.some((s) => s.items.some((i) => i.tool === tool))
  )?.id;

  function pick(item: ToolItem) {
    if (item.soon || !item.tool) return;
    onSelect(item.tool);
    setOpenGroup(null);
  }

  function toggleMagnet() {
    onToggleMagnet();
    if (!magnet) {
      setMagnetTip(true);
      setTimeout(() => setMagnetTip(false), 2600);
    }
  }

  const railBtn =
    "relative flex h-8 w-8 items-center justify-center rounded-lg font-mono text-[15px] transition-colors";

  return (
    <div
      ref={ref}
      role="toolbar"
      aria-label="Drawing tools"
      aria-orientation="vertical"
      className="absolute left-1.5 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-0.5 rounded-xl border border-card-border p-1"
      style={{ background: "color-mix(in oklab, var(--card) 82%, transparent)", backdropFilter: "blur(10px)" }}
    >
      {GROUPS.map((g) => {
        const isActive = activeGroup === g.id;
        const isOpen = openGroup === g.id;
        return (
          <div key={g.id} className="relative">
            <button
              type="button"
              onClick={() => setOpenGroup((o) => (o === g.id ? null : g.id))}
              title={g.title}
              aria-label={g.title}
              aria-haspopup="menu"
              aria-expanded={isOpen}
              className={railBtn}
              style={
                isActive
                  ? { background: "var(--success)", color: "#000" }
                  : { color: "var(--muted-foreground)" }
              }
            >
              {g.glyph}
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={reduce ? { opacity: 0 } : { opacity: 0, x: -6, scale: 0.98 }}
                  animate={reduce ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, x: -6, scale: 0.98 }}
                  transition={reduce ? { duration: 0 } : { duration: 0.16, ease: EASE_EXPO }}
                  style={{ transformOrigin: "left center" }}
                  role="menu"
                  className="absolute left-full top-0 z-30 ml-1.5 max-h-[70vh] w-64 overflow-y-auto rounded-xl border border-card-border bg-card p-1.5 shadow-lg"
                >
                  {g.sections.map((sec, si) => (
                    <div key={si}>
                      {sec.heading && (
                        <div className="px-2 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {sec.heading}
                        </div>
                      )}
                      {sec.items.map((item) => {
                        const sel = item.tool === tool;
                        return (
                          <button
                            key={item.label}
                            type="button"
                            role="menuitem"
                            disabled={item.soon}
                            onClick={() => pick(item)}
                            className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
                              item.soon
                                ? "cursor-default text-muted-foreground/50"
                                : sel
                                  ? "bg-primary/15 text-primary"
                                  : "text-foreground hover:bg-muted"
                            }`}
                          >
                            <span className="grid size-5 shrink-0 place-items-center font-mono text-xs">{item.glyph}</span>
                            <span className="flex-1 truncate">{item.label}</span>
                            {item.shortcut && <span className="font-mono text-[10px] text-muted-foreground">{item.shortcut}</span>}
                            {item.soon && <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase">Soon</span>}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* divider */}
      <span className="my-0.5 h-px w-5" style={{ background: "var(--card-border)" }} />

      {/* Bottom toggles */}
      <div className="relative">
        <button
          type="button"
          onClick={toggleMagnet}
          title="Magnet: snap to OHLC"
          aria-label="Magnet mode"
          aria-pressed={magnet}
          className={railBtn}
          style={magnet ? { background: "var(--primary)", color: "var(--primary-foreground)" } : { color: "var(--muted-foreground)" }}
        >
          🧲
        </button>
        <AnimatePresence>
          {magnetTip && (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              className="absolute left-full top-0 z-30 ml-1.5 w-56 rounded-xl bg-primary px-3 py-2 text-xs text-primary-foreground shadow-lg"
            >
              Magnet mode is on — drawing anchors snap to the nearest OHLC value of nearby bars.
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button type="button" onClick={onUndo} title="Undo (⌘Z)" aria-label="Undo" className={railBtn} style={{ color: "var(--muted-foreground)" }}>↶</button>
      <button type="button" onClick={onRedo} title="Redo (⇧⌘Z)" aria-label="Redo" className={railBtn} style={{ color: "var(--muted-foreground)" }}>↷</button>
      <button type="button" onClick={onClear} title="Remove all drawings" aria-label="Remove all drawings" className={railBtn} style={{ color: "var(--muted-foreground)" }}>🗑</button>
    </div>
  );
}
