import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const runtime = "nodejs";
export const alt = "GuildLabs Docs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({
    eyebrow: "Documentation",
    title: "GuildLabs Docs",
    subtitle: "Command references, usage, and examples for every GuildLabs bot.",
  });
}
