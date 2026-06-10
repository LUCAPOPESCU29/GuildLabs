import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const runtime = "nodejs";
export const alt = "GuildLabs Wall of Love";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({
    eyebrow: "Wall of love",
    title: "Loved by communities",
    subtitle: "What people say about GuildLabs and ChartIt.",
    accent: "#fb7185",
  });
}
