import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";
import { GUIDES, getGuide } from "@/lib/seo-data/guides";

export const runtime = "nodejs";
export const alt = "GuildLabs guide";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getGuide(slug);
  return ogCard({
    eyebrow: "Guide",
    title: g?.title ?? "GuildLabs guide",
    subtitle: g ? `${g.readingMinutes} min read` : undefined,
  });
}
