import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";
import { COMPARISONS, getComparison } from "@/lib/seo-data/comparisons";

export const runtime = "nodejs";
export const alt = "GuildLabs comparison";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return COMPARISONS.map((c) => ({ slug: c.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getComparison(slug);
  const product = c?.productName ?? "GuildLabs";
  return ogCard({
    eyebrow: "Comparison",
    title: c ? `${product} vs ${c.competitorName}` : "Comparisons",
    subtitle: c?.competitorTagline ?? "Find the right Discord tool for your community.",
  });
}
