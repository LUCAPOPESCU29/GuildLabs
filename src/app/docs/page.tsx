import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd, itemListLd } from "@/lib/seo-data/jsonld";
import { JsonLd } from "@/components/json-ld";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { DOC_BOTS } from "@/lib/seo-data/docs";
import { DocsLanding } from "./_docs-landing";

export const metadata: Metadata = buildMetadata({
  title: "Docs — GuildLabs bot command reference",
  description:
    "Documentation for every GuildLabs Discord bot. Full command references, usage, examples, and FAQs for ChartIt and more.",
  path: "/docs",
});

export default function DocsHub() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Docs", path: "/docs" },
          ]),
          itemListLd(
            DOC_BOTS.filter((b) => b.documented).map((b) => ({ name: b.name, path: `/docs/${b.slug}` }))
          ),
        ]}
      />
      <SiteHeader />
      <DocsLanding
        bots={DOC_BOTS.map((b) => ({
          slug: b.slug,
          name: b.name,
          tagline: b.tagline,
          documented: b.documented,
          productPath: b.productPath,
        }))}
      />
      <SiteFooter />
    </>
  );
}
