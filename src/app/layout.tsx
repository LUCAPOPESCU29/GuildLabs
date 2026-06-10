import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Gabarito, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const body = Hanken_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const display = Gabarito({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.guildlabs.fun"),
  title: {
    default: "GuildLabs — Discord tools, done right",
    template: "%s | GuildLabs",
  },
  description:
    "GuildLabs builds free Discord tools — ChartIt for live stock & crypto charts, Construct for instant server setup, and more. No subscription, no API keys.",
  keywords: [
    "Discord bots",
    "Discord stock chart bot",
    "Discord crypto bot",
    "Discord server builder",
    "Discord server setup",
    "GuildLabs",
    "ChartIt",
  ],
  // OG/Twitter images are supplied per-route by opengraph-image.tsx (and the
  // root app/opengraph-image.tsx as the default), so they're not set here.
  openGraph: {
    title: "GuildLabs — Discord tools, done right",
    description:
      "Free Discord tools — ChartIt for live charts, Construct for instant server setup, and more. No subscription, no API keys.",
    url: "https://www.guildlabs.fun",
    siteName: "GuildLabs",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GuildLabs — Discord tools, done right",
    description:
      "Free Discord tools — ChartIt for live charts, Construct for instant server setup, and more.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#15131e" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${body.variable} ${display.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "GuildLabs",
              url: "https://www.guildlabs.fun",
              description:
                "AI-powered Discord server builder. Pick what you like — the AI merges your choices into channels, roles and permissions, then exports the blueprint.",
            }),
          }}
        />
          <Providers
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </Providers>
      </body>
    </html>
  );
}
