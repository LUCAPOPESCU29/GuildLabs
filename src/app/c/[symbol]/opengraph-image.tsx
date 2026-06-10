import { ImageResponse } from "next/og";
import { getChartData, DEFAULT_RANGE } from "@/lib/market-data";

// Live data — render per request, don't statically cache the unfurl image.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const alt = "ChartIt live chart";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const UP = "#16c784";
const DOWN = "#ea3943";
const FLAT = "#8a939b";

function cleanSymbol(raw: string) {
  return decodeURIComponent(raw || "").trim().toUpperCase();
}

function fmtPrice(n: number | null) {
  if (n == null || Number.isNaN(n)) return "—";
  const abs = Math.abs(n);
  if (abs !== 0 && abs < 1) return n.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(n: number | null) {
  if (n == null || Number.isNaN(n)) return "";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export default async function Image({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const sym = cleanSymbol(symbol);

  // Best-effort live quote; the card still renders (symbol only) if it fails.
  let price: number | null = null;
  let changePercent: number | null = null;
  let name = sym;
  let currency = "USD";
  try {
    const data = await getChartData(sym, DEFAULT_RANGE);
    price = data.price;
    changePercent = data.changePercent;
    name = data.name || sym;
    currency = data.currency || "USD";
  } catch {
    // leave defaults — generic branded card
  }

  const color = changePercent == null ? FLAT : changePercent > 0 ? UP : changePercent < 0 ? DOWN : FLAT;
  const arrow = changePercent == null ? "" : changePercent > 0 ? "▲" : changePercent < 0 ? "▼" : "▬";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0a0c",
          padding: "64px 72px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", fontSize: 34, color: "#fff", fontWeight: 700 }}>
          <span style={{ marginRight: 14 }}>📈</span>
          <span>ChartIt</span>
          <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 600, marginLeft: 16, fontSize: 26 }}>
            guildlabs.fun
          </span>
        </div>

        {/* Ticker + price */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 110, color: "#fff", fontWeight: 800, lineHeight: 1 }}>{sym}</div>
          <div style={{ fontSize: 32, color: "rgba(255,255,255,0.55)", marginTop: 12 }}>
            {name.slice(0, 48)}
          </div>
          {price != null && (
            <div style={{ display: "flex", alignItems: "baseline", marginTop: 28 }}>
              <span style={{ fontSize: 72, color: "#fff", fontWeight: 700 }}>
                {fmtPrice(price)} {currency}
              </span>
              {changePercent != null && (
                <span style={{ fontSize: 48, color, fontWeight: 700, marginLeft: 28 }}>
                  {arrow} {fmtPct(changePercent)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ fontSize: 24, color: "rgba(255,255,255,0.4)" }}>
          Live candlestick chart · informational only, not financial advice
        </div>
      </div>
    ),
    { ...size }
  );
}
