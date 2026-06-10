import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const runtime = "nodejs";
export const alt = "GuildLabs Comparisons";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({
    eyebrow: "Comparisons",
    title: "GuildLabs vs alternatives",
    subtitle: "How GuildLabs and ChartIt compare to popular Discord tools.",
  });
}
