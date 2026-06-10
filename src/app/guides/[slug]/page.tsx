import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd, articleLd } from "@/lib/seo-data/jsonld";
import { JsonLd } from "@/components/json-ld";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { GUIDES, getGuide, type GuideBlock } from "@/lib/seo-data/guides";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) return {};
  return buildMetadata({
    title: g.title,
    description: g.description,
    path: `/guides/${g.slug}`,
    type: "article",
  });
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[m - 1]} ${d}, ${y}`;
}

function Block({ block }: { block: GuideBlock }) {
  switch (block.type) {
    case "p":
      return <p className="mt-5 leading-relaxed text-muted-foreground">{block.text}</p>;
    case "h2":
      return (
        <h2 id={block.id} className="mt-12 scroll-mt-24 font-display text-2xl font-black tracking-tight">
          {block.text}
        </h2>
      );
    case "list":
      return (
        <ul className="mt-5 space-y-2">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-muted-foreground">
              <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case "steps":
      return (
        <ol className="mt-5 space-y-3">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/15 font-display text-sm font-bold text-primary">
                {i + 1}
              </span>
              <span className="text-muted-foreground">{item}</span>
            </li>
          ))}
        </ol>
      );
    case "code":
      return (
        <pre className="glass-input mt-5 overflow-x-auto rounded-2xl p-4">
          <code className="font-mono text-sm text-primary">{block.code}</code>
        </pre>
      );
    case "callout":
      return (
        <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5 text-sm text-foreground/90">
          {block.text}
        </div>
      );
  }
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) notFound();

  const idx = GUIDES.findIndex((x) => x.slug === g.slug);
  const prev = idx > 0 ? GUIDES[idx - 1] : null;
  const next = idx < GUIDES.length - 1 ? GUIDES[idx + 1] : null;
  const toc = g.body.filter((b): b is Extract<GuideBlock, { type: "h2" }> => b.type === "h2");

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Guides", path: "/guides" },
            { name: g.title, path: `/guides/${g.slug}` },
          ]),
          articleLd({ title: g.title, description: g.description, path: `/guides/${g.slug}`, date: g.date, updated: g.updated }),
        ]}
      />
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-16">
        <Link href="/guides" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" /> All guides
        </Link>

        <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_220px]">
          <article className="min-w-0 max-w-2xl">
            <header>
              <div className="flex flex-wrap gap-2">
                {g.tags.map((t) => (
                  <span key={t} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-mono text-primary">
                    {t}
                  </span>
                ))}
              </div>
              <h1 className="mt-4 font-display text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                {g.title}
              </h1>
              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                <time dateTime={g.date}>{formatDate(g.date)}</time>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5" /> {g.readingMinutes} min read
                </span>
              </div>
            </header>

            <div className="mt-6">
              {g.body.map((block, i) => (
                <Block key={i} block={block} />
              ))}
            </div>

            {/* Related */}
            {g.relatedLinks.length > 0 && (
              <div className="mt-12 rounded-3xl border border-card-border bg-card p-6">
                <h2 className="font-display text-lg font-black">Keep reading</h2>
                <ul className="mt-3 space-y-2">
                  {g.relatedLinks.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                        {l.label} <ArrowRight className="size-3.5" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Prev / next */}
            {(prev || next) && (
              <nav className="mt-10 grid gap-4 sm:grid-cols-2" aria-label="More guides">
                {prev ? (
                  <Link href={`/guides/${prev.slug}`} className="glass rounded-2xl p-5 transition-all hover:-translate-y-0.5">
                    <div className="text-xs text-muted-foreground">← Previous</div>
                    <div className="mt-1 font-display font-bold">{prev.title}</div>
                  </Link>
                ) : (
                  <span />
                )}
                {next && (
                  <Link href={`/guides/${next.slug}`} className="glass rounded-2xl p-5 text-right transition-all hover:-translate-y-0.5">
                    <div className="text-xs text-muted-foreground">Next →</div>
                    <div className="mt-1 font-display font-bold">{next.title}</div>
                  </Link>
                )}
              </nav>
            )}
          </article>

          {/* TOC */}
          {toc.length > 0 && (
            <aside className="hidden lg:block">
              <div className="lg:sticky lg:top-24">
                <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">On this page</div>
                <nav className="mt-3 space-y-1" aria-label="Table of contents">
                  {toc.map((h) => (
                    <a
                      key={h.id}
                      href={`#${h.id}`}
                      className="block rounded-lg px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {h.text}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
