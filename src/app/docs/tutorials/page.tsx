import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd, itemListLd } from "@/lib/seo-data/jsonld";
import { JsonLd } from "@/components/json-ld";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Reveal } from "@/components/site/reveal";
import { TUTORIALS } from "@/lib/tutorials";
import { TutorialsIndex } from "./_tutorials-index";

export const metadata: Metadata = buildMetadata({
  title: "Tutorials — Learn GuildLabs step by step",
  description:
    "Step-by-step tutorials for Construct, ChartIt, and Maven — build a server with AI, deploy to Discord, post charts, set alerts, and more.",
  path: "/docs/tutorials",
});

export default function TutorialsHub() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Docs", path: "/docs" },
            { name: "Tutorials", path: "/docs/tutorials" },
          ]),
          itemListLd(TUTORIALS.map((t) => ({ name: t.title, path: `/docs/tutorials/${t.slug}` }))),
        ]}
      />
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-6xl px-4 pb-12 pt-24 sm:pt-28">
          <Reveal>
            <div className="flex items-center gap-2 text-sm font-medium text-secondary">
              <GraduationCap className="size-4" /> TUTORIALS
            </div>
            <h1 className="mt-4 max-w-3xl font-display text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl text-balance">
              Learn GuildLabs, step by step.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground text-pretty">
              {TUTORIALS.length} short, practical walkthroughs — from building your first server
              with AI to posting charts and self-hosting a bot.
            </p>
          </Reveal>
        </section>
        <TutorialsIndex tutorials={TUTORIALS} />
      </main>
      <SiteFooter />
    </>
  );
}
