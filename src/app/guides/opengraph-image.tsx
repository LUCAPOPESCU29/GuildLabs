import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const runtime = "nodejs";
export const alt = "GuildLabs Guides";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({
    eyebrow: "Guides",
    title: "Get more from your server",
    subtitle: "Practical, no-fluff guides for Discord communities.",
  });
}
