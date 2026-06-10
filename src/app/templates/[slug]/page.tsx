import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TEMPLATES, getTemplate } from "@/lib/seo-data/templates";
import { TemplateDetailContent } from "./_content";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return TEMPLATES.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = getTemplate(slug);
  if (!t) return {};
  return {
    title: `Discord ${t.name} Template — Channels, Roles & Setup`,
    description: `Set up your ${t.name.toLowerCase()} Discord server in minutes. Free template with ${t.stats.avgChannels} channels, ${t.stats.avgRoles} roles, and the right bots — deploy with GuildLabs.`,
    openGraph: {
      title: `Discord ${t.name} Template`,
      description: t.description,
      url: `https://www.guildlabs.fun/templates/${t.slug}`,
    },
  };
}

export default async function TemplatePage({ params }: Props) {
  const { slug } = await params;
  const t = getTemplate(slug);
  if (!t) notFound();

  const schema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to set up a Discord ${t.name.toLowerCase()}`,
    description: t.description,
    tool: { "@type": "SoftwareApplication", name: "GuildLabs", url: "https://www.guildlabs.fun" },
    step: [
      { "@type": "HowToStep", name: "Go to GuildLabs", text: "Visit guildlabs.fun and click 'Start building'." },
      { "@type": "HowToStep", name: `Choose ${t.name}`, text: `Select '${t.name}' as your server type.` },
      { "@type": "HowToStep", name: "Customise channels and roles", text: "Review the suggested channels and roles. Add or remove as needed." },
      { "@type": "HowToStep", name: "Deploy your blueprint", text: "Click deploy to create your server structure in seconds." },
    ],
    estimatedCost: { "@type": "MonetaryAmount", currency: "USD", value: "0" },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: t.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.guildlabs.fun" },
      { "@type": "ListItem", position: 2, name: "Templates", item: "https://www.guildlabs.fun/templates" },
      { "@type": "ListItem", position: 3, name: `${t.name} Template`, item: `https://www.guildlabs.fun/templates/${t.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <TemplateDetailContent t={t} />
    </>
  );
}
