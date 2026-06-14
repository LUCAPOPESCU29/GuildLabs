import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd } from "@/lib/seo-data/jsonld";
import { JsonLd } from "@/components/json-ld";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { EmbedBuilder } from "./_embed-builder";

export const metadata: Metadata = buildMetadata({
  title: "Discord Embed Builder — visual embed designer & JSON generator",
  description:
    "Free visual Discord embed builder. Design rich embeds with a live preview, then copy the JSON or send a test straight to a webhook. Titles, fields, colors, images, footers — no code.",
  path: "/tools/embed-builder",
});

export default function EmbedBuilderPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Tools", path: "/tools" },
          { name: "Embed Builder", path: "/tools/embed-builder" },
        ])}
      />
      <SiteHeader />
      <EmbedBuilder />
      <SiteFooter />
    </>
  );
}
