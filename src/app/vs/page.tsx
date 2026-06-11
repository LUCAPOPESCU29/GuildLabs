import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Scale } from "lucide-react";
import { COMPARISONS, type ComparisonPage } from "@/lib/seo-data/comparisons";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd, itemListLd } from "@/lib/seo-data/jsonld";
import { JsonLd } from "@/components/json-ld";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { SectionLabel } from "@/components/site/section-label";

export const metadata: Metadata = buildMetadata({
  title: "GuildLabs vs alternatives — honest Discord tool comparisons",
  description:
    "Honest, feature-by-feature comparisons of GuildLabs and ChartIt against MEE6, Carl-bot, Dyno, TradingView, and more — pricing, paywalled features, and when to choose each.",
  path: "/vs",
});

const CATEGORY_LABELS: Record<ComparisonPage["category"], string> = {
  "server-builder": "Server builders",
  bot: "Discord bots",
  "template-tool": "Template tools",
  "chart-tool": "Charting tools",
};

const CATEGORY_ORDER: ComparisonPage["category"][] = ["chart-tool", "bot", "server-builder", "template-tool"];

const RESOURCE_LINKS = [
  { label: "Free server templates", href: "/templates", blurb: "Pre-built blueprints for gaming, crypto, study, and more" },
  { label: "Construct — AI server builder", href: "/bots/construct", blurb: "Describe your server, deploy it in minutes" },
  { label: "Maven — local-AI FAQ bot", href: "/bots/maven", blurb: "Answers member questions with a private, local model" },
  { label: "ChartIt — charts in Discord", href: "/bots/chartit", blurb: "Live stock & crypto charts, quotes, and price alerts" },
  { label: "Guides", href: "/guides", blurb: "Setup walkthroughs for chart bots, alerts, and finance servers" },
];

export default function VsHub() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Comparisons", path: "/vs" },
          ]),
          itemListLd(
            COMPARISONS.map((c) => ({
              name: `${c.productName ?? "GuildLabs"} vs ${c.competitorName}`,
              path: `/vs/${c.slug}`,
            }))
          ),
        ]}
      />
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-14 max-w-2xl">
          <SectionLabel tone="outline">Comparisons</SectionLabel>
          <h1 className="mt-4 font-display text-5xl font-black tracking-tight sm:text-6xl">
            GuildLabs vs <span className="text-primary">everyone else</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
            Honest, feature-by-feature breakdowns of how GuildLabs and ChartIt stack up against popular Discord bots
            and tools — including pricing, paywalled features, and the cases where the other tool is genuinely the
            better pick.
          </p>
          <p className="mt-3 inline-flex items-start gap-2 text-sm text-muted-foreground">
            <Scale aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />
            Every page includes a &ldquo;when to choose them instead&rdquo; section. We&apos;d rather you pick the right
            tool than pick ours.
          </p>
        </div>

        {CATEGORY_ORDER.map((cat) => {
          const items = COMPARISONS.filter((c) => c.category === cat);
          if (items.length === 0) return null;
          return (
            <section key={cat} className="mb-14">
              <h2 className="mb-5 font-display text-2xl font-black tracking-tight">{CATEGORY_LABELS[cat]}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/vs/${c.slug}`}
                    className="group glass rounded-2xl p-6 transition-all hover:-translate-y-1 hover:border-primary/40"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-mono text-primary">
                        {c.category}
                      </span>
                      <ArrowRight
                        aria-hidden
                        className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary"
                      />
                    </div>
                    <h3 className="mt-4 font-display text-xl font-black">
                      {(c.productName ?? "GuildLabs")} vs {c.competitorName}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.intro}</p>
                    <p className="mt-3 text-xs text-muted-foreground">Reviewed {c.lastReviewed}</p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        {/* Internal resources */}
        <section className="mt-4" aria-labelledby="resources">
          <h2 id="resources" className="font-display text-2xl font-black tracking-tight">
            Decided? Start here
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Everything below is free and open source — no premium tiers anywhere.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {RESOURCE_LINKS.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="group rounded-3xl border-2 border-card-border bg-card p-5 transition-colors hover:border-primary/40"
              >
                <span className="inline-flex items-center gap-2 font-display font-bold group-hover:text-primary">
                  {r.label}
                  <ArrowRight aria-hidden className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
                <p className="mt-1.5 text-sm text-muted-foreground">{r.blurb}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
