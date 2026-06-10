import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd, itemListLd } from "@/lib/seo-data/jsonld";
import { JsonLd } from "@/components/json-ld";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { GUIDES } from "@/lib/seo-data/guides";
import { GuidesGrid } from "./_grid";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Guides — get more out of Discord tools",
    description:
      "Practical guides for Discord communities: adding chart bots, setting price alerts, choosing finance bots, and more.",
    path: "/guides",
  }),
  alternates: {
    canonical: "/guides",
    types: { "application/rss+xml": "/guides/feed.xml" },
  },
};

export default function GuidesHub() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Guides", path: "/guides" },
          ]),
          itemListLd(GUIDES.map((g) => ({ name: g.title, path: `/guides/${g.slug}` }))),
        ]}
      />
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-20">
        <h1 className="font-display text-5xl font-black tracking-tight sm:text-6xl">
          Guides
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground">
          Practical, no-fluff guides for getting more out of your Discord server.
        </p>
        <div className="mt-12">
          <GuidesGrid guides={GUIDES} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
