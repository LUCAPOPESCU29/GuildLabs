import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd, softwareAppLd } from "@/lib/seo-data/jsonld";
import { JsonLd } from "@/components/json-ld";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { StatusBoard } from "./_status";

export const metadata: Metadata = buildMetadata({
  title: "Status — GuildLabs bots",
  description:
    "GuildLabs bots are open-source and self-hosted — you run them yourself. This shows whether the connected bot instance is currently reachable.",
  path: "/status",
});

export default function StatusPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Status", path: "/status" },
          ]),
          softwareAppLd({ name: "GuildLabs", description: "Discord bots and server tools.", path: "/status" }),
        ]}
      />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-20">
        <h1 className="font-display text-5xl font-black tracking-tight sm:text-6xl">Status</h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground">
          GuildLabs bots are open-source and self-hosted — you run them yourself. This shows
          whether the connected bot instance is reachable right now.{" "}
          <Link href="/guides/how-to-self-host-guildlabs-bots" className="font-semibold text-primary hover:underline">
            New here? Self-host one in ten minutes →
          </Link>
        </p>
        <div className="mt-12">
          <StatusBoard />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
