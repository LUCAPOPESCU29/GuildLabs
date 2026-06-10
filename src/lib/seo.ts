import type { Metadata } from "next";

/**
 * Single source of truth for page metadata. Every route builds its Metadata
 * through here so canonical URLs, OpenGraph, and Twitter cards stay consistent
 * with the brand. `metadataBase` is set once in app/layout.tsx, so `path` here
 * is a site-relative path (e.g. "/docs/chartit").
 *
 * Omit `ogImage` to let a route's own `opengraph-image.tsx` supply a dynamic,
 * page-specific unfurl card (preferred). Pass `ogImage` only to point at a
 * specific static asset.
 */
export const SITE_URL = "https://www.guildlabs.fun";
export const SITE_NAME = "GuildLabs";

export function buildMetadata({
  title,
  description,
  path = "/",
  ogImage,
  type = "website",
  noindex = false,
}: {
  title: string;
  description: string;
  path?: string;
  ogImage?: string;
  type?: "website" | "article";
  noindex?: boolean;
}): Metadata {
  const url = path.startsWith("http") ? path : `${SITE_URL}${path}`;
  const images = ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined;

  return {
    title,
    description,
    alternates: { canonical: path.startsWith("http") ? path : path },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    robots: noindex ? { index: false, follow: true } : { index: true, follow: true },
  };
}
