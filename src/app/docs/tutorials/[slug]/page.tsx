import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd } from "@/lib/seo-data/jsonld";
import { JsonLd } from "@/components/json-ld";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { TUTORIALS, getTutorial, relatedTutorials } from "@/lib/tutorials";
import { TutorialView } from "./_tutorial-view";

export function generateStaticParams() {
  return TUTORIALS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const t = getTutorial(slug);
  if (!t) return {};
  return buildMetadata({
    title: `${t.title} — GuildLabs tutorial`,
    description: t.summary,
    path: `/docs/tutorials/${t.slug}`,
  });
}

export default async function TutorialPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tutorial = getTutorial(slug);
  if (!tutorial) notFound();

  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Docs", path: "/docs" },
          { name: "Tutorials", path: "/docs/tutorials" },
          { name: tutorial.title, path: `/docs/tutorials/${tutorial.slug}` },
        ])}
      />
      <SiteHeader />
      <TutorialView tutorial={tutorial} related={relatedTutorials(tutorial)} />
      <SiteFooter />
    </>
  );
}
