"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileJson,
  Hammer,
  Hash,
  Layers,
  ShieldCheck,
  Sparkles,
  Volume2,
  Wand2,
} from "lucide-react";
import { GuildLabsLogo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { DiscordIcon } from "@/components/icons/discord";
import { GithubIcon } from "@/components/icons/github";
import { TiltCard } from "@/components/fx/tilt-card";
import { SpotlightCard } from "@/components/fx/spotlight-card";
import { Reveal } from "@/components/site/reveal";
import { SectionLabel } from "@/components/site/section-label";
import { EASE_EXPO } from "@/lib/motion";

// Construct's accent is the brand primary (Discord blurple) — token-driven so
// it adapts to light/dark. The dark Discord mock below keeps fixed readable
// inks because its surface never changes with the theme.
const ACCENT = "var(--primary)";
const ACCENT_SOFT = "color-mix(in oklab, var(--primary) 12%, transparent)";
const ACCENT_GLOW = "color-mix(in oklab, var(--primary) 35%, transparent)";
const MOCK_INK = "#a8b1ff"; // readable blurple on the fixed-dark mock
const MOCK_BLURPLE = "#5865F2";
const MOCK_SOFT = "rgba(88,101,242,0.12)";

// Construct runs on the GuildLabs Discord app. Falls back gracefully so the
// invite button doesn't 404 in preview.
const CONSTRUCT_CLIENT_ID =
  process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID ?? "";

// Manage Roles + Manage Channels are the two permissions Construct actually needs.
const INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${CONSTRUCT_CLIENT_ID}&permissions=268435472&scope=bot+applications.commands`;
const REPO_URL = "https://github.com/LUCAPOPESCU29/GuildLabs";

const PRINCIPLES = [
  {
    icon: Layers,
    title: "A whole server, not a checklist",
    body: "One blueprint becomes roles, categories, channels, and permission overwrites — created in the right order, every time. No more clicking through Discord's settings for an hour.",
  },
  {
    icon: ShieldCheck,
    title: "Permissions done correctly",
    body: "Construct reads the permissions baked into your blueprint and applies them as it builds. Verification gates, staff-only channels, read-only announcements — wired up on creation.",
  },
  {
    icon: Wand2,
    title: "Forgiving by design",
    body: "Built from the GuildLabs wizard, a template, or hand-written JSON — Construct normalizes whatever shape you throw at it, and tells you exactly what's wrong when it can't.",
  },
];

export default function ConstructClient() {
  const reduce = useReducedMotion();
  return (
    <main className="grain min-h-screen bg-background text-foreground">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="border-b border-card-border px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" aria-label="GuildLabs home" className="flex min-h-11 items-center">
            <GuildLabsLogo className="h-9 w-auto" />
          </Link>
          <Link
            href="/bots"
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> All bots
          </Link>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 py-20 sm:py-24">
        {/* Soft blurple glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(60% 50% at 50% 0%, ${ACCENT_GLOW}, transparent 70%)`,
            opacity: 0.4,
          }}
        />

        <div className="relative mx-auto max-w-5xl">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_EXPO }}
            className="grid items-center gap-10 lg:grid-cols-[1.1fr,0.9fr]"
          >
            <div>
              {/* Construct lockup — studio mark + display wordmark */}
              <div className="flex items-center gap-4">
                <img
                  src="/GuildLabs Logo - R2 -transparent- copy.png"
                  alt=""
                  aria-hidden
                  className="h-12 w-auto sm:h-14"
                />
                <span className="font-display text-5xl font-black tracking-tight sm:text-6xl">
                  Construct
                </span>
              </div>

              <div
                className="mt-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-widest"
                style={{ background: ACCENT_SOFT, color: ACCENT }}
              >
                <Hammer className="size-3.5" />
                by GuildLabs
              </div>

              <h1 className="mt-6 font-display text-5xl font-black leading-[0.95] tracking-tight text-balance sm:text-6xl">
                A whole server, <span className="hl-primary">in one blueprint.</span>
              </h1>

              <p className="mt-5 max-w-lg text-lg text-muted-foreground">
                Design your server in the GuildLabs builder, hand Construct the
                blueprint, and watch it build the real thing — roles, categories,
                channels, and permissions — in seconds. Set up correctly the
                first time.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/#builder"
                  className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full bg-primary px-7 py-3.5 font-display text-base font-bold text-primary-foreground shadow-[0_18px_40px_-12px_color-mix(in_oklab,var(--primary)_60%,transparent)] transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  <Hammer className="size-5" />
                  Start building
                  <ArrowRight className="size-4" />
                </Link>

                <a href={REPO_URL} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="lg">
                    <GithubIcon className="size-5" /> View source
                  </Button>
                </a>
              </div>

              <p className="mt-4 text-sm text-muted-foreground">
                Free · open source · build a server in under a minute
              </p>
            </div>

            {/* Visual demo, framed as a GuildLabs product window */}
            <TiltCard glare max={8} perspective={1100} className="rounded-[1.75rem]">
              <ProductWindow name="construct">
                <ConstructDeployDemo />
              </ProductWindow>
            </TiltCard>
          </motion.div>
        </div>
      </section>

      {/* ── Principles ────────────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <Reveal className="mb-14 max-w-2xl">
            <SectionLabel tone="primary">How Construct works</SectionLabel>
            <h2 className="mt-5 font-display text-4xl font-black leading-tight tracking-tight text-balance sm:text-5xl">
              The hour of clicking,{" "}
              <em className="not-italic text-muted-foreground">gone.</em>
            </h2>
          </Reveal>

          <div className="grid gap-5 md:grid-cols-3">
            {PRINCIPLES.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.08} className="h-full">
                <SpotlightCard
                  glow={ACCENT}
                  className="card-hover h-full rounded-3xl border-2 border-card-border bg-card p-6"
                >
                  <div
                    className="grid size-11 place-items-center rounded-xl"
                    style={{ background: ACCENT_SOFT, color: ACCENT }}
                  >
                    <p.icon className="size-5" />
                  </div>
                  <h3 className="mt-5 font-display text-xl font-black">{p.title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                    {p.body}
                  </p>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Three steps strip ─────────────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <Reveal className="mx-auto max-w-5xl">
          <ProductWindow name="construct / setup">
            <div className="grid gap-8 bg-card p-6 sm:p-8 md:grid-cols-[1fr,1.4fr]">
              <div>
                <h3 className="font-display text-3xl font-black leading-tight">
                  Three steps, one server.
                </h3>
                <p className="mt-3 text-base text-muted-foreground">
                  No config files to learn. Design visually, export, deploy —
                  Construct handles the rest.
                </p>
              </div>

              <div className="grid gap-2 text-sm">
                <StepRow n="1" title="Design in the builder" desc="Pick a template or start from scratch in the GuildLabs wizard." />
                <StepRow n="2" title="Export the blueprint" desc="One Download JSON button gives you the blueprint file." />
                <StepRow n="3" title="Run /setup" desc="Upload the blueprint to Construct and it builds the server." />
                <StepRow n="4" title="Tune it" desc="/config welcome and /config verification finish the polish." />
              </div>
            </div>
          </ProductWindow>
        </Reveal>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="px-6 pb-32 text-center">
        <Reveal className="mx-auto max-w-2xl">
          <Sparkles className="mx-auto size-8" style={{ color: ACCENT }} />
          <h2 className="mt-5 font-display text-4xl font-black leading-tight tracking-tight text-balance sm:text-5xl">
            Build your server <span className="hl-primary">the right way.</span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Start in the builder, hand the blueprint to Construct, and skip the
            hour of manual setup entirely.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/#builder"
              className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full bg-primary px-7 py-3.5 font-display text-base font-bold text-primary-foreground shadow-[0_18px_40px_-12px_color-mix(in_oklab,var(--primary)_60%,transparent)] transition-all hover:brightness-110 active:scale-[0.98]"
            >
              <Hammer className="size-5" /> Start building
            </Link>
            <a href={INVITE_URL} target="_blank" rel="noreferrer">
              <Button variant="outline" size="lg">
                <DiscordIcon className="size-5" color="currentColor" /> Add Construct to Discord
              </Button>
            </a>
          </div>
        </Reveal>
      </section>
    </main>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

/** Mini product window: traffic-light chrome + mono title bar, card body. */
function ProductWindow({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border-2 border-card-border bg-card shadow-[var(--elevation-3)]">
      <div className="flex items-center gap-1.5 border-b-2 border-card-border/60 bg-background-deep/40 px-5 py-3">
        <span className="size-2.5 rounded-full bg-coral/70" />
        <span className="size-2.5 rounded-full bg-accent/70" />
        <span className="size-2.5 rounded-full bg-primary/60" />
        <span className="ml-2 truncate font-mono text-xs text-muted-foreground">
          guildlabs / {name}
        </span>
      </div>
      {children}
    </div>
  );
}

function StepRow({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="flex items-baseline gap-3 rounded-xl bg-foreground/[0.03] px-3 py-2.5">
      <span
        className="grid size-5 shrink-0 place-items-center rounded-full font-mono text-[10px] font-bold"
        style={{ background: ACCENT_SOFT, color: ACCENT }}
      >
        {n}
      </span>
      <span className="text-sm font-semibold">{title}</span>
      <span className="ml-auto hidden text-xs text-muted-foreground sm:inline">{desc}</span>
    </div>
  );
}

/** Animated "Construct deploying a blueprint" mockup. Loops on a cycle. */
function ConstructDeployDemo() {
  const reduce = useReducedMotion();
  const [stage, setStage] = React.useState(reduce ? 5 : 0);
  React.useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setStage((s) => (s + 1) % 6), 700);
    return () => clearInterval(id);
  }, [reduce]);

  const lines = [
    { label: "rules", kind: "text" },
    { label: "announcements", kind: "text" },
    { label: "general", kind: "text" },
    { label: "off-topic", kind: "text" },
    { label: "lounge", kind: "voice" },
  ];

  return (
    <div className="bg-[#0a0a0c] p-4">
      {/* Top: blueprint file chip */}
      <div className="flex items-center gap-2 text-[11px] text-white/50">
        <FileJson className="size-3.5" style={{ color: MOCK_INK }} />
        <span className="font-mono">blueprint.json</span>
        <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] text-white/40">
          <span
            className="size-1.5 rounded-full"
            style={{ background: MOCK_BLURPLE }}
          />
          deploying
        </span>
      </div>

      {/* Channels populating one by one */}
      <div className="mt-4 space-y-1.5">
        {lines.map((line, i) => (
          <motion.div
            key={line.label}
            initial={false}
            animate={{
              opacity: stage > i ? 1 : 0,
              x: stage > i ? 0 : -10,
            }}
            transition={{ duration: 0.3, ease: EASE_EXPO }}
            className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs"
            style={{ background: MOCK_SOFT, color: MOCK_INK }}
          >
            {line.kind === "voice" ? (
              <Volume2 className="size-3.5 shrink-0" />
            ) : (
              <Hash className="size-3.5 shrink-0" />
            )}
            <span className="font-mono">{line.label}</span>
            <motion.span
              className="ml-auto text-[10px] text-white/40"
              initial={false}
              animate={{ opacity: stage > i ? 1 : 0 }}
            >
              created
            </motion.span>
          </motion.div>
        ))}
      </div>

      {/* Bottom status */}
      <div className="mt-4 flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-1.5 font-mono text-[10px] text-white/40">
        <span>4 roles · 1 category</span>
        {stage >= 5 ? (
          <span className="inline-flex items-center gap-1" style={{ color: MOCK_INK }}>
            <Check className="size-3" /> server ready
          </span>
        ) : (
          <span>{stage}/5 channels</span>
        )}
      </div>
    </div>
  );
}
