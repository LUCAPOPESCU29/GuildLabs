"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  Hammer,
  BookOpen,
  Users,
  Music,
  Activity,
  Sparkles,
  Radio,
  Archive,
  Mail,
  CandlestickChart,
} from "lucide-react";
import { GuildLabsLogo } from "@/components/logo";
import { BOT_CATEGORIES } from "@/lib/seo-data/bot-categories";

// ──────────────────────────────────────────────────────────────────────────────
// CATALOG DATA — every bot, live or planned
// ──────────────────────────────────────────────────────────────────────────────

type Status = "live" | "beta" | "concept";
type Category = "Setup" | "Memory" | "Markets" | "Community" | "Engagement" | "Music" | "Moderation";

type BotEntry = {
  no: string;             // catalog number, e.g. "01"
  slug: string;
  name: string;
  tagline: string;        // one verb, like "Build it."
  description: string;
  status: Status;
  category: Category;
  href?: string;
  Visual: React.ComponentType;
};

const BOTS: BotEntry[] = [
  {
    no: "01",
    slug: "construct",
    name: "Construct",
    tagline: "Build it.",
    description:
      "Turn a JSON blueprint into a fully-deployed Discord server in seconds. Roles, categories, channels, permissions — set up correctly the first time.",
    status: "live",
    category: "Setup",
    href: "/bots/construct",
    Visual: ConstructVisual,
  },
  {
    no: "02",
    slug: "maven",
    name: "Maven",
    tagline: "Remember it.",
    description:
      "Surfaces past answers when a question's been asked before. Communities accumulate wisdom; Maven keeps it findable.",
    status: "live",
    category: "Memory",
    href: "/bots/maven",
    Visual: MavenVisual,
  },
  {
    no: "03",
    slug: "chartit",
    name: "ChartIt",
    tagline: "Chart it.",
    description:
      "Live stock, crypto, and index charts straight into Discord. One slash command pulls a Yahoo Finance quote and renders the chart — plus scheduled watchlists and price alerts.",
    status: "live",
    category: "Markets",
    href: "/bots/chartit",
    Visual: ChartItVisual,
  },
  {
    no: "04",
    slug: "salon",
    name: "Salon",
    tagline: "Meet someone.",
    description:
      "Random 1:1 pairings for opted-in members. Cures the big-server-feels-lonely problem with weekly Friday matches.",
    status: "concept",
    category: "Community",
    Visual: SalonVisual,
  },
  {
    no: "05",
    slug: "aurora",
    name: "Aurora",
    tagline: "Set the mood.",
    description:
      "Music bot that reads the room. Mood-aware playlists, AI DJ mode, beautiful covers — sounds like the best mixtape your server's ever had.",
    status: "concept",
    category: "Music",
    Visual: AuroraVisual,
  },
  {
    no: "06",
    slug: "pulse",
    name: "Pulse",
    tagline: "Know your community.",
    description:
      "Server analytics done well. Growth patterns, activity heatmaps, top contributors, weekly digests. The numbers without the noise.",
    status: "concept",
    category: "Community",
    Visual: PulseVisual,
  },
  {
    no: "07",
    slug: "echo",
    name: "Echo",
    tagline: "A teammate that never sleeps.",
    description:
      "AI member with a personality you tune. Trained on your docs and server lore — handles repeat questions while you sleep.",
    status: "concept",
    category: "Engagement",
    Visual: EchoVisual,
  },
  {
    no: "08",
    slug: "beacon",
    name: "Beacon",
    tagline: "Your creator's HQ.",
    description:
      "Stream alerts, clip archiver, sub-tier role sync. Twitch / YouTube / Kick in one bot. Built for the people whose community follows them across platforms.",
    status: "concept",
    category: "Engagement",
    Visual: BeaconVisual,
  },
  {
    no: "09",
    slug: "vault",
    name: "Vault",
    tagline: "Vote on what's next.",
    description:
      "Suggestion box with structured voting and shipped/planned tracking — like Canny, but native to Discord. Let your community shape the roadmap.",
    status: "concept",
    category: "Community",
    Visual: VaultVisual,
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────────────────────────────────

type Filter = "all" | "live" | "beta" | "concept";

export function BotsExplorer() {
  const [filter, setFilter] = React.useState<Filter>("all");
  const reduce = useReducedMotion();

  const counts = React.useMemo(() => ({
    all: BOTS.length,
    live: BOTS.filter((b) => b.status === "live").length,
    beta: BOTS.filter((b) => b.status === "beta").length,
    concept: BOTS.filter((b) => b.status === "concept").length,
  }), []);

  const visible = filter === "all" ? BOTS : BOTS.filter((b) => b.status === filter);
  const liveAndBeta = visible.filter((b) => b.status !== "concept");
  const concepts = visible.filter((b) => b.status === "concept");

  return (
    <main className="min-h-screen bg-background text-foreground">
      <CatalogHeader />

      <CatalogHero counts={counts} />

      {/* Filter strip — sticky so you can re-filter while scrolling */}
      <div className="sticky top-0 z-30 -mt-px border-b border-card-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <FilterChip label="All" count={counts.all} active={filter === "all"} onClick={() => setFilter("all")} />
            <FilterChip label="Live" count={counts.live} active={filter === "live"} onClick={() => setFilter("live")} dotColor="#1cd47d" />
            <FilterChip label="Beta" count={counts.beta} active={filter === "beta"} onClick={() => setFilter("beta")} dotColor="#c89b3c" />
            <FilterChip label="Concept" count={counts.concept} active={filter === "concept"} onClick={() => setFilter("concept")} dotColor="#9ca3af" />
          </div>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:inline">
            Cataloged · {visible.length} {visible.length === 1 ? "entry" : "entries"}
          </span>
        </div>
      </div>

      {/* Featured entries (live + beta) — asymmetric grid */}
      {liveAndBeta.length > 0 && (
        <section className="px-5 py-12 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {liveAndBeta.map((bot, i) => (
                <motion.div
                  key={bot.slug}
                  layout
                  initial={reduce ? false : { opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -16 }}
                  transition={reduce ? { duration: 0 } : { duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: i * 0.06 }}
                >
                  <FeatureCard bot={bot} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Manifest strip — only shown when we're actually featuring entries */}
      {filter === "all" && <ManifestStrip />}

      {/* Concept entries — compact horizontal cards */}
      {concepts.length > 0 && (
        <section className="px-5 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-baseline justify-between">
              <h2 className="font-display text-3xl font-black tracking-tight sm:text-4xl">
                {filter === "concept" ? "All concepts" : "In the lab"}
              </h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {concepts.length} planned
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {concepts.map((bot, i) => (
                  <motion.div
                    key={bot.slug}
                    layout
                    initial={reduce ? false : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? undefined : { opacity: 0, y: -12 }}
                    transition={reduce ? { duration: 0 } : { duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: i * 0.04 }}
                  >
                    <ConceptCard bot={bot} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </section>
      )}

      {/* Bot guides — curated "best bots by category" reference pages */}
      <BotGuides />

      {/* Footer CTA: idea submission */}
      <FooterCTA />
    </main>
  );
}

// ── BOT GUIDES (curated category reference pages) ───────────────────────────

function BotGuides() {
  return (
    <section className="border-t border-card-border px-5 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-baseline justify-between">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Reference
            </span>
            <h2 className="mt-2 font-display text-3xl font-black tracking-tight sm:text-4xl">
              Discord bot guides
            </h2>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
              Honest, free-first guides to the best Discord bots in each category — not just
              ours. Use them to pick the right tools, then build the server with GuildLabs.
            </p>
          </div>
          <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:inline">
            {BOT_CATEGORIES.length} guides
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {BOT_CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/bots/${c.slug}`}
              className="group flex h-full flex-col rounded-2xl border border-card-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-foreground/15"
            >
              <div className="flex items-center justify-between">
                <span aria-hidden className="text-2xl">{c.emoji}</span>
                <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
              </div>
              <h3 className="mt-4 font-display text-lg font-black tracking-tight">
                Best {c.name.toLowerCase()} bots
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground line-clamp-3">
                {c.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// PIECES
// ──────────────────────────────────────────────────────────────────────────────

function CatalogHeader() {
  return (
    <header className="border-b border-card-border px-5 py-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" aria-label="GuildLabs home" className="inline-flex items-center gap-3">
          <GuildLabsLogo className="h-9 w-auto" />
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:inline">
            / The Catalog
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/templates"
            className="font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground hidden sm:inline"
          >
            Templates
          </Link>
          <Link
            href="/vs"
            className="font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground hidden sm:inline"
          >
            Comparisons
          </Link>
          <Link
            href="/"
            className="font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Home
          </Link>
        </div>
      </div>
    </header>
  );
}

function CatalogHero({ counts }: { counts: Record<Filter, number> }) {
  return (
    <section className="relative overflow-hidden px-5 pb-10 pt-20 sm:pb-16 sm:pt-28">
      {/* Decorative editorial corner mark */}
      <div className="pointer-events-none absolute inset-0">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07] text-foreground"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "120px 120px",
            maskImage: "radial-gradient(ellipse 60% 50% at 20% 30%, black, transparent)",
            WebkitMaskImage: "radial-gradient(ellipse 60% 50% at 20% 30%, black, transparent)",
          }}
        />
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.3fr,0.7fr] lg:items-end">
        {/* Left: editorial text */}
        <div>
          <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            <span>GuildLabs / Catalog</span>
            <span aria-hidden className="text-foreground/20">·</span>
            <span>Edition 2026.01</span>
            <span aria-hidden className="text-foreground/20">·</span>
            <span className="text-foreground/90">
              {counts.live} live · {counts.beta} beta · {counts.concept} in lab
            </span>
          </div>

          <h1 className="mt-7 font-display text-[clamp(2.75rem,8vw,5.5rem)] font-black leading-[0.92] tracking-tight">
            Discord Bots
            <br />
            <span className="text-muted-foreground">by</span>{" "}
            <em className="not-italic text-primary">GuildLabs</em>
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            A small studio making <em className="not-italic">distinct</em> tools for Discord communities.
          </p>

          <p className="mt-7 max-w-xl text-base text-muted-foreground sm:text-lg">
            Each bot is built to do one thing exceptionally — not twenty things adequately. Three
            are live. The rest are still in the lab.
          </p>
        </div>

        {/* Right: editorial "lineup" image — the bots so far */}
        <motion.figure
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="relative"
        >
          <div className="relative overflow-hidden rounded-3xl border border-card-border bg-card/40">
            <img
              src="/bots-family.png"
              alt="GuildLabs bot lineup: Maven, Construct, and ChartIt"
              className="block h-auto w-full"
              loading="eager"
            />
          </div>
          <figcaption className="mt-3 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            <span>Plate I · The bots so far</span>
            <span>Issued 2026</span>
          </figcaption>
        </motion.figure>
      </div>
    </section>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
  dotColor,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  dotColor?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        active
          ? "border-foreground/20 bg-foreground/10 text-foreground"
          : "border-card-border bg-transparent text-muted-foreground hover:border-foreground/15 hover:text-foreground"
      }`}
    >
      {dotColor && (
        <span
          aria-hidden
          className="size-1.5 rounded-full"
          style={{ background: dotColor, boxShadow: active ? `0 0 8px ${dotColor}` : undefined }}
        />
      )}
      {label}
      <span className={`tabular-nums ${active ? "text-foreground" : "text-muted-foreground/60"}`}>
        {count}
      </span>
    </button>
  );
}

// ── FEATURE CARD (live + beta) ──────────────────────────────────────────────

function FeatureCard({ bot }: { bot: BotEntry }) {
  const inner = (
    <article
      className="group relative h-full overflow-hidden rounded-3xl border border-card-border bg-card transition-colors hover:border-foreground/15"
    >
      {/* Top: visual takes a fixed aspect to give cards rhythm */}
      <div className="relative aspect-[16/10] overflow-hidden border-b border-card-border">
        <bot.Visual />
      </div>

      {/* Bottom: meta */}
      <div className="p-6 sm:p-7">
        {/* Catalog-card top row: number + status + category */}
        <div className="flex items-baseline justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <span>
            No.{bot.no} <span aria-hidden className="text-foreground/20"> / </span> {bot.category}
          </span>
          <StatusMark status={bot.status} />
        </div>

        <h3 className="mt-4 font-display text-4xl font-black leading-none tracking-tight sm:text-5xl">
          {bot.name}
        </h3>
        <p className="mt-1.5 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {bot.tagline}
        </p>

        <p className="mt-5 max-w-md text-sm text-foreground/80">{bot.description}</p>

        <div className="mt-6 inline-flex items-center gap-1.5 font-display text-sm font-bold text-foreground/85 group-hover:text-primary">
          {bot.status === "live" ? "Visit" : "Learn more"}
          <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>
    </article>
  );

  return bot.href ? (
    <Link href={bot.href} className="block h-full">
      {inner}
    </Link>
  ) : (
    inner
  );
}

function StatusMark({ status }: { status: Status }) {
  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] text-[#1cd47d]">
        <PulseDot color="#1cd47d" />
        Live
      </span>
    );
  }
  if (status === "beta") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] text-[#c89b3c]">
        <PulseDot color="#c89b3c" />
        Beta
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
      <span aria-hidden className="size-1.5 rounded-full bg-muted-foreground/50" />
      In the lab
    </span>
  );
}

function PulseDot({ color }: { color: string }) {
  return (
    <span className="relative grid size-2 place-items-center">
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: color, opacity: 0.5 }}
        animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
      />
      <span className="absolute inset-0 rounded-full" style={{ backgroundColor: color }} />
    </span>
  );
}

// ── MANIFEST STRIP ──────────────────────────────────────────────────────────

const MANIFEST: { n: string; title: string; body: string }[] = [
  {
    n: "I",
    title: "One thing, exceptionally.",
    body: "Every bot solves one named problem better than any tool we could find. We say no to the rest.",
  },
  {
    n: "II",
    title: "Free until it can't be.",
    body: "Maintenance scales with users, not feature count. Hosted versions stay free as long as we can afford to keep them so.",
  },
  {
    n: "III",
    title: "Open and inspectable.",
    body: "Source is on GitHub. Every embed, log, and stored field is documented. If you don't trust it, you can read it.",
  },
];

function ManifestStrip() {
  return (
    <section className="border-y border-card-border bg-card/40 px-5 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex items-baseline justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            The manifest
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground sm:inline">
            How we choose what to build
          </span>
        </div>

        <div className="grid gap-10 sm:grid-cols-3 sm:gap-6">
          {MANIFEST.map((m, i) => (
            <motion.div
              key={m.n}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: i * 0.08 }}
            >
              <div className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-primary">
                {m.n}.
              </div>
              <h3 className="mt-2 font-display text-2xl font-black leading-tight tracking-tight">
                {m.title}
              </h3>
              <p className="mt-3 text-sm text-muted-foreground">{m.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CONCEPT CARD (coming soon) ─────────────────────────────────────────────

function ConceptCard({ bot }: { bot: BotEntry }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-card-border bg-card/60 p-5 transition-all hover:-translate-y-0.5 hover:border-foreground/15 hover:bg-card">
      {/* Top row: number + status */}
      <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        <span>No.{bot.no} / {bot.category}</span>
        <StatusMark status={bot.status} />
      </div>

      {/* Compact visual strip */}
      <div className="relative my-4 h-20 overflow-hidden rounded-xl border border-card-border bg-background/60">
        <div className="absolute inset-0 opacity-90">
          <bot.Visual />
        </div>
      </div>

      <h3 className="font-display text-2xl font-black tracking-tight">{bot.name}</h3>
      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {bot.tagline}
      </p>
      <p className="mt-3 text-xs text-foreground/75">{bot.description}</p>
    </article>
  );
}

// ── FOOTER CTA ─────────────────────────────────────────────────────────────

function FooterCTA() {
  return (
    <section className="px-5 py-24">
      <div className="mx-auto max-w-3xl text-center">
        <Mail className="mx-auto size-7 text-primary" />
        <h2 className="mt-5 font-display text-3xl font-black tracking-tight sm:text-4xl">
          See an itch we should scratch?
        </h2>
        <p className="mt-3 text-muted-foreground">
          We pick the next bot from problems real communities tell us about. If you've
          got one nobody's solved well, drop a line.
        </p>
        <a
          href="https://github.com/LUCAPOPESCU29/GuildLabs/issues/new"
          target="_blank"
          rel="noreferrer"
          className="mt-7 inline-flex items-center gap-2 rounded-full border border-foreground/20 bg-transparent px-5 py-3 font-display text-sm font-bold transition-colors hover:bg-foreground/[0.04]"
        >
          Open an issue on GitHub
          <ArrowUpRight className="size-4" />
        </a>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// PER-BOT VISUALS — each one is distinct, characterful, animated
// ──────────────────────────────────────────────────────────────────────────────

// 01 — CONSTRUCT: a blueprint with channels populating
function ConstructVisual() {
  return (
    <div className="absolute inset-0 bg-[oklch(0.16_0.05_280)]">
      {/* Blueprint grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(168,177,255,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(168,177,255,0.18) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* "Drawing" of channels */}
      <div className="absolute inset-0 flex flex-col justify-center gap-2 px-7">
        {["# rules", "# announcements", "# general", "# off-topic", "🔊 lounge"].map((label, i) => (
          <motion.div
            key={label}
            className="flex items-center gap-2 rounded-md bg-[#5865F2]/10 px-2.5 py-1 text-xs text-[#a8b1ff]"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: i * 0.15, ease: "easeOut" }}
          >
            <span className="size-1.5 rounded-full bg-[#5865F2]" />
            <span className="font-mono">{label}</span>
          </motion.div>
        ))}
      </div>
      {/* Construct lockup — uses the studio character (same mark inside the C of the official Construct app icon) */}
      <div className="absolute right-4 top-4 flex h-10 items-center gap-2 rounded-md bg-white/[0.04] px-2 backdrop-blur-sm ring-1 ring-white/10">
        <img
          src="/GuildLabs Logo - R2 -transparent- copy.png"
          alt=""
          aria-hidden
          className="h-6 w-auto"
        />
        <span className="font-display text-xs font-bold tracking-wide text-white/90">Construct</span>
      </div>
    </div>
  );
}

// 02 — MAVEN: question being answered with a marginalia-style annotation
function MavenVisual() {
  return (
    <div className="absolute inset-0" style={{ background: "oklch(0.18 0.04 80)" }}>
      {/* Parchment grain */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, #c89b3c 0.5px, transparent 0.5px), radial-gradient(circle at 70% 60%, #c89b3c 0.5px, transparent 0.5px)",
          backgroundSize: "10px 10px, 14px 14px",
        }}
      />
      <div className="absolute inset-0 flex items-center px-7">
        <div className="space-y-3">
          <div className="text-sm text-foreground/90">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#c89b3c]">
              Q · today
            </span>
            <div className="mt-1">"how do I set up auto-roles for new members?"</div>
          </div>
          <motion.div
            className="ml-6 rounded-lg border-l-2 border-[#c89b3c] bg-[#c89b3c]/8 px-3 py-2 text-xs text-foreground/75"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#c89b3c]">
              87% match · asked Apr 12
            </span>
            <div className="mt-1">"where do I configure the auto-role for new joiners?"</div>
          </motion.div>
        </div>
      </div>
      {/* Maven lockup — clean transparent monogram + display wordmark */}
      <div className="absolute right-4 top-4 flex h-10 items-center gap-2 rounded-md bg-white/[0.04] px-2 backdrop-blur-sm ring-1 ring-white/10">
        <img
          src="/maven-mark.png"
          alt=""
          aria-hidden
          className="h-6 w-auto"
        />
        <span className="font-display text-xs font-bold tracking-wide text-white/90">Maven</span>
      </div>
    </div>
  );
}

// 03 — CHARTIT: a green price line drawing itself with a live quote chip
function ChartItVisual() {
  return (
    <div className="absolute inset-0" style={{ background: "oklch(0.16 0.05 160)" }}>
      {/* faint gridlines */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgba(22,199,132,0.10) 1px, transparent 1px)",
          backgroundSize: "100% 20%",
        }}
      />
      <svg className="absolute inset-0 size-full" viewBox="0 0 400 250" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="chartit-visual-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16c784" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#16c784" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d="M0,180 L50,168 L90,186 L130,150 L170,158 L210,120 L250,132 L290,92 L330,104 L370,58 L400,44 L400,250 L0,250 Z"
          fill="url(#chartit-visual-fill)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        />
        <motion.polyline
          fill="none"
          stroke="#16c784"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points="0,180 50,168 90,186 130,150 170,158 210,120 250,132 290,92 330,104 370,58 400,44"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
        />
      </svg>
      {/* live quote chip */}
      <motion.div
        className="absolute bottom-4 left-7 rounded-md bg-[#16c784]/10 px-2.5 py-1 font-mono text-xs text-[#16c784]"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 1 }}
      >
        AAPL ▲ +2.09%
      </motion.div>
      <div className="absolute right-4 top-4 grid size-9 place-items-center rounded-xl bg-[#16c784]/20 text-[#5eecb5]">
        <CandlestickChart className="size-4" />
      </div>
    </div>
  );
}

// 04 — SALON: two members meeting across a connecting line
function SalonVisual() {
  return (
    <div className="absolute inset-0" style={{ background: "oklch(0.18 0.04 350)" }}>
      <div className="absolute inset-0 flex items-center justify-around px-12">
        {/* Two avatars meeting */}
        {[0, 1].map((i) => (
          <motion.div
            key={i}
            className="relative"
            initial={{ x: i === 0 ? -20 : 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          >
            <div className="size-12 rounded-full" style={{
              background: i === 0
                ? "linear-gradient(135deg, #f472b6, #ec4899)"
                : "linear-gradient(135deg, #a78bfa, #8b5cf6)",
            }} />
            <PulseDot color={i === 0 ? "#f472b6" : "#a78bfa"} />
          </motion.div>
        ))}
      </div>
      {/* Connecting thread */}
      <svg className="absolute inset-0 size-full" preserveAspectRatio="none" aria-hidden>
        <motion.path
          d="M 30%,50% Q 50%,40% 70%,50%"
          fill="none"
          stroke="rgba(244,114,182,0.45)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute right-4 top-4 grid size-9 place-items-center rounded-xl bg-[#f472b6]/20 text-[#f9a8d4]">
        <Users className="size-4" />
      </div>
    </div>
  );
}

// 05 — AURORA: aurora-gradient bands rising
function AuroraVisual() {
  return (
    <div className="absolute inset-0" style={{ background: "oklch(0.15 0.06 200)" }}>
      {/* Aurora gradient bands */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-2/3"
        style={{
          background:
            "linear-gradient(180deg, transparent, rgba(94,234,212,0.25) 30%, rgba(168,85,247,0.25) 70%, rgba(244,114,182,0.20))",
          filter: "blur(20px)",
        }}
      />
      {/* Equalizer bars */}
      <div className="absolute inset-0 flex items-end justify-center gap-1.5 pb-7">
        {[40, 70, 55, 90, 65, 80, 50, 75, 60].map((h, i) => (
          <motion.div
            key={i}
            className="w-2 rounded-t-sm bg-gradient-to-t from-[#5eead4] via-[#a855f7] to-[#f472b6]"
            initial={{ height: 8 }}
            animate={{ height: [`${h * 0.4}%`, `${h}%`, `${h * 0.5}%`] }}
            transition={{ duration: 1.2 + i * 0.05, repeat: Infinity, ease: "easeInOut", delay: i * 0.08 }}
          />
        ))}
      </div>
      <div className="absolute right-4 top-4 grid size-9 place-items-center rounded-xl bg-[#a855f7]/20 text-[#d8b4fe]">
        <Music className="size-4" />
      </div>
    </div>
  );
}

// 06 — PULSE: chart sweep with a heartbeat line
function PulseVisual() {
  return (
    <div className="absolute inset-0" style={{ background: "oklch(0.16 0.04 145)" }}>
      <svg className="absolute inset-0 size-full" viewBox="0 0 400 250" preserveAspectRatio="none" aria-hidden>
        {/* Grid lines */}
        {[50, 100, 150, 200].map((y) => (
          <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="rgba(134,239,172,0.08)" strokeWidth="1" />
        ))}
        {/* Heartbeat line */}
        <motion.polyline
          fill="none"
          stroke="#86efac"
          strokeWidth="2.5"
          strokeLinejoin="round"
          points="0,150 60,150 80,150 100,80 120,200 140,40 160,150 200,150 240,150 260,130 280,170 320,90 360,150 400,150"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, ease: "easeOut", repeat: Infinity, repeatDelay: 0.8 }}
        />
      </svg>
      <div className="absolute right-4 top-4 grid size-9 place-items-center rounded-xl bg-[#22c55e]/20 text-[#86efac]">
        <Activity className="size-4" />
      </div>
    </div>
  );
}

// 07 — ECHO: AI bubble typing
function EchoVisual() {
  return (
    <div className="absolute inset-0" style={{ background: "oklch(0.16 0.04 260)" }}>
      <div className="absolute inset-0 flex flex-col items-start justify-center gap-2 px-7">
        <div className="rounded-xl rounded-tl-sm bg-foreground/[0.06] px-4 py-2 text-sm">
          What's our refund policy?
        </div>
        <motion.div
          className="rounded-xl rounded-tl-sm bg-[#8b5cf6]/20 px-4 py-2 text-sm text-[#c4b5fd]"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <motion.span
            className="inline-flex gap-1"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          >
            <span className="size-1.5 rounded-full bg-[#c4b5fd]" />
            <span className="size-1.5 rounded-full bg-[#c4b5fd]" />
            <span className="size-1.5 rounded-full bg-[#c4b5fd]" />
          </motion.span>
        </motion.div>
      </div>
      <div className="absolute right-4 top-4 grid size-9 place-items-center rounded-xl bg-[#8b5cf6]/20 text-[#c4b5fd]">
        <Sparkles className="size-4" />
      </div>
    </div>
  );
}

// 08 — BEACON: radar sweep
function BeaconVisual() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: "oklch(0.15 0.05 30)" }}>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#f97316]/40"
            style={{ width: i * 38, height: i * 38 }}
            animate={{ opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-3 rounded-full bg-[#f97316]" />
      </div>
      <div className="absolute right-4 top-4 grid size-9 place-items-center rounded-xl bg-[#f97316]/20 text-[#fdba74]">
        <Radio className="size-4" />
      </div>
    </div>
  );
}

// 09 — VAULT: stacked vote cards with progress
function VaultVisual() {
  return (
    <div className="absolute inset-0" style={{ background: "oklch(0.17 0.04 220)" }}>
      <div className="absolute inset-0 flex flex-col justify-center gap-2 px-7">
        {[
          { label: "Dark mode for the dashboard", votes: 84, color: "#5eead4" },
          { label: "Bulk role assignment", votes: 52, color: "#5eead4" },
          { label: "Stripe integration", votes: 28, color: "#5eead4" },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            className="rounded-lg border border-card-border bg-card/80 p-2"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 * i }}
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-medium">{item.label}</span>
              <span className="font-mono text-[10px] text-muted-foreground">▲ {item.votes}</span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-foreground/[0.06]">
              <motion.div
                className="h-full"
                style={{ backgroundColor: item.color }}
                initial={{ width: 0 }}
                animate={{ width: `${item.votes}%` }}
                transition={{ duration: 0.9, delay: 0.3 + i * 0.15, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        ))}
      </div>
      <div className="absolute right-4 top-4 grid size-9 place-items-center rounded-xl bg-[#14b8a6]/20 text-[#5eead4]">
        <Archive className="size-4" />
      </div>
    </div>
  );
}
