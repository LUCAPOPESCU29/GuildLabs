/**
 * Typed JSON-LD builders. Pages compose these and render them through the
 * <JsonLd> component so structured data is consistent and never hand-written.
 * Keep output honest — only emit schema for content that actually exists.
 */
import { SITE_URL, SITE_NAME } from "@/lib/seo";

type Faq = { q: string; a: string };
type Crumb = { name: string; path: string };

export function faqPageLd(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function breadcrumbLd(items: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path}`,
    })),
  };
}

export function articleLd({
  title,
  description,
  path,
  date,
  updated,
  author = SITE_NAME,
  image,
}: {
  title: string;
  description: string;
  path: string;
  date: string;
  updated?: string;
  author?: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    datePublished: date,
    dateModified: updated ?? date,
    author: { "@type": "Organization", name: author },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    mainEntityOfPage: `${SITE_URL}${path}`,
    ...(image ? { image: image.startsWith("http") ? image : `${SITE_URL}${image}` } : {}),
  };
}

export function softwareAppLd({
  name,
  description,
  path,
  category = "BusinessApplication",
}: {
  name: string;
  description: string;
  path: string;
  category?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    applicationCategory: category,
    operatingSystem: "Discord",
    url: `${SITE_URL}${path}`,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };
}

export function itemListLd(items: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      url: `${SITE_URL}${it.path}`,
    })),
  };
}
