import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: { absolute: "About GuildLabs — Free, Open-Source Discord Tools" },
  description:
    "GuildLabs is a one-person studio making free, open-source Discord bots that each do one thing well — no subscriptions, no upsells. Here's why.",
};

const PRINCIPLES = [
  {
    title: "One thing, exceptionally.",
    body: "Every bot solves a single named problem better than the alternative. We say no to the rest.",
  },
  {
    title: "Free until it can't be.",
    body: "Hosted versions stay free as long as we can afford to keep them so.",
  },
  {
    title: "Open and inspectable.",
    body: "The source is on GitHub. If you don't trust it, read it.",
  },
];

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24">
      <Link
        href="/"
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Home
      </Link>

      <h1 className="mt-8 font-display text-5xl font-black leading-[0.95] tracking-tight">
        Built by one person who got tired of the bot tax.
      </h1>

      <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
        GuildLabs is one person making free, open-source tools for Discord
        communities. No venture money, no upsells, no twenty-feature bots that do
        none of them well.
      </p>

      <h2 className="mt-16 font-display text-3xl font-black tracking-tight">
        Why this exists.
      </h2>
      <div className="mt-6 space-y-6 leading-relaxed text-muted-foreground">
        <p>
          Every Discord tool worth using eventually asks for a card. The good
          moderation features, the welcome images, the leveling — all behind a tier.
          Meanwhile setting up a server still means learning permission overwrites by
          trial and error.
        </p>
        <p>
          GuildLabs is the opposite bet: tools that solve one problem properly, are
          free to use, and are open enough that you can read the code before you trust
          them. Construct sets up your server. Maven remembers your community&apos;s
          answers. ChartIt brings charts in. Each does its job and gets out of the way.
        </p>
      </div>

      <h2 className="mt-16 font-display text-3xl font-black tracking-tight">
        How we choose what to build.
      </h2>
      <div className="mt-6 space-y-4">
        {PRINCIPLES.map((p) => (
          <div
            key={p.title}
            className="rounded-3xl border border-card-border bg-card p-6"
          >
            <h3 className="font-display text-xl font-black">{p.title}</h3>
            <p className="mt-2 text-muted-foreground">{p.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-16">
        <p className="text-lg text-muted-foreground">
          The fastest way to see what we mean is to build something.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/#builder">
            <Button size="lg">Build a server — free</Button>
          </Link>
          <Link href="/bots">
            <Button size="lg" variant="outline">
              Browse the bots
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
