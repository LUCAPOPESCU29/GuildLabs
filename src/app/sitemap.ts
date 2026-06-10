import type { MetadataRoute } from "next";
import { TEMPLATES } from "@/lib/seo-data/templates";
import { COMPARISONS } from "@/lib/seo-data/comparisons";
import { BOT_CATEGORIES } from "@/lib/seo-data/bot-categories";
import { DOCS } from "@/lib/seo-data/docs";
import { GUIDES } from "@/lib/seo-data/guides";
import { TICKERS, tickerSlug } from "@/lib/seo-data/tickers";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.guildlabs.fun";
  const now = new Date();

  return [
    // Core pages
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/bots`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/bots/construct`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/bots/maven`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/bots/chartit`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },

    // Hubs
    { url: `${base}/templates`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/vs`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/docs`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/guides`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/stocks`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/changelog`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/status`, lastModified: now, changeFrequency: "daily", priority: 0.4 },
    { url: `${base}/wall`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },

    // Templates
    ...TEMPLATES.map((t) => ({
      url: `${base}/templates/${t.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),

    // Comparisons
    ...COMPARISONS.map((c) => ({
      url: `${base}/vs/${c.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),

    // Bot categories
    ...BOT_CATEGORIES.map((c) => ({
      url: `${base}/bots/${c.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),

    // Docs (per bot)
    ...DOCS.map((d) => ({
      url: `${base}/docs/${d.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),

    // Guides
    ...GUIDES.map((g) => ({
      url: `${base}/guides/${g.slug}`,
      lastModified: new Date(g.updated ?? g.date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),

    // Ticker landing pages
    ...TICKERS.map((t) => ({
      url: `${base}/stocks/${tickerSlug(t.symbol)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
