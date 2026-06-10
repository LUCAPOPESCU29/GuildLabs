import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";
import { DOCS, getBotDocs } from "@/lib/seo-data/docs";

export const runtime = "nodejs";
export const alt = "GuildLabs bot documentation";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return DOCS.map((d) => ({ bot: d.slug }));
}

export default async function Image({ params }: { params: Promise<{ bot: string }> }) {
  const { bot } = await params;
  const doc = getBotDocs(bot);
  return ogCard({
    eyebrow: "Documentation",
    title: doc ? `${doc.name} docs` : "GuildLabs docs",
    subtitle: doc?.tagline ?? "Command reference",
  });
}
