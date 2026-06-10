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
} from "lucide-react";
import { HeroScene } from "@/components/site/hero-scene";
import { GuildLabsLogo } from "@/components/logo";
import { SiteNav } from "@/components/site/site-nav";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/site/reveal";
import { SectionLabel } from "@/components/site/section-label";
import { BuilderModes } from "@/components/construct-ai/builder-modes";
import { Showcase } from "@/components/sections/showcase";
import { TickerSearch } from "@/components/ticker-search";
import { TickerMarquee } from "@/components/ticker-marquee";
import { AnimatedHeading } from "@/components/motion/animated-heading";
import Link from "next/link";

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

      {/* hero — illustrated night scene */}
      <section className="relative flex min-h-dvh flex-col items-start justify-center overflow-hidden px-4 pb-24 pt-32 text-[oklch(0.97_0.02_280)]">
        <HeroScene />

        <div className="relative mx-auto w-full max-w-6xl">
          <motion.div
            className="max-w-2xl"
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
                <div
                  key={s.step}
                  className="card-hover relative overflow-hidden rounded-3xl border-2 border-card-border bg-card p-6"
                >
                  <span className="font-mono text-6xl font-black leading-none tabular-nums text-primary/15">
                    {s.step}
                  </span>
                  <h3 className="mt-3 font-display text-xl font-black">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* showcase — animated demos of how the bot is added & how features work */}
      <Showcase />

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
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <Link href="/bots/construct" className="card-hover group rounded-3xl border-2 border-card-border bg-card p-6">
                <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Boxes className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-xl font-black">Construct</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Deploys your blueprint into a live server: roles, categories, channels,
                  permissions, set up right the first time.
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Learn more <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
              <Link href="/bots/maven" className="card-hover group rounded-3xl border-2 border-card-border bg-card p-6">
                <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <BookOpen className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-xl font-black">Maven</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Surfaces the answer when a question&apos;s been asked before. Runs on a
                  local model — no API keys, no per-message cost.
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Learn more <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
              <Link href="/bots/chartit" className="card-hover group rounded-3xl border-2 border-card-border bg-card p-6">
                <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <LineChart className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-xl font-black">ChartIt</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Live stock and crypto charts in Discord. One slash command pulls the
                  quote and renders the chart.
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Learn more <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* trust */}
      <section className="px-4 py-20">
        <Reveal>
          <div className="mx-auto max-w-3xl">
            <SectionLabel index="04" tone="outline">
              <ShieldCheck className="size-3.5" /> Free forever
            </SectionLabel>
            <h2 className="mt-5 font-display text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl text-balance">
              Free, open, and <span className="hl-coral">yours.</span>
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              No premium tier. No locked features behind a MEE6-style subscription. The
              source is on GitHub — read exactly what every bot does before you add it.
              Maven even runs locally, so your community&apos;s questions never leave your
              server.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-primary">
              <a href="https://github.com/LUCAPOPESCU29/GuildLabs" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:opacity-80">
                Read the source <ArrowRight className="size-3.5" />
              </a>
              <Link href="/templates" className="inline-flex items-center gap-1 hover:opacity-80">
                Browse templates <ArrowRight className="size-3.5" />
              </Link>
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

      {/* final cta — night-sky band (cohesive with the hero painting) */}
      <section className="px-4 py-20">
        <Reveal>
          <div
            className="grain relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] px-6 py-20 text-center sm:py-28"
            style={{
              background:
                "linear-gradient(155deg, var(--sky-top) 0%, var(--sky-mid) 52%, var(--sky-low) 100%)",
            }}
          >
            {/* blueprint dot-grid */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.14]"
              style={{
                backgroundImage: "radial-gradient(circle, white 1px, transparent 1.4px)",
                backgroundSize: "22px 22px",
                maskImage: "radial-gradient(120% 100% at 50% 0%, black, transparent 75%)",
                WebkitMaskImage: "radial-gradient(120% 100% at 50% 0%, black, transparent 75%)",
              }}
            />
            {/* moon + accent glow */}
            <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full opacity-30 blur-3xl" style={{ background: "var(--moon)" }} />
            <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-16 size-80 rounded-full opacity-25 blur-3xl" style={{ background: "var(--accent)" }} />
            {/* twinkling stars */}
            <span aria-hidden className="absolute left-[12%] top-[22%] size-1 rounded-full bg-white/80 animate-twinkle" />
            <span aria-hidden className="absolute right-[18%] top-[30%] size-1.5 rounded-full bg-white/70 animate-twinkle [animation-delay:1.2s]" />
            <span aria-hidden className="absolute left-[24%] bottom-[26%] size-1 rounded-full bg-white/60 animate-twinkle [animation-delay:0.6s]" />

            <div className="relative text-white">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-[0.72rem] font-black uppercase tracking-[0.14em] backdrop-blur-sm">
                <Sparkles className="size-3.5 text-accent" /> Free forever
              </span>
              <h2 className="mt-6 font-display text-5xl font-black leading-[0.92] tracking-tight sm:text-7xl lg:text-8xl text-balance">
                Build the server you
                <br />
                <span className="text-accent">actually wanted.</span>
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg text-white/75 text-pretty">
                Pick your choices, review the blueprint, deploy. A few minutes — and it costs
                nothing.
              </p>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
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
          </div>
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
