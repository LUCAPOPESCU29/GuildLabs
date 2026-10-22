import type { Metadata } from "next";
import BeaconClient from "./_beacon-client";

export const metadata: Metadata = {
  title: "Beacon — Get Your Discord Server Found, Ranked by Real Activity",
  description:
    "Beacon gives any Discord server a live public page and a place in a directory ranked by real activity — online members, growth, and events — never bumps. Free, open source, and self-hostable.",
  keywords: [
    "Beacon Discord bot",
    "Discord server directory",
    "Discord server listing bot",
    "Disboard alternative",
    "grow Discord server",
    "Discord bot open source self-host",
  ],
  openGraph: {
    title: "Beacon — Get Your Discord Server Found, Ranked by Real Activity",
    description:
      "A live public page for your Discord server and a directory ranked by real activity — never bumps. Free, open source, self-hostable.",
    url: "https://www.guildlabs.fun/bots/beacon",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function BeaconPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Beacon",
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Discord",
            description:
              "Beacon gives any Discord server a live public page and a place in a directory ranked by real activity — online members, growth, and events — never bumps.",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            url: "https://www.guildlabs.fun/bots/beacon",
            author: {
              "@type": "Organization",
              name: "GuildLabs",
              url: "https://www.guildlabs.fun",
            },
          }),
        }}
      />
      <BeaconClient />
    </>
  );
}
