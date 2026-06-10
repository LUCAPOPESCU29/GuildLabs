import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd } from "@/lib/seo-data/jsonld";
import { JsonLd } from "@/components/json-ld";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { CHANGELOG } from "@/lib/seo-data/changelog";
import { ChangelogTimeline } from "./_timeline";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Changelog — what's new in GuildLabs",
    description:
      "Every update to GuildLabs and its Discord bots — new features, improvements, and fixes. Subscribe via RSS.",
    path: "/changelog",
  }),
  alternates: {
    canonical: "/changelog",
    types: { "application/rss+xml": "/changelog/feed.xml" },
  },
};

export default function ChangelogPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Changelog", path: "/changelog" },
        ])}
      />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-20">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-5xl font-black tracking-tight sm:text-6xl">
              What&apos;s <span className="text-primary">new</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              Every feature, improvement, and fix we ship — newest first.
            </p>
          </div>
          <a
            href="/changelog/feed.xml"
            className="hidden shrink-0 rounded-full border border-card-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
          >
            RSS
          </a>
        </div>

        <div className="mt-12">
          <ChangelogTimeline entries={CHANGELOG} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
