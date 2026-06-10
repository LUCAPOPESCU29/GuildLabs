import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BOT_CATEGORIES, getBotCategory } from "@/lib/seo-data/bot-categories";
import { ArrowRight, Check, Star } from "lucide-react";

type Props = { params: Promise<{ category: string }> };

export async function generateStaticParams() {
  return BOT_CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const c = getBotCategory(category);
  if (!c) return {};
  return {
    title: `Best Discord ${c.name} Bots in ${new Date().getFullYear()}`,
    description: c.description,
    openGraph: {
      title: `Best Discord ${c.name} Bots`,
      description: c.description,
      url: `https://www.guildlabs.fun/bots/${c.slug}`,
    },
  };
}

export default async function BotCategoryPage({ params }: Props) {
  const { category } = await params;
  const c = getBotCategory(category);
  if (!c) notFound();

  const related = BOT_CATEGORIES.filter((r) => c.relatedSlugs.includes(r.slug));

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <main className="mx-auto max-w-4xl px-4 py-24">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <Link href="/bots" className="hover:text-foreground transition-colors">Bots</Link>
          <span>/</span>
          <span className="text-foreground">{c.name}</span>
        </nav>

        {/* Hero */}
        <div className="mt-10">
          <span className="text-4xl">{c.emoji}</span>
          <h1 className="mt-4 font-display text-5xl font-black leading-tight tracking-tight sm:text-6xl">
            {c.headline}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">{c.description}</p>
        </div>

        {/* Bot list */}
        <section className="mt-14">
          <h2 className="font-display text-3xl font-black tracking-tight">Top {c.name.toLowerCase()} bots</h2>
          <div className="mt-6 space-y-4">
            {c.bots.map((bot, i) => (
              <div key={bot.name} className="rounded-2xl border border-card-border bg-card p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-black text-primary">
                      {i + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-lg font-black">{bot.name}</h3>
                        {bot.guildlabsBot && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">by GuildLabs</span>
                        )}
                      </div>
                      {bot.highlight && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="size-3" /> {bot.highlight}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${bot.free ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-orange-500/10 text-orange-600 dark:text-orange-400"}`}>
                    {bot.free ? "Free" : "Freemium"}
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{bot.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How to choose */}
        <section className="mt-14">
          <h2 className="font-display text-3xl font-black tracking-tight">How to choose</h2>
          <ul className="mt-6 space-y-3">
            {c.howToChoose.map((tip) => (
              <li key={tip} className="flex items-start gap-3 rounded-xl border border-card-border bg-card px-5 py-4 text-sm text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                {tip}
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <section className="mt-14 rounded-3xl border border-primary/20 bg-primary/5 p-8 text-center">
          <h2 className="font-display text-2xl font-black">
            Set up your Discord server the right way
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            GuildLabs builds your channels, roles, and permissions — then recommends the right bots for your community type. Free.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-display font-bold text-primary-foreground transition-all hover:opacity-90"
          >
            Build your server free <ArrowRight className="size-4" />
          </Link>
        </section>

        {/* FAQs */}
        <section className="mt-16">
          <h2 className="font-display text-3xl font-black tracking-tight">Frequently asked questions</h2>
          <div className="mt-6 space-y-4">
            {c.faqs.map((f) => (
              <div key={f.q} className="rounded-2xl border border-card-border bg-card p-6">
                <h3 className="font-display font-bold">{f.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl font-black tracking-tight">Related bot categories</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/bots/${r.slug}`}
                  className="group rounded-2xl border border-card-border bg-card p-5 transition-all hover:border-primary/40"
                >
                  <span className="text-2xl">{r.emoji}</span>
                  <p className="mt-2 font-display font-bold group-hover:text-primary transition-colors">{r.name} bots</p>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{r.description}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
