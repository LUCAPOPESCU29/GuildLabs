import type { Metadata } from "next";
import MavenClient from "./_maven-client";

export const metadata: Metadata = {
  title: { absolute: "Maven — Local-First Q&A Bot for Discord (Free, Open Source)" },
  description:
    "Maven surfaces past answers when a question's been asked before. Runs on a local embedding model — no API key, no per-message cost, nothing leaves your server.",
  keywords: [
    "Maven Discord bot",
    "Discord Q&A bot",
    "Discord knowledge base bot",
    "local Discord bot",
    "Discord bot open source",
  ],
  openGraph: {
    title: "Maven — Local-First Q&A Bot for Discord (Free, Open Source)",
    description:
      "Maven surfaces past answers when a question's been asked before. Runs on a local embedding model — no API key, no per-message cost, nothing leaves your server.",
    url: "https://www.guildlabs.fun/bots/maven",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function MavenPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Maven",
            applicationCategory: "ChatApplication",
            operatingSystem: "Discord",
            description:
              "Maven indexes every question asked in your Discord server. When someone asks again, it links them straight to the past answer.",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            url: "https://www.guildlabs.fun/bots/maven",
            author: {
              "@type": "Organization",
              name: "GuildLabs",
              url: "https://www.guildlabs.fun",
            },
          }),
        }}
      />
      <MavenClient />
    </>
  );
}
