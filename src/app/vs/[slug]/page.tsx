import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { COMPARISONS, getComparison } from "@/lib/seo-data/comparisons";
import { ArrowRight, Check, Minus, Scale, X } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd, faqPageLd } from "@/lib/seo-data/jsonld";
import { JsonLd } from "@/components/json-ld";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { SectionLabel } from "@/components/site/section-label";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return COMPARISONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = getComparison(slug);
  if (!c) return {};
  const product = c.productName ?? "GuildLabs";
  return buildMetadata({
    title: `${product} vs ${c.competitorName} — ${new Date().getFullYear()} comparison`,
    description: `${product} vs ${c.competitorName}: an honest feature-by-feature comparison of pricing, paywalled features, AI tools, and setup time — plus when to choose each.`,
    path: `/vs/${c.slug}`,
  });
}

/**
 * Accessible matrix cell: never colour-only. Booleans render an icon plus a
 * visible Yes/No label; strings render a "partial / nuanced" icon plus text.
 */
function FeatureCell({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
        <Check aria-hidden className="size-4 shrink-0 text-accent" />
        Yes
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <X aria-hidden className="size-4 shrink-0 text-muted-foreground/60" />
        No
      </span>
    );
  }
  return (
    <span className="inline-flex items-start gap-1.5 text-left text-xs text-muted-foreground">
      <Minus aria-hidden className="mt-0.5 size-3.5 shrink-0 text-primary/70" />
      {value}
    </span>
  );
}

export default async function VsPage({ params }: Props) {
  const { slug } = await params;
  const c = getComparison(slug);
  if (!c) notFound();

  const product = c.productName ?? "GuildLabs";

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Comparisons", path: "/vs" },
            { name: `vs ${c.competitorName}`, path: `/vs/${c.slug}` },
          ]),
          faqPageLd(c.faqs),
        ]}
      />
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-4 py-20">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <Link href="/vs" className="hover:text-foreground transition-colors">Comparisons</Link>
          <span>/</span>
          <span className="text-foreground">vs {c.competitorName}</span>
        </nav>

        {/* Hero */}
        <div className="mt-10">
          <SectionLabel tone="outline">{c.category.replace("-", " ")}</SectionLabel>
          <h1 className="mt-4 font-display text-5xl font-black leading-tight tracking-tight sm:text-6xl">
            {product} vs {c.competitorName}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{c.competitorTagline}</p>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">{c.intro}</p>
          <p className="mt-4 text-xs text-muted-foreground">
            Facts last reviewed {c.lastReviewed}. Competitor pricing and features change — always confirm details on
            their official site.
          </p>
        </div>

        {/* Feature matrix */}
        <section className="mt-14" aria-labelledby="feature-comparison">
          <SectionLabel index="01">Side by side</SectionLabel>
          <h2 id="feature-comparison" className="mt-3 font-display text-3xl font-black tracking-tight">
            Feature comparison
          </h2>
          <div className="mt-6 overflow-hidden rounded-3xl border-2 border-card-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <caption className="sr-only">
                  Feature-by-feature comparison of {product} and {c.competitorName}, including pricing and paywalled
                  features.
                </caption>
                <thead>
                  <tr className="border-b-2 border-card-border bg-muted/40">
                    <th scope="col" className="px-5 py-3.5 text-left font-semibold">Feature</th>
                    <th scope="col" className="px-4 py-3.5 text-left font-semibold text-primary">{product}</th>
                    <th scope="col" className="px-4 py-3.5 text-left font-semibold">{c.competitorName}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {c.featureMatrix.map((row) => (
                    <tr key={row.feature} className="bg-card">
                      <th scope="row" className="px-5 py-3 text-left font-medium text-muted-foreground">
                        {row.feature}
                      </th>
                      <td className="px-4 py-3"><FeatureCell value={row.guildlabs} /></td>
                      <td className="px-4 py-3"><FeatureCell value={row.competitor} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Strengths */}
        <section className="mt-14 grid gap-6 sm:grid-cols-2">
          <div className="rounded-3xl border-2 border-primary/20 bg-primary/5 p-6">
            <h2 className="font-display text-xl font-black text-primary">Where {product} wins</h2>
            <ul className="mt-4 space-y-3">
              {c.guildlabsStrengths.map((s) => (
                <li key={s} className="flex items-start gap-2 text-sm">
                  <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border-2 border-card-border bg-card p-6">
            <h2 className="font-display text-xl font-black">Where {c.competitorName} wins</h2>
            <ul className="mt-4 space-y-3">
              {c.competitorStrengths.map((s) => (
                <li key={s} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* When to use each */}
        <section className="mt-14 grid gap-6 sm:grid-cols-2">
          <div className="rounded-3xl border-2 border-card-border bg-card p-6">
            <h2 className="font-display text-lg font-black">Use {product} when…</h2>
            <ul className="mt-4 space-y-2">
              {c.useWhenGuildLabs.map((u) => (
                <li key={u} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ArrowRight aria-hidden className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  {u}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border-2 border-card-border bg-card p-6">
            <h2 className="font-display text-lg font-black">Use {c.competitorName} when…</h2>
            <ul className="mt-4 space-y-2">
              {c.useWhenCompetitor.map((u) => (
                <li key={u} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ArrowRight aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                  {u}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Honest tradeoffs */}
        <section className="mt-14" aria-labelledby="choose-them">
          <SectionLabel index="02" tone="accent">The honest part</SectionLabel>
          <h2 id="choose-them" className="mt-3 font-display text-3xl font-black tracking-tight">
            When to choose {c.competitorName} instead
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            We&apos;d rather you pick the right tool than pick ours. These are the cases where {c.competitorName} is
            genuinely the better call:
          </p>
          <div className="mt-6 rounded-3xl border-2 border-card-border bg-card p-6 sm:p-8">
            <ul className="space-y-4">
              {c.chooseThemInstead.map((reason) => (
                <li key={reason} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                  <Scale aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Migration */}
        <section className="mt-14" aria-labelledby="migration">
          <SectionLabel index="03">Switching guide</SectionLabel>
          <h2 id="migration" className="mt-3 font-display text-3xl font-black tracking-tight">
            {c.migration.heading}
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground leading-relaxed">{c.migration.intro}</p>
          <ol className="mt-6 space-y-4">
            {c.migration.steps.map((step, i) => (
              <li key={step.title} className="flex gap-4 rounded-3xl border-2 border-card-border bg-card p-6">
                <span
                  aria-hidden
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-sm font-black text-primary"
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-display font-bold">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Verdict */}
        <section className="mt-14 rounded-3xl border-2 border-card-border bg-card p-8">
          <h2 className="font-display text-2xl font-black tracking-tight">Verdict</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">{c.verdict}</p>
        </section>

        {/* CTA */}
        <section className="mt-10 rounded-3xl border-2 border-primary/20 bg-primary/5 p-8 text-center">
          <h2 className="font-display text-2xl font-black">Try {product} free</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {product === "ChartIt"
              ? "Add ChartIt to your Discord server in seconds. No account, no API key."
              : "Set up your Discord server in minutes. No account required."}
          </p>
          <Link
            href={product === "ChartIt" ? "/bots/chartit" : "/"}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-display font-bold text-primary-foreground transition-all hover:opacity-90"
          >
            {product === "ChartIt" ? "Get ChartIt" : "Start building"} <ArrowRight aria-hidden className="size-4" />
          </Link>
        </section>

        {/* FAQs */}
        <section className="mt-16" aria-labelledby="faqs">
          <SectionLabel index="04">Quick answers</SectionLabel>
          <h2 id="faqs" className="mt-3 font-display text-3xl font-black tracking-tight">FAQs</h2>
          <div className="mt-6 space-y-4">
            {c.faqs.map((f) => (
              <div key={f.q} className="rounded-3xl border-2 border-card-border bg-card p-6">
                <h3 className="font-display font-bold">{f.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Related links */}
        {c.related.length > 0 && (
          <section className="mt-16" aria-labelledby="related">
            <h2 id="related" className="font-display text-xl font-black tracking-tight">Keep exploring</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {c.related.map((r) => (
                <Link
                  key={r.href}
                  href={r.href}
                  className="group inline-flex items-center gap-2 rounded-full border-2 border-card-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {r.label}
                  <ArrowRight aria-hidden className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
