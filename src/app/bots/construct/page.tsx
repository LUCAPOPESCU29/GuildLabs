import type { Metadata } from "next";
import ConstructClient from "./_construct-client";

export const metadata: Metadata = {
  title: "Construct — Deploy a Whole Discord Server From One Blueprint",
  description:
    "Construct turns a JSON blueprint into a fully built Discord server in seconds — roles, categories, channels, and permissions, set up correctly the first time. Free and open source.",
  keywords: [
    "Construct Discord bot",
    "Discord server setup bot",
    "Discord blueprint deploy",
    "Discord server template bot",
    "Discord bot open source",
  ],
  openGraph: {
    title: "Construct — Deploy a Whole Discord Server From One Blueprint",
    description:
      "Construct turns a JSON blueprint into a fully built Discord server in seconds — roles, categories, channels, and permissions.",
    url: "https://www.guildlabs.fun/bots/construct",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function ConstructPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Construct",
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Discord",
            description:
              "Construct turns a JSON blueprint into a fully built Discord server in seconds — roles, categories, channels, and permissions, set up correctly the first time.",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            url: "https://www.guildlabs.fun/bots/construct",
            author: {
              "@type": "Organization",
              name: "GuildLabs",
              url: "https://www.guildlabs.fun",
            },
          }),
        }}
      />
      <ConstructClient />
    </>
  );
}
