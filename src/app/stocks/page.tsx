import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LineChart } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd, itemListLd } from "@/lib/seo-data/jsonld";
import { JsonLd } from "@/components/json-ld";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { TICKERS, ASSET_LABELS, tickerSlug, type AssetClass } from "@/lib/seo-data/tickers";
import { TickerSearch } from "@/components/ticker-search";

export const metadata: Metadata = buildMetadata({
  title: "Live charts for Discord — stocks, crypto & ETFs",
  description:
    "Browse live charts you can post in Discord with ChartIt — stocks, crypto, ETFs, and indices. Pick a ticker to see its chart and add the bot to your server.",
  path: "/stocks",
});

const ORDER: AssetClass[] = ["stock", "crypto", "etf", "index"];

export default function StocksHub() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Stocks", path: "/stocks" },
          ]),
          itemListLd(TICKERS.map((t) => ({ name: `${t.symbol} chart`, path: `/stocks/${tickerSlug(t.symbol)}` }))),
        ]}
      />
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-20">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <LineChart className="size-4 text-primary" />
          <span>Live charts for Discord</span>
        </div>
        <h1 className="mt-4 font-display text-5xl font-black tracking-tight sm:text-6xl">
          Charts you can post in <span className="text-primary">Discord</span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          Pick a ticker to see its live chart and add ChartIt to your server — stocks, crypto, ETFs, and indices,
          all free and key-free.
        </p>
        <div className="mt-8 max-w-xl">
          <TickerSearch />
        </div>

        {ORDER.map((cls) => {
          const items = TICKERS.filter((t) => t.assetClass === cls);
          if (items.length === 0) return null;
          return (
            <section key={cls} className="mt-14">
              <h2 className="font-display text-2xl font-black tracking-tight">{ASSET_LABELS[cls]}</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((t) => (
                  <Link
                    key={t.symbol}
                    href={`/stocks/${tickerSlug(t.symbol)}`}
                    className="group glass flex items-center justify-between rounded-2xl px-5 py-4 transition-all hover:-translate-y-0.5"
                  >
                    <div className="min-w-0">
                      <div className="font-display font-bold">{t.symbol}</div>
                      <div className="truncate text-sm text-muted-foreground">{t.name}</div>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
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
