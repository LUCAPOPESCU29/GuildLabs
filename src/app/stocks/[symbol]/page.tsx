import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight, LineChart, Bell, Newspaper } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd, faqPageLd, softwareAppLd } from "@/lib/seo-data/jsonld";
import { JsonLd } from "@/components/json-ld";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { CHARTIT_INVITE, CHARTIT_INVITE_EXTERNAL } from "@/lib/links";
import {
  TICKERS,
  getTicker,
  tickerSlug,
  relatedTickers,
  ASSET_LABELS,
  type Ticker,
} from "@/lib/seo-data/tickers";

type Props = { params: Promise<{ symbol: string }> };

export function generateStaticParams() {
  return TICKERS.map((t) => ({ symbol: tickerSlug(t.symbol) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { symbol } = await params;
  const t = getTicker(symbol);
  if (!t) return {};
  return buildMetadata({
    title: `${t.symbol} live chart for Discord — ${t.name}`,
    description: `Post a live ${t.symbol} (${t.name}) candlestick chart, quote, and price alerts in Discord with ChartIt. Free, no API key. ${t.blurb}`,
    path: `/stocks/${tickerSlug(t.symbol)}`,
  });
}

function tickerFaqs(t: Ticker) {
  return [
    {
      q: `How do I see a ${t.symbol} chart in Discord?`,
      a: `Add ChartIt to your server and run /chart symbol:${t.symbol}. It posts a candlestick chart with a live quote and the latest headlines.`,
    },
    {
      q: `Can I set a ${t.symbol} price alert?`,
      a: `Yes. Run /alert add symbol:${t.symbol} direction:above price:<your target> — choose a channel ping or a personal DM alert.`,
    },
    {
      q: `Is ChartIt free for ${t.symbol}?`,
      a: `Yes — ChartIt is free and needs no API key. ${t.name} data comes from free market sources.`,
    },
  ];
}

export default async function TickerPage({ params }: Props) {
  const { symbol } = await params;
  const t = getTicker(symbol);
  if (!t) notFound();

  const faqs = tickerFaqs(t);
  const related = relatedTickers(t);
  const liveUrl = `/c/${encodeURIComponent(t.symbol)}`;

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Stocks", path: "/stocks" },
            { name: t.symbol, path: `/stocks/${tickerSlug(t.symbol)}` },
          ]),
          softwareAppLd({
            name: "ChartIt",
            description: `Live ${t.symbol} charts, quotes, and price alerts in Discord.`,
            path: `/stocks/${tickerSlug(t.symbol)}`,
          }),
          faqPageLd(faqs),
        ]}
      />
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-4 py-16">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
          <span>/</span>
          <Link href="/stocks" className="transition-colors hover:text-foreground">Stocks</Link>
          <span>/</span>
          <span className="text-foreground">{t.symbol}</span>
        </nav>

        {/* Hero */}
        <div className="mt-8">
          <span className="rounded-full border border-card-border px-3 py-1 text-xs font-mono text-muted-foreground">
            {ASSET_LABELS[t.assetClass]}
          </span>
          <h1 className="mt-4 font-display text-4xl font-black leading-tight tracking-tight sm:text-5xl">
            {t.symbol} live chart for Discord
          </h1>
          <p className="mt-2 font-display text-xl text-muted-foreground">{t.name}</p>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {t.blurb} Post a live {t.symbol} candlestick chart, quote, and price alerts right inside your Discord
            server with ChartIt — free, no API key required.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <InviteButton />
            <Link
              href={liveUrl}
              className="inline-flex items-center gap-2 rounded-full border border-card-border px-6 py-3 font-display font-bold text-foreground transition-all hover:bg-muted"
            >
              View live chart <LineChart className="size-4" />
            </Link>
          </div>
        </div>

        {/* Command preview */}
        <section className="mt-14">
          <h2 className="font-display text-2xl font-black tracking-tight">In Discord, just type</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <PreviewCard icon={LineChart} cmd={`/chart symbol:${t.symbol}`} label="Chart + quote + news" />
            <PreviewCard icon={Bell} cmd={`/alert add symbol:${t.symbol}`} label="Price alerts (channel or DM)" />
            <PreviewCard icon={Newspaper} cmd={`/news symbol:${t.symbol}`} label="Latest headlines" />
          </div>
        </section>

        {/* How it works */}
        <section className="mt-14 glass rounded-3xl p-8">
          <h2 className="font-display text-2xl font-black tracking-tight">How it works</h2>
          <ol className="mt-5 space-y-4">
            {[
              "Add ChartIt to your Discord server — it takes one click and no setup.",
              `Run /chart symbol:${t.symbol} to post a candlestick chart with a live quote.`,
              `Set /alert add symbol:${t.symbol} to get pinged when ${t.symbol} crosses your price.`,
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/15 font-display text-sm font-bold text-primary">
                  {i + 1}
                </span>
                <span className="text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display text-2xl font-black tracking-tight">Related {ASSET_LABELS[t.assetClass].toLowerCase()}</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {related.map((r) => (
                <Link
                  key={r.symbol}
                  href={`/stocks/${tickerSlug(r.symbol)}`}
                  className="rounded-full border border-card-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {r.symbol}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="mt-14">
          <h2 className="font-display text-2xl font-black tracking-tight">FAQ</h2>
          <div className="mt-5 space-y-3">
            {faqs.map((f) => (
              <div key={f.q} className="glass rounded-2xl p-6">
                <h3 className="font-display font-bold">{f.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-12 rounded-3xl border border-primary/20 bg-primary/5 p-8 text-center">
          <h2 className="font-display text-2xl font-black">Track {t.symbol} in your server</h2>
          <p className="mt-2 text-sm text-muted-foreground">Add ChartIt free — no account, no API key.</p>
          <div className="mt-5 flex justify-center">
            <InviteButton />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function InviteButton() {
  const className =
    "inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-display font-bold text-primary-foreground transition-all hover:brightness-110";
  if (CHARTIT_INVITE_EXTERNAL) {
    return (
      <a href={CHARTIT_INVITE} target="_blank" rel="noreferrer" className={className}>
        Add ChartIt to Discord <ArrowUpRight className="size-4" />
      </a>
    );
  }
  return (
    <Link href={CHARTIT_INVITE} className={className}>
      Add ChartIt to Discord <ArrowRight className="size-4" />
    </Link>
  );
}

function PreviewCard({ icon: Icon, cmd, label }: { icon: typeof LineChart; cmd: string; label: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <Icon className="size-5 text-primary" />
      <code className="mt-3 block overflow-x-auto font-mono text-sm text-foreground">{cmd}</code>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
