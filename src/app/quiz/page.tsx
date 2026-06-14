import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd } from "@/lib/seo-data/jsonld";
import { JsonLd } from "@/components/json-ld";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Quiz } from "./_quiz";

export const metadata: Metadata = buildMetadata({
  title: "What Discord server should you build? — 30-second quiz",
  description:
    "Take a quick quiz and get matched to the perfect Discord server template — gaming, crypto, study, art, startup and more. Then build it instantly with the GuildLabs AI builder.",
  path: "/quiz",
});

export default function QuizPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Quiz", path: "/quiz" },
        ])}
      />
      <SiteHeader />
      <Quiz />
      <SiteFooter />
    </>
  );
}
