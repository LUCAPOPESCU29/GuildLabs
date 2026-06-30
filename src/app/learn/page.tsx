import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd, itemListLd } from "@/lib/seo-data/jsonld";
import { JsonLd } from "@/components/json-ld";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { COURSES } from "@/lib/learn/curriculum";
import { Learn } from "./_learn";

export const metadata: Metadata = buildMetadata({
  title: "Learn to build a Discord bot — free beginner course",
  description:
    "Build your first Discord bot from zero in about 15 minutes. A free, copy-paste beginner course in JavaScript (discord.js): set up, a bot that logs in, slash commands, rich embeds, and events.",
  path: "/learn",
});

export default function LearnPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Learn", path: "/learn" },
          ]),
          itemListLd(COURSES.map((c) => ({ name: c.name, path: `/learn/course/${c.slug}` }))),
        ]}
      />
      <SiteHeader />
      <Learn />
      <SiteFooter />
    </>
  );
}
