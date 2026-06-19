"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  MousePointerClick,
  Sparkles,
  ArrowRight,
  ArrowUp,
  Boxes,
  BookOpen,
  LineChart,
  ShieldCheck,
  Download,
  Bot,
  Hash,
  Volume2,
  Wand2,
  MessageCircleQuestion,
  Rocket,
} from "lucide-react";
import { BackgroundPaths } from "@/components/fx/background-paths";
import { GuildBot3D } from "@/components/fx/guild-bot-3d";
import { GuildLabsLogo } from "@/components/logo";
import { SiteNav } from "@/components/site/site-nav";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/site/reveal";
import { SectionLabel } from "@/components/site/section-label";
import { BuilderModes } from "@/components/construct-ai/builder-modes";
import { Showcase } from "@/components/sections/showcase";
import { QueenTeaser } from "@/components/sections/queen-teaser";
import { TickerSearch } from "@/components/ticker-search";
import { TickerMarquee } from "@/components/ticker-marquee";
import { AnimatedHeading } from "@/components/motion/animated-heading";
import { SpotlightCard } from "@/components/fx/spotlight-card";
import { TiltCard } from "@/components/fx/tilt-card";
import { BotSlides, type BotSlide } from "@/components/sections/bot-slides";
import { CountUp } from "@/components/motion/count-up";
import Link from "next/link";

const BOTS: BotSlide[] = [
  {
    name: "Construct",
    href: "/bots/construct",
    glow: "var(--primary)",
    icon: Boxes,
    body: "Deploys your blueprint into a live server: roles, categories, channels, permissions, set up right the first time.",
  },
  {
    name: "Maven",
    href: "/bots/maven",
    glow: "var(--accent)",
    icon: BookOpen,
    body: "Surfaces the answer when a question's been asked before. Runs on a local model — no API keys, no per-message cost.",
  },
  {
    name: "ChartIt",
    href: "/bots/chartit",
    glow: "var(--coral)",
    icon: LineChart,
    body: "Live stock and crypto charts in Discord. One slash command pulls the quote and renders the chart.",
  },
];

type Stat = { value: number; format?: (n: number) => string; label: string };

const STATS: Stat[] = [
  { value: 3, label: "Free, open-source bots" },
  { value: 4, label: "Taps to a live server" },
  { value: 0, format: (n) => `$${Math.round(n)}`, label: "Forever — no premium tier" },
  { value: 100, format: (n) => `${Math.round(n)}%`, label: "Source on GitHub" },
];

const MARQUEE_TICKERS = [
  "AAPL", "NVDA", "TSLA", "MSFT", "AMZN", "META", "GOOGL", "AMD",
  "BTC-USD", "ETH-USD", "SOL-USD", "XRP-USD", "DOGE-USD",
  "SPY", "QQQ", "^GSPC",
];

function scrollToBuilder() {
  document.getElementById("builder")?.scrollIntoView({ behavior: "smooth" });
}

export default function Home() {
  return (
    <main className="relative">
      {/* Unified, scroll-aware navbar (floating over the hero) with the docked
          auth island — no more center-screen overlap. */}
      <SiteNav floating />

      {/* hero — the GuildLabs robot on a band of brand-colored floating paths */}
      <section className="relative flex min-h-dvh flex-col items-start justify-center overflow-hidden px-4 pb-24 pt-32 text-[oklch(0.97_0.02_280)]">
        {/* dark night backdrop */}
        <div
          aria-hidden
          className="grain absolute inset-0"
          style={{ background: "linear-gradient(160deg, #241a4d 0%, #1a1238 52%, #0f0a22 100%)" }}
        />
        {/* soft glows — hidden on phones, where the large blur washes out the
            small viewport (and is costly to render) */}
        <div aria-hidden className="pointer-events-none absolute -right-10 top-6 hidden size-[28rem] rounded-full opacity-25 blur-3xl sm:block" style={{ background: "var(--secondary)" }} />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-16 hidden size-96 rounded-full opacity-20 blur-3xl sm:block" style={{ background: "var(--accent)" }} />
        {/* a few stars for the night feel */}
        <span className="absolute left-[10%] top-[24%] size-1 rounded-full bg-white/70 animate-twinkle" />
        <span className="absolute left-[40%] top-[18%] size-1.5 rounded-full bg-white/60 animate-twinkle [animation-delay:1.1s]" />
        <span className="absolute right-[26%] bottom-[28%] size-1 rounded-full bg-white/50 animate-twinkle [animation-delay:0.6s]" />

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-8 md:grid-cols-2">
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          >
            <motion.span
              variants={fadeUp}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-[oklch(0.78_0.16_165)] px-4 py-1.5 text-sm font-bold text-[oklch(0.22_0.07_165)] shadow-lg"
            >
              <Sparkles className="size-4" /> New — AI server blueprints
            </motion.span>

            <motion.h1
              variants={fadeUp}
              className="font-display text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl"
            >
              A finished Discord
              <br />
              server in minutes.
              <br />
              <span className="text-accent">Free.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-6 max-w-lg text-lg text-white/75"
            >
              Pick what your community needs. The AI turns your choices into channels,
              roles, and permissions, then deploys them to your server. No config to
              learn. No subscription.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="mt-9 flex flex-col gap-3 sm:flex-row"
            >
              <Button size="lg" magnetic onClick={scrollToBuilder}>
                <MousePointerClick className="size-5" /> Build my server — free
              </Button>
              <Button size="lg" variant="glass" onClick={scrollToBuilder}>
                <Download className="size-5" /> Download the blueprint
              </Button>
            </motion.div>
          </motion.div>

          {/* the robot + paths — a panel on the side */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto flex w-full max-w-[440px] flex-col items-center"
          >
            {/* brand floating paths, localized behind the robot */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-80"
              style={{
                maskImage: "radial-gradient(75% 75% at 50% 45%, black, transparent 78%)",
                WebkitMaskImage: "radial-gradient(75% 75% at 50% 45%, black, transparent 78%)",
              }}
            >
              <BackgroundPaths />
            </div>
            <div className="relative z-10 h-[320px] w-full max-w-[360px] sm:h-[420px] sm:max-w-[400px]">
              <GuildBot3D />
            </div>
            <span className="relative z-10 mt-1 text-xs font-medium uppercase tracking-widest text-white/40">
              Say hi — it follows your cursor
            </span>
          </motion.div>
        </div>

        {/* scroll cue */}
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            className="h-9 w-5 rounded-full border border-white/40 p-1"
          >
            <span className="block size-1.5 rounded-full bg-white/80" />
          </motion.div>
        </motion.div>
      </section>

      {/* live charts — discoverability for ChartIt */}
      <section className="px-4 py-20">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-card-border px-3 py-1 text-sm text-muted-foreground">
              <LineChart className="size-4 text-accent" /> Powered by ChartIt
            </div>
            <AnimatedHeading
              as="h2"
              text="Live charts for"
              highlight="any ticker"
              className="mt-5 text-4xl font-black tracking-tight sm:text-5xl"
            />
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Stocks, crypto, ETFs and indices — search one and open an interactive chart, or add ChartIt to your
              Discord server.
            </p>
            <div className="mx-auto mt-7 max-w-xl">
              <TickerSearch autoFocus={false} />
            </div>
            <div className="mt-6">
              <TickerMarquee tickers={MARQUEE_TICKERS} />
            </div>
            <div className="mt-6">
              <Link href="/stocks" className="text-sm font-semibold text-primary hover:underline">
                Browse all tickers →
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* problem */}
      <section className="px-4 py-20">
        <Reveal>
          <div className="mx-auto max-w-3xl">
            <SectionLabel index="01" tone="outline">The problem</SectionLabel>
            <h2 className="mt-5 font-display text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl text-balance">
              Setting up a server is <span className="hl">its own job.</span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Channel structure. A role hierarchy that doesn&apos;t leak permissions. The
              five bots that each do one thing. Most people copy a template, fight the
              settings for an afternoon, and still end up with a server that looks
              unfinished.
            </p>
          </div>
        </Reveal>
      </section>

      {/* how it works — four taps */}
      <section id="how" className="px-4 py-20">
        <Reveal>
          <div className="mx-auto max-w-6xl">
            <SectionLabel index="02" tone="primary">How it works</SectionLabel>
            <h2 className="mt-5 font-display text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl text-balance">
              Four taps to a <span className="hl-primary">real server.</span>
            </h2>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  step: "01",
                  title: "Pick",
                  body: "Choose your community type and what it needs — voice channels, verification, a welcome flow, holder roles, whatever fits.",
                },
                {
                  step: "02",
                  title: "The AI merges it",
                  body: "Your choices become one coherent blueprint: channels, categories, roles, and the permission overwrites that make them work.",
                },
                {
                  step: "03",
                  title: "Review",
                  body: "See the whole structure before anything touches your server. Change anything.",
                },
                {
                  step: "04",
                  title: "Deploy",
                  body: "The Construct bot builds it in your server in seconds. Or download the blueprint as JSON and keep it.",
                },
              ].map((s) => (
                <TiltCard key={s.step} max={6} className="h-full">
                  <SpotlightCard className="card-hover h-full rounded-3xl border-2 border-card-border bg-card p-6">
                    <span className="font-mono text-6xl font-black leading-none tabular-nums text-primary/15 transition-colors duration-300 group-hover:text-primary/30">
                      {s.step}
                    </span>
                    <h3 className="mt-3 font-display text-xl font-black">{s.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
                  </SpotlightCard>
                </TiltCard>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* stats band — honest, count-up on scroll */}
      <section className="px-4 py-10">
        <Reveal>
          <div className="grain relative mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden rounded-[2rem] border-2 border-card-border bg-card-border lg:grid-cols-4">
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className="group relative flex flex-col items-center justify-center bg-card px-4 py-10 text-center transition-colors hover:bg-primary/[0.04]"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-gradient-to-r from-transparent via-primary to-transparent transition-transform duration-500 group-hover:scale-x-100"
                />
                <CountUp
                  value={s.value}
                  format={s.format}
                  duration={1.1 + i * 0.15}
                  className="font-display text-5xl font-black tabular-nums text-foreground sm:text-6xl"
                />
                <span className="mt-2 max-w-[12rem] text-sm font-medium text-muted-foreground">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* showcase — animated demos of how the bot is added & how features work */}
      <Showcase />

      {/* playground promo */}
      <section className="px-4 py-20">
        <Reveal>
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
            {/* copy */}
            <div>
              <SectionLabel tone="accent">New · Playground</SectionLabel>
              <h2 className="mt-5 font-display text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl text-balance">
                Just <span className="hl">talk to the bot.</span>
              </h2>
              <p className="mt-5 max-w-md text-lg text-muted-foreground text-pretty">
                Type a slash command and watch it happen — in a Discord-style chat. Build a whole
                server, drop a live chart, or ask anything. No setup, right in your browser.
              </p>

              <div className="mt-7 flex flex-wrap gap-2">
                {[
                  { icon: Wand2, label: "/build", desc: "a server" },
                  { icon: LineChart, label: "/chart", desc: "AAPL" },
                  { icon: MessageCircleQuestion, label: "/ask", desc: "anything" },
                ].map((c) => {
                  const Icon = c.icon;
                  return (
                    <span
                      key={c.label}
                      className="inline-flex items-center gap-2 rounded-full border-2 border-card-border bg-card px-3.5 py-1.5 font-mono text-sm"
                    >
                      <Icon className="size-4 text-primary" />
                      <span className="font-bold text-foreground">{c.label}</span>
                      <span className="text-muted-foreground">{c.desc}</span>
                    </span>
                  );
                })}
              </div>

              <div className="mt-8">
                <Link href="/playground">
                  <Button size="lg" magnetic>
                    <Bot className="size-5" /> Open the playground <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* chat mock (Discord-style, forced dark) — floats in 3D toward the cursor */}
            <div className="dark">
              <TiltCard glare max={8} perspective={1100} className="rounded-3xl">
                <div className="glass-strong rounded-3xl p-3 [transform-style:preserve-3d]">
                  <div className="rounded-2xl bg-background-deep/80 p-4 [transform-style:preserve-3d]">
                  {/* user */}
                  <div className="flex gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted font-display text-xs font-bold text-foreground">
                      You
                    </span>
                    <div className="min-w-0">
                      <div className="font-display text-sm font-bold text-foreground">You</div>
                      <div className="mt-0.5 font-mono text-sm text-foreground/90">
                        /build a study group server
                      </div>
                    </div>
                  </div>

                  {/* bot */}
                  <div className="mt-4 flex gap-3 [transform-style:preserve-3d]">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Bot className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1 [transform-style:preserve-3d]">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-bold text-foreground">GuildLabs</span>
                        <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider text-primary">
                          Bot
                        </span>
                      </div>
                      {/* the embed floats above the chat surface when the card tilts */}
                      <div className="mt-1.5 rounded-xl border-l-4 border-primary bg-card p-3 shadow-[var(--elevation-1)] [transform:translateZ(32px)]">
                        <div className="flex items-center gap-1.5 text-[0.65rem] font-semibold text-secondary">
                          <Boxes className="size-3.5" /> CONSTRUCT BLUEPRINT
                        </div>
                        <div className="mt-0.5 font-display text-lg font-black text-foreground">Study Hub</div>
                        <ul className="mt-2 space-y-0.5 font-mono text-xs text-foreground/80">
                          {([
                            { icon: Hash, name: "welcome" },
                            { icon: Hash, name: "resources" },
                            { icon: Hash, name: "homework-help" },
                            { icon: Volume2, name: "Study Room" },
                          ] as const).map((row) => (
                            <li key={row.name} className="flex items-center gap-1.5">
                              {React.createElement(row.icon, { className: "size-3 text-muted-foreground" })}
                              {row.name}
                            </li>
                          ))}
                        </ul>
                        <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[0.7rem] font-bold text-primary-foreground">
                          <Rocket className="size-3" /> Open in Construct
                        </span>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              </TiltCard>
            </div>
          </div>
        </Reveal>
      </section>

      {/* the bots */}
      <section className="px-4 py-20">
        <Reveal>
          <div className="mx-auto max-w-6xl">
            <SectionLabel index="03" tone="accent">The studio</SectionLabel>
            <h2 className="mt-5 font-display text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl text-balance">
              Tools that do <span className="hl">one thing, well.</span>
            </h2>
            <p className="mt-4 max-w-lg text-lg text-muted-foreground">
              GuildLabs is a small studio of free, open-source Discord bots. Each one
              solves a single problem properly.
            </p>
            {/* 3D interactive slides — drag, click a side card, or use the arrows */}
            <BotSlides bots={BOTS} />
          </div>
        </Reveal>
      </section>

      {/* coming soon — the 4th bot */}
      <QueenTeaser />

      {/* trust */}
      <section className="px-4 py-20">
        <Reveal>
          <div className="mx-auto max-w-3xl">
            <SectionLabel index="04" tone="outline">
              <ShieldCheck className="size-3.5" /> Free forever
            </SectionLabel>
            <h2 className="mt-5 font-display text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl text-balance">
              Open-source. <span className="hl-coral">You run it.</span>
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              GuildLabs bots aren&apos;t a hosted service you rent — they&apos;re open-source
              programs you run on your own machine. No premium tier, no subscription, no
              servers to pay for: just clone it, start it, and your community&apos;s data
              never leaves your hardware. The source is on GitHub — read exactly what every
              bot does, then host it yourself in about ten minutes.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-primary">
              <Link href="/guides/how-to-self-host-guildlabs-bots" className="inline-flex items-center gap-1 hover:opacity-80">
                Self-host guide <ArrowRight className="size-3.5" />
              </Link>
              <a href="https://github.com/LUCAPOPESCU29/GuildLabs" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:opacity-80">
                Read the source <ArrowRight className="size-3.5" />
              </a>
              <Link href="/vs" className="inline-flex items-center gap-1 hover:opacity-80">
                Compare with MEE6 &amp; more <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* builder */}
      <section id="builder" className="py-20">
        <Reveal className="mb-10 px-4">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-display text-4xl font-black tracking-tight sm:text-5xl">
              The <span className="text-primary">builder</span>
            </h2>
            <p className="mt-4 max-w-lg text-lg text-muted-foreground">
              Describe your server and let the AI design it, or work through the steps
              yourself. Either way you review and edit everything before deploy.
            </p>
          </div>
        </Reveal>
        <BuilderModes />
      </section>

      {/* final cta — night-sky band (cohesive with the hero painting), now a
          3D object: the band tilts toward the cursor and the content floats
          at different depths above the painted sky */}
      <section className="px-4 py-20">
        <Reveal>
          <TiltCard max={4} glare perspective={1400} className="mx-auto max-w-6xl rounded-[2.5rem]">
            {/* painted-sky background — its own clipped layer so the depth
                transforms above stay un-flattened */}
            <div
              aria-hidden
              className="grain absolute inset-0 overflow-hidden rounded-[2.5rem]"
              style={{
                background:
                  "linear-gradient(155deg, var(--sky-top) 0%, var(--sky-mid) 52%, var(--sky-low) 100%)",
              }}
            >
              {/* blueprint dot-grid */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.14]"
                style={{
                  backgroundImage: "radial-gradient(circle, white 1px, transparent 1.4px)",
                  backgroundSize: "22px 22px",
                  maskImage: "radial-gradient(120% 100% at 50% 0%, black, transparent 75%)",
                  WebkitMaskImage: "radial-gradient(120% 100% at 50% 0%, black, transparent 75%)",
                }}
              />
              {/* moon + accent glow */}
              <div className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full opacity-30 blur-3xl" style={{ background: "var(--moon)" }} />
              <div className="pointer-events-none absolute -bottom-24 -left-16 size-80 rounded-full opacity-25 blur-3xl" style={{ background: "var(--accent)" }} />
              {/* twinkling stars */}
              <span className="absolute left-[12%] top-[22%] size-1 rounded-full bg-white/80 animate-twinkle" />
              <span className="absolute right-[18%] top-[30%] size-1.5 rounded-full bg-white/70 animate-twinkle [animation-delay:1.2s]" />
              <span className="absolute left-[24%] bottom-[26%] size-1 rounded-full bg-white/60 animate-twinkle [animation-delay:0.6s]" />
            </div>

            <div className="relative px-6 py-20 text-center text-white [transform-style:preserve-3d] sm:py-28">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-[0.72rem] font-black uppercase tracking-[0.14em] backdrop-blur-sm [transform:translateZ(30px)]">
                <Sparkles className="size-3.5 text-accent" /> Free forever
              </span>
              <h2 className="mt-6 font-display text-5xl font-black leading-[0.92] tracking-tight sm:text-7xl lg:text-8xl text-balance [transform:translateZ(55px)]">
                Build the server you
                <br />
                <span className="text-accent">actually wanted.</span>
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg text-white/75 text-pretty [transform:translateZ(35px)]">
                Pick your choices, review the blueprint, deploy. A few minutes — and it costs
                nothing.
              </p>
              <div className="mt-9 flex flex-col justify-center gap-3 [transform:translateZ(70px)] sm:flex-row">
                <Button size="lg" variant="accent" magnetic onClick={scrollToBuilder}>
                  <MousePointerClick className="size-5" /> Build my server — free
                </Button>
                <Link href="/templates">
                  <Button
                    size="lg"
                    variant="glass"
                    className="!border-white/30 !bg-white/10 !text-white hover:!bg-white/20"
                  >
                    <Download className="size-5" /> Download a blueprint first
                  </Button>
                </Link>
              </div>
            </div>
          </TiltCard>
        </Reveal>
      </section>

      {/* footer */}
      <footer className="border-t border-card-border px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
            {/* brand */}
            <div className="flex flex-col gap-2">
              <GuildLabsLogo className="h-8 w-auto" />
              <p className="text-sm text-muted-foreground">
                AI-powered Discord server builder.
              </p>
            </div>

            {/* links */}
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted-foreground">
              <div className="flex flex-col gap-2">
                <span className="font-semibold text-foreground">Product</span>
                <Link href="/#how" className="hover:text-foreground transition-colors">How it works</Link>
                <Link href="/bots" className="hover:text-foreground transition-colors">Bots</Link>
                <Link href="/templates" className="hover:text-foreground transition-colors">Templates</Link>
                <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
              </div>
              <div className="flex flex-col gap-2">
                <span className="font-semibold text-foreground">Resources</span>
                <a href="https://github.com/LUCAPOPESCU29/GuildLabs" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
                <Link href="/bots/maven" className="hover:text-foreground transition-colors">Maven</Link>
                <Link href="/vs" className="hover:text-foreground transition-colors">Comparisons</Link>
                <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
              </div>
              <div className="flex flex-col gap-2">
                <span className="font-semibold text-foreground">Legal</span>
                <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center gap-3 border-t border-card-border pt-6 text-xs text-muted-foreground sm:flex-row sm:justify-between">
            <Link
              href="/status"
              className="inline-flex items-center gap-2 transition-colors hover:text-foreground"
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-success" />
              </span>
              All systems operational
            </Link>
            <span>© {new Date().getFullYear()} GuildLabs. All rights reserved.</span>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="inline-flex items-center gap-1 transition-colors hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              Back to top <ArrowUp className="size-3.5" />
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};
