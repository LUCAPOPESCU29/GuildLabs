import type { Metadata } from "next";
import Link from "next/link";
import { Code2, Sparkles, ArrowRight } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd, itemListLd } from "@/lib/seo-data/jsonld";
import { JsonLd } from "@/components/json-ld";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

export const metadata: Metadata = buildMetadata({
  title: "Free Discord tools — embed builder, server quiz & more",
  description:
    "A growing set of free, no-signup Discord tools from GuildLabs: a visual embed builder with live preview and webhook testing, and a quiz that matches you to a server template.",
  path: "/tools",
});

const TOOLS = [
  {
    href: "/tools/embed-builder",
    icon: Code2,
    title: "Embed Builder",
    desc: "Design rich Discord embeds visually with a live preview, then copy the JSON or send a test straight to a webhook.",
    tag: "Builder",
  },
  {
    href: "/quiz",
    icon: Sparkles,
    title: "Server Quiz",
    desc: "Answer four quick questions and get matched to the perfect server template — then build it instantly.",
    tag: "Quiz",
  },
];

export default function ToolsHub() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Tools", path: "/tools" },
          ]),
          itemListLd(TOOLS.map((t) => ({ name: t.title, path: t.href }))),
        ]}
      />
      <SiteHeader />
      <main className="relative min-h-screen px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-primary">
              <Sparkles className="size-3.5" /> Free · no signup
            </span>
            <h1 className="mt-4 font-display text-4xl font-black tracking-tight sm:text-5xl">Free Discord tools</h1>
            <p className="mx-auto mt-3 max-w-xl text-lg text-muted-foreground">
              Handy little tools for building better Discord servers. No account, no catch.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {TOOLS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="glass group flex flex-col rounded-3xl p-6 transition-all hover:-translate-y-1 hover:bg-primary/5"
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary">
                    <t.icon className="size-6" />
                  </span>
                  <span className="rounded-full bg-muted/60 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground">
                    {t.tag}
                  </span>
                </div>
                <h2 className="mt-5 font-display text-2xl font-black">{t.title}</h2>
                <p className="mt-2 flex-1 text-muted-foreground">{t.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 font-display font-bold text-primary">
                  Open <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
