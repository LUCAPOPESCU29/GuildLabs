import { CHANGELOG } from "@/lib/seo-data/changelog";
import { SITE_URL } from "@/lib/seo";

// Cache the feed for an hour at the edge; it only changes when we ship.
export const revalidate = 3600;

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!)
  );
}

function rfc822(iso: string) {
  return new Date(`${iso}T12:00:00Z`).toUTCString();
}

export function GET() {
  const items = CHANGELOG.map((entry) => {
    const body = [
      entry.summary,
      ...entry.items.map((i) => `• [${i.type}] ${i.text}`),
    ].join("\n");
    const link = `${SITE_URL}/changelog`;
    return `    <item>
      <title>${escapeXml(`${entry.bot}: ${entry.title}`)}</title>
      <link>${link}</link>
      <guid isPermaLink="false">${escapeXml(`${entry.date}-${entry.title}`)}</guid>
      <pubDate>${rfc822(entry.date)}</pubDate>
      <description>${escapeXml(body)}</description>
    </item>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>GuildLabs — Changelog</title>
    <link>${SITE_URL}/changelog</link>
    <description>New features, improvements, and fixes across GuildLabs and its Discord bots.</description>
    <language>en</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
