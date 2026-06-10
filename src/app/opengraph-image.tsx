import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

// Root OG image — the default unfurl card for any route that doesn't define its
// own opengraph-image. Replaces the previously-referenced (missing) static
// /og-image.png so every page now unfurls on-brand.
export const runtime = "nodejs";
export const alt = "GuildLabs — Discord tools, done right";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({
    eyebrow: "GuildLabs",
    title: "Discord tools, done right",
    subtitle: "Live charts, server setup, and more — free, no subscription.",
  });
}
