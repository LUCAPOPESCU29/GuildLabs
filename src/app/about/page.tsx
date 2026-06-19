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
    body: "Every bot solves a single named problem better than the alternative. Construct builds servers. Maven remembers answers. ChartIt posts charts. None of them will grow a music player.",
  },
  {
    title: "Free means free.",
    body: "No premium tier, no feature gates, no \"upgrade to unlock.\" It's free because you run it yourself — open-source, on your own machine, with no server bills for anyone to pass on to you. The code is yours; nothing can be taken away later.",
  },
  {
    title: "Open and inspectable.",
    body: "Every bot is MIT-licensed on GitHub. If you don't trust what a bot does with Administrator, read the source. If you'd rather not trust anyone, self-host it.",
  },
  {
    title: "No bot where no bot will do.",
    body: "If Discord ships a feature natively, GuildLabs won't clone it. Fewer bots in your server is a feature.",
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
        Built by one person who got tired of the{" "}
        <span className="hl-coral">bot tax</span>.
      </h1>

      <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
        GuildLabs is one person making free, open-source tools for Discord
        communities. No team page with stock photos, no venture money, no
        twenty-feature bots that do none of them well. Just a small studio of
        tools that each do one job properly.
      </p>

      <h2 className="mt-16 font-display text-3xl font-black tracking-tight">
        Why this exists.
      </h2>
      <div className="mt-6 space-y-6 leading-relaxed text-muted-foreground">
        <p>
          Setting up a Discord server is unpaid work that everyone pretends is
          easy. It isn&apos;t. It&apos;s an evening of creating channels one at a
          time, learning permission overwrites by breaking them, and googling why
          the verify role doesn&apos;t do anything. I&apos;ve done that evening
          more times than I want to admit.
        </p>
        <p>
          And then there&apos;s the bot tax. Every popular Discord bot eventually
          asks for a card: welcome images behind a tier, leveling behind a tier,
          one more reaction role behind a tier. Features that cost almost nothing
          to run get priced like they&apos;re hard, because the people paying are
          volunteers who just want their community to work.
        </p>
        <p>
          GuildLabs is the opposite bet. Describe your server in a sentence and
          Construct builds it — roles, channels, permissions done right the first
          time — then runs the essentials other bots paywall. Maven remembers
          your community&apos;s answers so your helpers don&apos;t burn out.
          ChartIt brings live charts in so nobody has to screenshot a website.
          Each one free, each one open-source, each one doing its job and getting
          out of the way.
        </p>
      </div>

      <h2 className="mt-16 font-display text-3xl font-black tracking-tight">
        How &quot;free forever&quot; survives contact with reality.
      </h2>
      <div className="mt-6 space-y-6 leading-relaxed text-muted-foreground">
        <p>
          Fair question — &quot;free&quot; usually means &quot;free until the
          acquisition.&quot; Here&apos;s the honest answer: these tools are built
          to be cheap to run. Maven uses a local model instead of a metered API,
          ChartIt uses keyless data sources, and Construct does its expensive
          work once, at deploy time. There&apos;s no per-message bill quietly
          growing in the background, which means there&apos;s no point where the
          math forces a paywall.
        </p>
        <p>
          And if I&apos;m ever wrong about that, the escape hatch is already
          built: everything is MIT-licensed. You can self-host any bot today, and
          nothing I do later can take that away. That&apos;s the real guarantee —
          not a promise, a license.
        </p>
      </div>

      <h2 className="mt-16 font-display text-3xl font-black tracking-tight">
        The studio model.
      </h2>
      <div className="mt-6 space-y-6 leading-relaxed text-muted-foreground">
        <p>
          GuildLabs isn&apos;t one mega-bot, on purpose. Big all-in-one bots rot
          from the middle: every feature is somebody&apos;s afterthought, and you
          end up granting enormous permissions to twenty features to use two.
          Small tools stay sharp. You invite exactly what you need, each bot asks
          only for what its job requires, and when one of them isn&apos;t for
          you, removing it costs nothing.
        </p>
      </div>
      <div className="mt-8 space-y-4">
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

      <h2 className="mt-16 font-display text-3xl font-black tracking-tight">
        What&apos;s next.
      </h2>
      <div className="mt-6 space-y-6 leading-relaxed text-muted-foreground">
        <p>
          Near-term: deeper docs and tutorials for every bot, more server
          templates, and continuing to sand down the AI builder until describing
          a server feels like magic every time, not most times. Longer-term: more
          small tools — but only when a problem clears the bar of &quot;one
          thing, exceptionally.&quot; The recent additions, like the playground
          where you can try every bot without inviting anything, all come from
          the same place: removing reasons to not just try it.
        </p>
        <p>
          If something&apos;s broken, confusing, or missing, the changelog shows
          how fast things move — and the GitHub issues are read by the same
          person who writes the code. That&apos;s the one upside of a team of
          one: nothing gets lost in a handoff.
        </p>
      </div>

      <div className="mt-16">
        <p className="text-lg text-muted-foreground">
          The fastest way to see what all of this means is to build something.
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
