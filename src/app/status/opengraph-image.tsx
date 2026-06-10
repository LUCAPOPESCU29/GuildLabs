import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const runtime = "nodejs";
export const alt = "GuildLabs Status";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({
    eyebrow: "Status",
    title: "Bot uptime & status",
    subtitle: "Live health for every GuildLabs bot.",
  });
}
