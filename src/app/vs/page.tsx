import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { COMPARISONS, type ComparisonPage } from "@/lib/seo-data/comparisons";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd, itemListLd } from "@/lib/seo-data/jsonld";
import { JsonLd } from "@/components/json-ld";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

export const metadata: Metadata = buildMetadata({
  title: "GuildLabs vs alternatives — Discord tool comparisons",
  description:
    "See how GuildLabs and ChartIt compare to MEE6, Carl-bot, Dyno, TradingView, and more. Find out which Discord tool is right for your community.",
  path: "/vs",
});

const CATEGORY_LABELS: Record<ComparisonPage["category"], string> = {
  "server-builder": "Server builders",
  bot: "Discord bots",
  "template-tool": "Template tools",
  "chart-tool": "Charting tools",
};

const CATEGORY_ORDER: ComparisonPage["category"][] = ["chart-tool", "bot", "server-builder", "template-tool"];

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
        <div className="mb-14">
          <h1 className="font-display text-5xl font-black tracking-tight sm:text-6xl">
            GuildLabs <span className="text-primary">Comparisons</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            How GuildLabs and ChartIt stack up against popular Discord bots and tools — and which is right for your
            community.
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
                      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                    </div>
                    <h3 className="mt-4 font-display text-xl font-black">
                      {(c.productName ?? "GuildLabs")} vs {c.competitorName}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.intro}</p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </main>
      <SiteFooter />
    </>
  );
}
