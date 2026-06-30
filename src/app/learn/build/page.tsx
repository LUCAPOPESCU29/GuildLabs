import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd } from "@/lib/seo-data/jsonld";
import { JsonLd } from "@/components/json-ld";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { BuildWorkshops } from "./_build";

export const metadata: Metadata = buildMetadata({
  title: "Build a Discord bot, your way — interactive workshop",
  description:
    "Choose what your Discord bot does and watch the discord.js code and a live terminal build it. A simple one-command bot and a medium multi-feature bot — interactive, free, no setup.",
  path: "/learn/build",
});

export default function LearnBuildPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Learn", path: "/learn" },
          { name: "Build", path: "/learn/build" },
        ])}
      />
      <SiteHeader />
      <BuildWorkshops />
      <SiteFooter />
    </>
  );
}
