"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Lock,
  Repeat,
  Server,
  Sparkles,
  Wallet,
} from "lucide-react";
import { GuildLabsLogo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { DiscordIcon } from "@/components/icons/discord";
import { GithubIcon } from "@/components/icons/github";
import { TiltCard } from "@/components/fx/tilt-card";
import { SpotlightCard } from "@/components/fx/spotlight-card";
import { Reveal } from "@/components/site/reveal";
import { SectionLabel } from "@/components/site/section-label";
import { AskDemo } from "@/components/demos/ask-demo";
import { MavenFeature } from "@/components/sections/bot-features";
import { EASE_EXPO } from "@/lib/motion";

// Maven's accent is the brand mint — token-driven so it adapts to light/dark.
// (Both theme values of --accent are light enough to read on the fixed-dark
// Discord mock below, so the token works there too.)
const ACCENT = "var(--accent)";
const ACCENT_SOFT = "color-mix(in oklab, var(--accent) 12%, transparent)";
const ACCENT_GLOW = "color-mix(in oklab, var(--accent) 35%, transparent)";

// Maven uses a different Discord app, so it'll have its own client ID
// when the user creates one. For now we fall back to GuildLabs's so the
// invite button doesn't 404 in preview.
const MAVEN_CLIENT_ID =
  process.env.NEXT_PUBLIC_MAVEN_CLIENT_ID ??
  process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID ??
  "";

const INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${MAVEN_CLIENT_ID}&permissions=274877992960&scope=bot+applications.commands`;
const REPO_URL = "https://github.com/LUCAPOPESCU29/GuildLabs";

const BENEFITS = [
  {
    icon: Wallet,
    title: "No running cost",
    body: "Local embeddings mean no API key and no per-message billing — install it and forget the meter.",
  },
  {
    icon: Lock,
    title: "Private by default",
    body: "Questions and answers stay on your infrastructure. Nothing is sent to a third-party model.",
  },
  {
    icon: Server,
    title: "Self-hostable",
    body: "Run it on your own box. The source is open; the behavior is documented.",
  },
  {
    icon: Repeat,
    title: "Less repeat work for mods",
    body: "The answers your team already wrote keep working without anyone re-typing them.",
  },
];

export default function MavenClient() {
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
        {/* Soft mint glow */}
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
              {/* Maven lockup — clean transparent M-monogram + display wordmark */}
              <div className="flex items-center gap-4">
                <img
                  src="/maven-mark.png"
                  alt=""
                  aria-hidden
                  className="h-12 w-auto sm:h-14"
                />
                <span className="font-display text-5xl font-black tracking-tight sm:text-6xl">
                  Maven
                </span>
              </div>

              <div
                className="mt-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-widest"
                style={{ background: ACCENT_SOFT, color: ACCENT }}
              >
                <BookOpen className="size-3.5" />
                by GuildLabs
              </div>

              <h1 className="mt-6 font-display text-5xl font-black leading-[0.95] tracking-tight text-balance sm:text-6xl">
                Your community already <span className="hl">answered that.</span>
              </h1>

              <p className="mt-5 max-w-lg text-lg text-muted-foreground">
                Maven indexes the questions your community asks and surfaces past
                answers automatically. It runs on a local embedding model — no OpenAI
                key, no per-message cost, and nothing leaves your server.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={INVITE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full bg-accent px-7 py-3.5 font-display text-base font-bold text-accent-foreground shadow-[0_18px_40px_-12px_color-mix(in_oklab,var(--accent)_60%,transparent)] transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  <DiscordIcon className="size-5" color="currentColor" />
                  Add Maven to my server
                  <ArrowRight className="size-4" />
                </a>

                <a href={REPO_URL} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="lg">
                    <GithubIcon className="size-5" /> Read the source on GitHub
                  </Button>
                </a>
              </div>

              <p className="mt-4 text-sm text-muted-foreground">
                Free · open source · no external services
              </p>
            </div>

            {/* Visual demo, framed as a GuildLabs product window */}
            <TiltCard glare max={8} perspective={1100} className="rounded-[1.75rem]">
              <ProductWindow name="maven">
                <MavenSurfaceDemo />
              </ProductWindow>
            </TiltCard>
          </motion.div>
        </div>
      </section>

      {/* ── Try it live ───────────────────────────────────────────────────── */}
      <section className="px-6 pb-4">
        <div className="mx-auto max-w-5xl">
          <Reveal className="mb-6 text-center">
            <SectionLabel tone="accent">Try it live</SectionLabel>
            <h2 className="mt-4 font-display text-3xl font-black tracking-tight sm:text-4xl">
              Ask Maven <span className="hl">anything.</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              The same assistant that answers in your server — give it a question.
            </p>
          </Reveal>
          <Reveal>
            <AskDemo accent={ACCENT} />
          </Reveal>
        </div>
      </section>

      {/* ── Problem → Benefit ─────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <Reveal className="max-w-2xl">
            <SectionLabel tone="accent">The repeat-question problem</SectionLabel>
            <h2 className="mt-5 font-display text-4xl font-black leading-tight tracking-tight text-balance sm:text-5xl">
              Communities ask the same things <span className="hl">on repeat.</span>
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              New members ask what&apos;s already in the pins. Mods answer &ldquo;how do
              I get verified&rdquo; for the hundredth time. The knowledge is in your
              server somewhere — it&apos;s just not findable.
            </p>

            <h3 className="mt-12 font-display text-3xl font-black tracking-tight">
              Maven makes it findable.
            </h3>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              When someone asks a question Maven has seen before, it surfaces the
              earlier answer with a match score. Your community&apos;s accumulated
              knowledge stops scrolling out of reach.
            </p>
          </Reveal>

          <Reveal className="mt-16">
            <SectionLabel tone="accent">What you get</SectionLabel>
          </Reveal>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {BENEFITS.map((p, i) => (
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
                  <h4 className="mt-5 font-display text-xl font-black">{p.title}</h4>
                  <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                    {p.body}
                  </p>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Commands strip ────────────────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <Reveal className="mx-auto max-w-5xl">
          <ProductWindow name="maven / commands">
            <div className="grid gap-8 bg-card p-6 sm:p-8 md:grid-cols-[1fr,1.4fr]">
              <div>
                <h3 className="font-display text-3xl font-black leading-tight">
                  Eight commands, one bot.
                </h3>
                <p className="mt-3 text-base text-muted-foreground">
                  Maven runs invisibly day-to-day. These commands let you tune,
                  inspect, and search on demand.
                </p>
              </div>

              <div className="grid gap-2 text-sm">
                <CommandRow code="/maven search <q>" desc="Manual search of past questions" />
                <CommandRow code="/maven stats" desc="How much wisdom is preserved" />
                <CommandRow code="/maven show" desc="Show current settings" admin />
                <CommandRow code="/maven enable / disable" desc="Pause or resume Maven" admin />
                <CommandRow code="/maven watch <channel>" desc="Add a channel to the allowlist" admin />
                <CommandRow code="/maven sensitivity <%>" desc="How close must matches be" admin />
                <CommandRow code="/maven reply <mode>" desc="Public / quiet / off" admin />
              </div>
            </div>
          </ProductWindow>
        </Reveal>
      </section>

      {/* ── What it does ──────────────────────────────────────────────────── */}
      <MavenFeature />

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="px-6 pb-32 text-center">
        <Reveal className="mx-auto max-w-2xl">
          <Sparkles className="mx-auto size-8" style={{ color: ACCENT }} />
          <h2 className="mt-5 font-display text-4xl font-black leading-tight tracking-tight text-balance sm:text-5xl">
            Stop answering the same question <span className="hl">every week.</span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Add Maven in a couple of minutes, or read exactly what it does first.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={INVITE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full bg-accent px-7 py-3.5 font-display text-base font-bold text-accent-foreground shadow-[0_18px_40px_-12px_color-mix(in_oklab,var(--accent)_60%,transparent)] transition-all hover:brightness-110 active:scale-[0.98]"
            >
              <DiscordIcon className="size-5" color="currentColor" /> Add Maven to my server
            </a>
            <a href={REPO_URL} target="_blank" rel="noreferrer">
              <Button variant="outline" size="lg">
                <GithubIcon className="size-5" /> View the source
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

function CommandRow({ code, desc, admin }: { code: string; desc: string; admin?: boolean }) {
  return (
    <div className="flex items-baseline gap-3 rounded-xl bg-foreground/[0.03] px-3 py-2">
      <code className="font-mono text-xs font-semibold">{code}</code>
      <span className="text-xs text-muted-foreground">{desc}</span>
      {admin && (
        <span className="ml-auto rounded-md bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
          admin
        </span>
      )}
    </div>
  );
}

/** Animated "Maven surfacing a past answer" mockup. Loops on a cycle. */
function MavenSurfaceDemo() {
  const reduce = useReducedMotion();
  const [stage, setStage] = React.useState(reduce ? 3 : 0);
  React.useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setStage((s) => (s + 1) % 4), 1600);
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <div className="bg-[#0a0a0c] p-4">
      {/* Channel header */}
      <div className="flex items-center gap-1.5 text-[11px] text-white/40">
        <span className="text-white/60">#</span> support
      </div>

      {/* User question */}
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE_EXPO }}
        className="mt-4 flex gap-2.5"
      >
        <div className="size-8 shrink-0 rounded-full bg-gradient-to-br from-[#5865F2] to-[#a78bfa]" />
        <div>
          <div className="text-sm font-bold text-white">TheLazyDev</div>
          <p className="text-sm text-white/80">
            how do I set up custom roles for new members?
          </p>
        </div>
      </motion.div>

      {/* Maven reply */}
      <motion.div
        initial={false}
        animate={{ opacity: stage >= 2 ? 1 : 0, y: stage >= 2 ? 0 : 8 }}
        transition={{ duration: 0.4, ease: EASE_EXPO }}
        className="mt-4 ml-10 rounded-xl border-l-2 p-3"
        style={{
          borderColor: ACCENT,
          background: "color-mix(in oklab, var(--accent) 6%, transparent)",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="grid size-6 place-items-center rounded-full"
            style={{ background: ACCENT_SOFT, color: ACCENT }}
          >
            <BookOpen className="size-3.5" />
          </div>
          <span className="text-sm font-bold" style={{ color: ACCENT }}>
            Maven · past wisdom
          </span>
          <span className="ml-auto font-mono text-[10px] text-white/40">
            {stage >= 2 ? "87% similar" : ""}
          </span>
        </div>
        <p className="mt-2 text-xs text-white/70">
          This looks similar to a question asked before:
        </p>
        <div className="mt-2 rounded-md bg-white/[0.04] p-2 text-xs text-white/85">
          &ldquo;Where do I configure the auto-role for new joiners?&rdquo;
        </div>
        <motion.a
          href="#"
          onClick={(e) => e.preventDefault()}
          initial={false}
          animate={{ opacity: stage >= 3 ? 1 : 0 }}
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold"
          style={{ color: ACCENT }}
        >
          Jump to that conversation
          <ArrowRight className="size-3" />
        </motion.a>
      </motion.div>

      {/* Bottom status */}
      <div className="mt-4 flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-1.5 font-mono text-[10px] text-white/40">
        <span className="flex items-center gap-1.5">
          <span
            className="size-1.5 rounded-full"
            style={{ background: ACCENT }}
          />
          indexed 1,247 questions
        </span>
        <span>87 repeats caught this week</span>
      </div>
    </div>
  );
}
