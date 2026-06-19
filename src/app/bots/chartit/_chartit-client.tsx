"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CandlestickChart,
  Eye,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { GuildLabsLogo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { DiscordIcon } from "@/components/icons/discord";
import { GithubIcon } from "@/components/icons/github";
import { TiltCard } from "@/components/fx/tilt-card";
import { SpotlightCard } from "@/components/fx/spotlight-card";
import { Reveal } from "@/components/site/reveal";
import { ChartDemo } from "@/components/demos/chart-demo";
import { ChartItFeature } from "@/components/sections/bot-features";
import { EASE_EXPO } from "@/lib/motion";

// ChartIt's page accent is the brand coral — token-driven so it adapts to
// light/dark. Inside the Discord embed mock, green stays green: it mirrors the
// bot's actual embed colors (green = up), on a fixed-dark surface.
const ACCENT = "var(--coral)";
const ACCENT_SOFT = "color-mix(in oklab, var(--coral) 12%, transparent)";
const ACCENT_GLOW = "color-mix(in oklab, var(--coral) 35%, transparent)";
const UP = "#16c784";
const UP_SOFT = "rgba(22,199,132,0.12)";

// ChartIt runs on its own Discord app. Falls back to the literal client id so the
// invite button never 404s in preview.
const CHARTIT_CLIENT_ID =
  process.env.NEXT_PUBLIC_CHARTIT_CLIENT_ID ?? "1511281770820145182";

// Send Messages + Embed Links + Use Application Commands.
const INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${CHARTIT_CLIENT_ID}&permissions=274877992960&scope=bot+applications.commands`;
const REPO_URL = "https://github.com/LUCAPOPESCU29/GuildLabs";

const PRINCIPLES = [
  {
    icon: TrendingUp,
    title: "Any ticker, charted in one line",
    body: "Type /chart AAPL and ChartIt pulls a live quote from Yahoo Finance and renders a clean price chart — stocks, ETFs, crypto, indices. No dashboards, no tab-switching.",
  },
  {
    icon: Bell,
    title: "Watchlists and alerts on autopilot",
    body: "Auto-post charts to a channel on a schedule during market hours, and ping the room the moment a price crosses a threshold you set. The market comes to your server.",
  },
  {
    icon: ShieldCheck,
    title: "Just data — never advice",
    body: "ChartIt shows public market data for information only. It never places trades and every embed carries the not-financial-advice disclaimer. Open source, no API keys.",
  },
];

export default function ChartItClient() {
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
        {/* Soft coral glow */}
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
              {/* ChartIt lockup — branded chart mark + display wordmark */}
              <div className="flex items-center gap-4">
                <span
                  className="grid size-12 place-items-center rounded-2xl sm:size-14"
                  style={{
                    background: ACCENT_SOFT,
                    color: ACCENT,
                    boxShadow: `0 10px 30px -12px ${ACCENT_GLOW}`,
                  }}
                >
                  <CandlestickChart className="size-7 sm:size-8" />
                </span>
                <span className="font-display text-5xl font-black tracking-tight sm:text-6xl">
                  ChartIt
                </span>
              </div>

              <div
                className="mt-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-widest"
                style={{ background: ACCENT_SOFT, color: ACCENT }}
              >
                <CandlestickChart className="size-3.5" />
                by GuildLabs
              </div>

              <h1 className="mt-6 font-display text-5xl font-black leading-[0.95] tracking-tight text-balance sm:text-6xl">
                The market, <span className="hl-coral">in your channel.</span>
              </h1>

              <p className="mt-5 max-w-lg text-lg text-muted-foreground">
                ChartIt drops live stock &amp; crypto charts straight into Discord.
                One slash command pulls a Yahoo Finance quote and renders the
                chart — no leaving the conversation to go stare at a dashboard.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={INVITE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full bg-coral px-7 py-3.5 font-display text-base font-bold text-white shadow-[0_18px_40px_-12px_color-mix(in_oklab,var(--coral)_60%,transparent)] transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  <DiscordIcon className="size-5" color="currentColor" />
                  Add ChartIt to your server
                  <ArrowRight className="size-4" />
                </a>

                <a href={REPO_URL} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="lg">
                    <GithubIcon className="size-5" /> View source
                  </Button>
                </a>
              </div>

              <p className="mt-4 text-sm text-muted-foreground">
                Free · open source · informational only, not financial advice
              </p>
            </div>

            {/* Visual demo, framed as a GuildLabs product window */}
            <TiltCard glare max={8} perspective={1100} className="rounded-[1.75rem]">
              <ProductWindow name="chartit">
                <ChartItDemo />
              </ProductWindow>
            </TiltCard>
          </motion.div>
        </div>
      </section>

      {/* ── Try it live ───────────────────────────────────────────────────── */}
      <section className="px-6 pb-4">
        <div className="mx-auto max-w-5xl">
          <Reveal className="mb-6 text-center">
            <h2 className="font-display text-3xl font-black tracking-tight sm:text-4xl">
              Chart any ticker, <span className="hl">right here.</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              The same live data ChartIt drops in Discord — no install needed to try it.
            </p>
          </Reveal>
          <Reveal>
            <ChartDemo accent={ACCENT} />
          </Reveal>
        </div>
      </section>

      {/* ── Principles ────────────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <Reveal className="mb-14 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-coral px-3.5 py-1 text-[0.72rem] font-black uppercase tracking-[0.14em] text-white">
              How ChartIt works
            </span>
            <h2 className="mt-5 font-display text-4xl font-black leading-tight tracking-tight text-balance sm:text-5xl">
              For servers that talk markets{" "}
              <em className="not-italic text-muted-foreground">all day.</em>
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

      {/* ── Commands strip ────────────────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <Reveal className="mx-auto max-w-5xl">
          <ProductWindow name="chartit / commands">
            <div className="grid gap-8 bg-card p-6 sm:p-8 md:grid-cols-[1fr,1.4fr]">
              <div>
                <h3 className="font-display text-3xl font-black leading-tight">
                  Five commands, every ticker.
                </h3>
                <p className="mt-3 text-base text-muted-foreground">
                  Anyone can chart and quote. Server managers wire up the
                  watchlists and alerts that post on their own.
                </p>
              </div>

              <div className="grid gap-2 text-sm">
                <CommandRow code="/chart <symbol> <range>" desc="Price chart + full quote" />
                <CommandRow code="/quote <symbol>" desc="Fast text-only quote" />
                <CommandRow code="/watchlist add | remove | list" desc="Auto-post charts on a schedule" admin />
                <CommandRow code="/alert add | list | remove" desc="Ping when a price crosses a line" admin />
                <CommandRow code="/chartit" desc="Help & supported symbols" />
              </div>
            </div>
          </ProductWindow>
        </Reveal>
      </section>

      {/* ── What it does ──────────────────────────────────────────────────── */}
      <ChartItFeature />

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="px-6 pb-32 text-center">
        <Reveal className="mx-auto max-w-2xl">
          <Sparkles className="mx-auto size-8" style={{ color: ACCENT }} />
          <h2 className="mt-5 font-display text-4xl font-black leading-tight tracking-tight text-balance sm:text-5xl">
            Stop tabbing out to <span className="hl-coral">check the price.</span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Add ChartIt and pull any chart without ever leaving the
            conversation. Stocks, crypto, indices — all in one slash command.
          </p>
          <a
            href={INVITE_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full bg-coral px-7 py-3.5 font-display text-base font-bold text-white shadow-[0_18px_40px_-12px_color-mix(in_oklab,var(--coral)_60%,transparent)] transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <DiscordIcon className="size-5" color="currentColor" /> Add ChartIt to Discord
          </a>
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

/**
 * Animated "ChartIt answering /chart AAPL" mockup. A command is typed, then the
 * embed renders: the price line draws itself, the area fill rises, and the
 * quote fields stagger in. Loops on a cycle.
 */
function ChartItDemo() {
  const reduce = useReducedMotion();
  const [stage, setStage] = React.useState(reduce ? 5 : 0);

  React.useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setStage((s) => (s + 1) % 6), 900);
    return () => clearInterval(id);
  }, [reduce]);

  // A gently rising AAPL-style close series for the sparkline path.
  const drawn = stage >= 2;

  return (
    <div className="bg-[#0a0a0c] p-4">
      {/* Channel header */}
      <div className="flex items-center gap-1.5 text-[11px] text-white/40">
        <span className="text-white/60">#</span> markets
      </div>

      {/* User command */}
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE_EXPO }}
        className="mt-4 flex gap-2.5"
      >
        <div className="size-8 shrink-0 rounded-full bg-gradient-to-br from-[#16c784] to-[#0ea5e9]" />
        <div>
          <div className="text-sm font-bold text-white">trader_jane</div>
          <p className="text-sm text-white/80">
            <span
              className="rounded-[4px] px-1.5 py-0.5 font-mono text-[13px] font-semibold"
              style={{ background: UP_SOFT, color: UP }}
            >
              /chart
            </span>{" "}
            <span className="font-mono text-white/60">symbol:</span> AAPL{" "}
            <span className="font-mono text-white/60">range:</span> 1M
          </p>
        </div>
      </motion.div>

      {/* ChartIt embed */}
      <motion.div
        initial={false}
        animate={{ opacity: stage >= 1 ? 1 : 0, y: stage >= 1 ? 0 : 8 }}
        transition={{ duration: 0.4, ease: EASE_EXPO }}
        className="mt-4 ml-10 overflow-hidden rounded-md border-l-[3px]"
        style={{ borderColor: UP, background: "rgba(255,255,255,0.03)" }}
      >
        <div className="p-3">
          {/* Embed author/title */}
          <div className="flex items-center gap-2">
            <div
              className="grid size-6 place-items-center rounded-full"
              style={{ background: UP_SOFT, color: UP }}
            >
              <CandlestickChart className="size-3.5" />
            </div>
            <span className="text-sm font-bold text-white">
              Apple Inc. <span className="text-white/50">(AAPL)</span>
            </span>
            <span
              className="ml-auto inline-flex items-center gap-1 font-mono text-[10px]"
              style={{ color: UP }}
            >
              <span className="size-1.5 rounded-full" style={{ background: UP }} />
              Open
            </span>
          </div>

          {/* The chart canvas — self-drawing line + rising area fill */}
          <div className="relative mt-3 h-28 overflow-hidden rounded-lg bg-black/40">
            {/* faint gridlines */}
            <div
              aria-hidden
              className="absolute inset-0 opacity-60"
              style={{
                backgroundImage:
                  "linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
                backgroundSize: "100% 25%",
              }}
            />
            <svg
              className="absolute inset-0 size-full"
              viewBox="0 0 320 112"
              preserveAspectRatio="none"
              aria-hidden
            >
              <defs>
                <linearGradient id="chartit-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={UP} stopOpacity="0.30" />
                  <stop offset="100%" stopColor={UP} stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Area fill, fades in once the line has drawn */}
              <motion.path
                d="M0,82 L26,78 L52,84 L78,70 L104,72 L130,58 L156,62 L182,46 L208,50 L234,34 L260,38 L286,24 L320,18 L320,112 L0,112 Z"
                fill="url(#chartit-fill)"
                initial={false}
                animate={{ opacity: drawn ? 1 : 0 }}
                transition={{ duration: 0.5 }}
              />

              {/* Price line draws itself */}
              <motion.path
                d="M0,82 L26,78 L52,84 L78,70 L104,72 L130,58 L156,62 L182,46 L208,50 L234,34 L260,38 L286,24 L320,18"
                fill="none"
                stroke={UP}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={false}
                animate={{ pathLength: stage >= 1 ? 1 : 0 }}
                transition={{ duration: 1.1, ease: "easeInOut" }}
              />

              {/* Leading dot rides the end of the line */}
              <motion.circle
                cx="320"
                cy="18"
                r="3.5"
                fill={UP}
                initial={false}
                animate={{ opacity: drawn ? 1 : 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              />
            </svg>

            {/* range chip */}
            <span className="absolute right-2 top-2 rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[9px] text-white/50">
              1 month
            </span>
          </div>

          {/* Quote fields stagger in */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { label: "Price", value: "201.45 USD", delay: 3 },
              { label: "Change", value: "+4.12 (+2.09%)", delay: 4, up: true },
              { label: "Volume", value: "58.2M", delay: 5 },
            ].map((f) => (
              <motion.div
                key={f.label}
                initial={false}
                animate={{
                  opacity: stage >= f.delay ? 1 : 0,
                  y: stage >= f.delay ? 0 : 6,
                }}
                transition={{ duration: 0.3, ease: EASE_EXPO }}
                className="rounded-md bg-white/[0.03] px-2 py-1.5"
              >
                <div className="font-mono text-[9px] uppercase tracking-wider text-white/40">
                  {f.label}
                </div>
                <div
                  className="mt-0.5 flex items-center gap-0.5 font-mono text-[11px] font-semibold"
                  style={{ color: f.up ? UP : "rgba(255,255,255,0.85)" }}
                >
                  {f.up && <TrendingUp className="size-3 shrink-0" />}
                  {f.value}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Embed footer — the standing disclaimer */}
        <div className="border-t border-white/[0.06] px-3 py-1.5">
          <span className="flex items-center gap-1.5 font-mono text-[9px] text-white/35">
            <Eye className="size-3" />
            Yahoo Finance · informational only, not financial advice
          </span>
        </div>
      </motion.div>
    </div>
  );
}
