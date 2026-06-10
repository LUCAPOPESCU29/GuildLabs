import type { Metadata } from "next";
import Link from "next/link";
import { Heart, MessageCircle, AtSign, Mail, Quote } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd } from "@/lib/seo-data/jsonld";
import { JsonLd } from "@/components/json-ld";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { TESTIMONIALS, type TestimonialSource } from "@/lib/seo-data/testimonials";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Wall of love — what people say about GuildLabs",
  description: "Real words from people who use GuildLabs and ChartIt in their Discord servers.",
  path: "/wall",
});

const SOURCE_ICON: Record<TestimonialSource, typeof MessageCircle> = {
  discord: MessageCircle,
  twitter: AtSign,
  email: Mail,
};

export default function WallPage() {
  const hasAny = TESTIMONIALS.length > 0;

  // Only emit Review structured data for REAL testimonials.
  const reviewLd = hasAny
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: TESTIMONIALS.map((t, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "Review",
            reviewBody: t.quote,
            author: { "@type": "Person", name: t.author },
            itemReviewed: { "@type": "SoftwareApplication", name: "GuildLabs", url: SITE_URL },
          },
        })),
      }
    : null;

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Wall of love", path: "/wall" },
          ]),
          ...(reviewLd ? [reviewLd] : []),
        ]}
      />
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-20">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-card-border px-3 py-1 text-sm text-muted-foreground">
            <Heart className="size-4 text-coral" /> Wall of love
          </div>
          <h1 className="mt-5 font-display text-5xl font-black tracking-tight sm:text-6xl">
            Loved by Discord communities
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Real words from people who run GuildLabs and ChartIt in their servers.
          </p>
        </div>

        {hasAny ? (
          <div className="mt-14 columns-1 gap-5 sm:columns-2 lg:columns-3">
            {TESTIMONIALS.map((t, i) => {
              const Icon = SOURCE_ICON[t.source];
              return (
                <figure key={i} className="glass mb-5 break-inside-avoid rounded-3xl p-6">
                  <Quote className="size-5 text-primary/50" />
                  <blockquote className="mt-3 text-foreground/90">{t.quote}</blockquote>
                  <figcaption className="mt-5 flex items-center gap-3">
                    {t.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.avatar} alt="" className="size-9 rounded-full" />
                    ) : (
                      <div className="grid size-9 place-items-center rounded-full bg-primary/15 font-display text-sm font-bold text-primary">
                        {t.author[0]}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="truncate font-display text-sm font-bold">{t.author}</div>
                      {t.serverName && <div className="truncate text-xs text-muted-foreground">{t.serverName}</div>}
                    </div>
                    <Icon className="ml-auto size-4 text-muted-foreground" aria-label={t.source} />
                  </figcaption>
                </figure>
              );
            })}
          </div>
        ) : (
          <div className="mt-14 glass mx-auto max-w-xl rounded-3xl p-10 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-coral/15">
              <Heart className="size-7 text-coral" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-black">Be the first to vouch for us</h2>
            <p className="mt-3 text-muted-foreground">
              Using ChartIt or GuildLabs and liking it? We&apos;d genuinely love to hear from you — your words could
              be the first on this wall.
            </p>
            <Link
              href="/bots/chartit"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-display font-bold text-primary-foreground transition-all hover:brightness-110"
            >
              Try a bot
            </Link>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
