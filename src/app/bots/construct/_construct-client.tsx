"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Hammer,
  Layers,
  ShieldCheck,
  Wand2,
  Sparkles,
  FileJson,
} from "lucide-react";
import { GuildLabsLogo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { DiscordIcon } from "@/components/icons/discord";
import { GithubIcon } from "@/components/icons/github";

// Construct brand tokens — Discord blurple, kept here so the page is self-contained.
const CONSTRUCT_BLURPLE = "#5865F2";
const CONSTRUCT_SOFT = "rgba(88,101,242,0.12)";
const CONSTRUCT_GLOW = "rgba(88,101,242,0.35)";
const CONSTRUCT_INK = "#a8b1ff";

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
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="border-b border-card-border px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" aria-label="GuildLabs home">
            <GuildLabsLogo className="h-9 w-auto" />
          </Link>
          <Link
            href="/bots"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← All bots
          </Link>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 py-24">
        {/* Soft blurple glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(60% 50% at 50% 0%, ${CONSTRUCT_GLOW}, transparent 70%)`,
            opacity: 0.4,
          }}
        />

        <div className="relative mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
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
                className="mt-5 inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest"
                style={{ background: CONSTRUCT_SOFT, color: CONSTRUCT_INK }}
              >
                <Hammer className="size-3.5" />
                by GuildLabs
              </div>

              <h1 className="mt-6 font-display text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl">
                A whole server,{" "}
                <span style={{ color: CONSTRUCT_INK }}>in one blueprint.</span>
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
                  className="inline-flex items-center justify-center gap-2.5 rounded-full px-6 py-3.5 font-display text-base font-bold text-white transition-all hover:brightness-110 active:scale-[0.98]"
                  style={{
                    backgroundColor: CONSTRUCT_BLURPLE,
                    boxShadow: `0 18px 40px -12px ${CONSTRUCT_GLOW}`,
                  }}
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

              <p className="mt-4 text-xs text-muted-foreground">
                Free · open source · build a server in under a minute
              </p>
            </div>

            {/* Visual demo */}
            <ConstructDeployDemo />
          </motion.div>
        </div>
      </section>

      {/* ── Principles ────────────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 max-w-2xl">
            <span
              className="font-mono text-xs font-semibold uppercase tracking-[0.18em]"
              style={{ color: CONSTRUCT_INK }}
            >
              How Construct works
            </span>
            <h2 className="mt-4 font-display text-4xl font-black leading-tight tracking-tight sm:text-5xl">
              The hour of clicking,{" "}
              <em className="not-italic text-muted-foreground">gone.</em>
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {PRINCIPLES.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.08 }}
                className="rounded-3xl border border-card-border bg-card p-6"
              >
                <div
                  className="grid size-11 place-items-center rounded-xl"
                  style={{ background: CONSTRUCT_SOFT, color: CONSTRUCT_INK }}
                >
                  <p.icon className="size-5" />
                </div>
                <h3 className="mt-5 font-display text-xl font-black">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Three steps strip ─────────────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl rounded-3xl border border-card-border bg-card p-8">
          <div className="grid gap-8 md:grid-cols-[1fr,1.4fr]">
            <div>
              <h3 className="font-display text-3xl font-black leading-tight">
                Three steps, one server.
              </h3>
              <p className="mt-3 text-sm text-muted-foreground">
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
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="px-6 pb-32 text-center">
        <div className="mx-auto max-w-2xl">
          <Sparkles className="mx-auto size-8" style={{ color: CONSTRUCT_INK }} />
          <h2 className="mt-5 font-display text-4xl font-black leading-tight tracking-tight">
            Build your server the right way.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Start in the builder, hand the blueprint to Construct, and skip the
            hour of manual setup entirely.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/#builder"
              className="inline-flex items-center gap-2.5 rounded-full px-6 py-3.5 font-display text-base font-bold text-white transition-all hover:brightness-110 active:scale-[0.98]"
              style={{
                backgroundColor: CONSTRUCT_BLURPLE,
                boxShadow: `0 18px 40px -12px ${CONSTRUCT_GLOW}`,
              }}
            >
              <Hammer className="size-5" /> Start building
            </Link>
            <a href={INVITE_URL} target="_blank" rel="noreferrer">
              <Button variant="outline" size="lg">
                <DiscordIcon className="size-5" color="currentColor" /> Add Construct to Discord
              </Button>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function StepRow({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="flex items-baseline gap-3 rounded-xl bg-foreground/[0.03] px-3 py-2.5">
      <span
        className="grid size-5 shrink-0 place-items-center rounded-full font-mono text-[10px] font-bold"
        style={{ background: CONSTRUCT_SOFT, color: CONSTRUCT_INK }}
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
  const [stage, setStage] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setStage((s) => (s + 1) % 6), 700);
    return () => clearInterval(id);
  }, []);

  const lines = [
    { label: "# rules", kind: "text" },
    { label: "# announcements", kind: "text" },
    { label: "# general", kind: "text" },
    { label: "# off-topic", kind: "text" },
    { label: "🔊 lounge", kind: "voice" },
  ];

  return (
    <div className="rounded-3xl border border-white/10 bg-[#1a1c24] p-3 shadow-[0_30px_80px_-30px_rgba(88,101,242,0.4)]">
      <div className="rounded-2xl bg-[#0a0a0c] p-4">
        {/* Top: blueprint file chip */}
        <div className="flex items-center gap-2 text-[11px] text-white/50">
          <FileJson className="size-3.5" style={{ color: CONSTRUCT_INK }} />
          <span className="font-mono">blueprint.json</span>
          <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] text-white/40">
            <span
              className="size-1.5 rounded-full"
              style={{ background: CONSTRUCT_BLURPLE }}
            />
            deploying
          </span>
        </div>

        {/* Channels populating one by one */}
        <div className="mt-4 space-y-1.5">
          {lines.map((line, i) => (
            <motion.div
              key={line.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{
                opacity: stage > i ? 1 : 0,
                x: stage > i ? 0 : -10,
              }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs"
              style={{ background: CONSTRUCT_SOFT, color: CONSTRUCT_INK }}
            >
              <span
                className="size-1.5 rounded-full"
                style={{ background: CONSTRUCT_BLURPLE }}
              />
              <span className="font-mono">{line.label}</span>
              <motion.span
                className="ml-auto text-[10px] text-white/40"
                animate={{ opacity: stage > i ? 1 : 0 }}
              >
                created
              </motion.span>
            </motion.div>
          ))}
        </div>

        {/* Bottom status */}
        <div className="mt-4 flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-1.5 text-[10px] font-mono text-white/40">
          <span>4 roles · 1 category</span>
          <span style={{ color: stage >= 5 ? CONSTRUCT_INK : undefined }}>
            {stage >= 5 ? "✓ server ready" : `${stage}/5 channels`}
          </span>
        </div>
      </div>
    </div>
  );
}
