import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd, faqPageLd, softwareAppLd } from "@/lib/seo-data/jsonld";
import { JsonLd } from "@/components/json-ld";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { DOCS, getBotDocs } from "@/lib/seo-data/docs";
import { BotReference } from "./_reference";

type Props = { params: Promise<{ bot: string }> };

export function generateStaticParams() {
  return DOCS.map((d) => ({ bot: d.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { bot } = await params;
  const doc = getBotDocs(bot);
  if (!doc) return {};
  return buildMetadata({
    title: `${doc.name} commands & docs`,
    description: `${doc.name} documentation: every command with usage, options, examples, and FAQs. ${doc.tagline}.`,
    path: `/docs/${doc.slug}`,
  });
}

export default async function BotDocsPage({ params }: Props) {
  const { bot } = await params;
  const doc = getBotDocs(bot);
  if (!doc) notFound();

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Docs", path: "/docs" },
            { name: doc.name, path: `/docs/${doc.slug}` },
          ]),
          softwareAppLd({ name: doc.name, description: doc.description, path: `/docs/${doc.slug}` }),
          faqPageLd(doc.faqs),
        ]}
      />
      <SiteHeader />
      <BotReference doc={doc} />
      <SiteFooter />
    </>
  );
}
