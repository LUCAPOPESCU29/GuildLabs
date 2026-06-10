import { GUIDES } from "@/lib/seo-data/guides";
import { SITE_URL } from "@/lib/seo";

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
  const items = GUIDES.map((g) => {
    const link = `${SITE_URL}/guides/${g.slug}`;
    return `    <item>
      <title>${escapeXml(g.title)}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <pubDate>${rfc822(g.updated ?? g.date)}</pubDate>
      <description>${escapeXml(g.description)}</description>
    </item>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>GuildLabs — Guides</title>
    <link>${SITE_URL}/guides</link>
    <description>Practical guides for getting more out of your Discord server.</description>
    <language>en</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
