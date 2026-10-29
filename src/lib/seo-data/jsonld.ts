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

/** Maps a human hours string like "4–6 hrs" to an ISO-8601 duration (uses the
 * upper bound, e.g. "PT6H"). Falls back to PT1H if no number is found. */
function hoursToIso(hours: string): string {
  const nums = hours.match(/\d+/g);
  const h = nums && nums.length ? Number(nums[nums.length - 1]) : 1;
  return `PT${h}H`;
}

export function courseLd({
  name,
  description,
  path,
  level,
  hours,
  topics,
}: {
  name: string;
  description: string;
  path: string;
  level: string;
  hours: string;
  topics?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name,
    description,
    url: `${SITE_URL}${path}`,
    educationalLevel: level,
    timeRequired: hoursToIso(hours),
    isAccessibleForFree: true,
    inLanguage: "en",
    ...(topics && topics.length ? { about: topics } : {}),
    provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD", category: "Free" },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: hoursToIso(hours),
    },
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
