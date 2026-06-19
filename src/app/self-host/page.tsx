import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd } from "@/lib/seo-data/jsonld";
import { JsonLd } from "@/components/json-ld";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { SelfHost } from "./_self-host";

export const metadata: Metadata = buildMetadata({
  title: "Self-host the GuildLabs bot — download & run it yourself",
  description:
    "Download the open-source GuildLabs Discord bot and run it on your own machine in about ten minutes. Free, private, no GitHub account needed — your community's data never leaves your computer.",
  path: "/self-host",
});

export default function SelfHostPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Self-host", path: "/self-host" },
        ])}
      />
      <SiteHeader />
      <SelfHost />
      <SiteFooter />
    </>
  );
}
