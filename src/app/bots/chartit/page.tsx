import type { Metadata } from "next";
import ChartItClient from "./_chartit-client";

export const metadata: Metadata = {
  title: "ChartIt — Live Stock & Crypto Charts in Discord",
  description:
    "ChartIt posts live stock, crypto, and index charts straight into Discord. One slash command pulls a Yahoo Finance quote and renders the chart — plus scheduled watchlists and price alerts. Free and open source.",
  keywords: [
    "ChartIt Discord bot",
    "Discord stock bot",
    "Discord crypto chart bot",
    "Discord price alert bot",
    "stock chart Discord",
    "Discord bot open source",
  ],
  openGraph: {
    title: "ChartIt — Live Stock & Crypto Charts in Discord",
    description:
      "ChartIt posts live stock, crypto, and index charts straight into Discord. One slash command, plus scheduled watchlists and price alerts.",
    url: "https://www.guildlabs.fun/bots/chartit",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function ChartItPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "ChartIt",
            applicationCategory: "FinanceApplication",
            operatingSystem: "Discord",
            description:
              "ChartIt posts live stock, crypto, and index charts into Discord from a single slash command, with scheduled watchlists and price alerts. Market data via Yahoo Finance — informational only, not financial advice.",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            url: "https://www.guildlabs.fun/bots/chartit",
            author: {
              "@type": "Organization",
              name: "GuildLabs",
              url: "https://www.guildlabs.fun",
            },
          }),
        }}
      />
      <ChartItClient />
    </>
  );
}
