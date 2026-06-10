/**
 * Product changelog. Entries are transcribed from the project's real git
 * history — no invented releases. Newest first.
 */

export type ChangeType = "added" | "improved" | "fixed";
export type BotTag = "ChartIt" | "Construct" | "Maven" | "Platform";

export type ChangelogEntry = {
  /** ISO date (YYYY-MM-DD). */
  date: string;
  version?: string;
  bot: BotTag;
  title: string;
  summary: string;
  items: { type: ChangeType; text: string }[];
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: "2026-06-08",
    bot: "ChartIt",
    title: "Heatmaps, comparisons, news & personal alerts",
    summary:
      "A big batch of Discord-native commands that make ChartIt more useful day-to-day — and more shareable.",
    items: [
      { type: "added", text: "/heatmap — a colorful market heatmap of daily % change for stocks or crypto" },
      { type: "added", text: "/compare — overlay 2–5 tickers on one normalized % change chart" },
      { type: "added", text: "/news — latest headlines for a ticker, plus headlines now appear under /chart" },
      { type: "added", text: "/portfolio — a personal, per-user watchlist with live prices" },
      { type: "added", text: "Personal DM price alerts — any member can set /alert … target: DM me" },
      { type: "improved", text: "Every chart and command now links back to a live web chart with ChartIt branding" },
    ],
  },
  {
    date: "2026-06-07",
    bot: "ChartIt",
    title: "TradingView-style drawing tools",
    summary: "Click-drag drawing on the interactive web chart, matching the feel of pro charting tools.",
    items: [
      { type: "added", text: "Click-drag Fibonacci and rectangle tools" },
      { type: "added", text: "Trend lines, rays, and arrows" },
    ],
  },
  {
    date: "2026-06-06",
    bot: "ChartIt",
    title: "Indicators overhaul",
    summary: "A full indicator suite, reorganized behind a calmer toolbar.",
    items: [
      { type: "added", text: "Overlay indicators on the price chart" },
      { type: "added", text: "11 new oscillator panes you can stack" },
      { type: "improved", text: "Folded ~30 toolbar pills into a single, tidy Indicators popover" },
    ],
  },
  {
    date: "2026-06-05",
    bot: "ChartIt",
    title: "Pro charting release",
    summary:
      "The interactive web chart grew up — drawing tools, advanced indicators, replay, and more chart types.",
    items: [
      { type: "added", text: "Drawing tools — horizontal/trend lines, Fibonacci retracements & extensions, channels" },
      { type: "added", text: "VWAP (and anchored VWAP), volume MA & profile, EMA ribbons with golden/death cross markers" },
      { type: "added", text: "Bar replay mode, measure tool, and PNG export" },
      { type: "added", text: "More chart types — Heikin-Ashi, hollow candles, and baseline" },
      { type: "added", text: "On-chart price alerts with browser notifications, plus long/short position tools" },
      { type: "improved", text: "Smarter rendering — thinner bars, eased zoom, and polished grid" },
    ],
  },
];
