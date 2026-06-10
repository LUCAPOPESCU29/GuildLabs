import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { COMPARISONS, getComparison } from "@/lib/seo-data/comparisons";
import { Check, X, ArrowRight } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd, faqPageLd } from "@/lib/seo-data/jsonld";
import { JsonLd } from "@/components/json-ld";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

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
    description: `${product} vs ${c.competitorName}: compare features, pricing, and use cases. Find out which is right for your Discord community.`,
    path: `/vs/${c.slug}`,
  });
}

function FeatureCell({ value }: { value: string | boolean }) {
  if (value === true) return <Check className="size-5 text-green-500 mx-auto" />;
  if (value === false) return <X className="size-5 text-muted-foreground/40 mx-auto" />;
  return <span className="text-xs text-muted-foreground">{value}</span>;
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
          <span className="rounded-full border border-card-border px-3 py-1 text-xs font-mono text-muted-foreground">
            {c.category}
          </span>
          <h1 className="mt-4 font-display text-5xl font-black leading-tight tracking-tight sm:text-6xl">
            {product} vs {c.competitorName}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{c.competitorTagline}</p>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">{c.intro}</p>
        </div>

        {/* Feature matrix */}
        <section className="mt-14">
          <h2 className="font-display text-3xl font-black tracking-tight">Feature comparison</h2>
          <div className="mt-6 overflow-hidden rounded-2xl border border-card-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border bg-muted/40">
                  <th className="px-5 py-3.5 text-left font-semibold">Feature</th>
                  <th className="px-4 py-3.5 text-center font-semibold text-primary">{product}</th>
                  <th className="px-4 py-3.5 text-center font-semibold">{c.competitorName}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {c.featureMatrix.map((row) => (
                  <tr key={row.feature} className="bg-card">
                    <td className="px-5 py-3 text-muted-foreground">{row.feature}</td>
                    <td className="px-4 py-3 text-center"><FeatureCell value={row.guildlabs} /></td>
                    <td className="px-4 py-3 text-center"><FeatureCell value={row.competitor} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Strengths */}
        <section className="mt-14 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
            <h2 className="font-display text-xl font-black text-primary">Where {product} wins</h2>
            <ul className="mt-4 space-y-3">
              {c.guildlabsStrengths.map((s) => (
                <li key={s} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-card-border bg-card p-6">
            <h2 className="font-display text-xl font-black">Where {c.competitorName} wins</h2>
            <ul className="mt-4 space-y-3">
              {c.competitorStrengths.map((s) => (
                <li key={s} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* When to use each */}
        <section className="mt-14 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-card-border bg-card p-6">
            <h2 className="font-display text-lg font-black">Use {product} when…</h2>
            <ul className="mt-4 space-y-2">
              {c.useWhenGuildLabs.map((u) => (
                <li key={u} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  {u}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-card-border bg-card p-6">
            <h2 className="font-display text-lg font-black">Use {c.competitorName} when…</h2>
            <ul className="mt-4 space-y-2">
              {c.useWhenCompetitor.map((u) => (
                <li key={u} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ArrowRight className="mt-0.5 size-3.5 shrink-0" />
                  {u}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Verdict */}
        <section className="mt-14 rounded-3xl border border-card-border bg-card p-8">
          <h2 className="font-display text-2xl font-black tracking-tight">Verdict</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">{c.verdict}</p>
        </section>

        {/* CTA */}
        <section className="mt-10 rounded-3xl border border-primary/20 bg-primary/5 p-8 text-center">
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
            {product === "ChartIt" ? "Get ChartIt" : "Start building"} <ArrowRight className="size-4" />
          </Link>
        </section>

        {/* FAQs */}
        <section className="mt-16">
          <h2 className="font-display text-3xl font-black tracking-tight">FAQs</h2>
          <div className="mt-6 space-y-4">
            {c.faqs.map((f) => (
              <div key={f.q} className="rounded-2xl border border-card-border bg-card p-6">
                <h3 className="font-display font-bold">{f.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
