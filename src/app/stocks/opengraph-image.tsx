import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const runtime = "nodejs";
export const alt = "Live charts for Discord";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({
    eyebrow: "ChartIt",
    title: "Live charts for Discord",
    subtitle: "Stocks, crypto, ETFs & indices — post them in your server.",
  });
}
