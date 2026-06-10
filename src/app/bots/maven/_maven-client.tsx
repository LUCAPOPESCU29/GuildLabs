"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Lock,
  Sparkles,
  Wallet,
  Server,
  Repeat,
} from "lucide-react";
import { GuildLabsLogo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { DiscordIcon } from "@/components/icons/discord";
import { GithubIcon } from "@/components/icons/github";

// Maven brand tokens — kept here so the page is self-contained.
const MAVEN_GOLD = "#c89b3c";
const MAVEN_GOLD_SOFT = "rgba(200,155,60,0.12)";
const MAVEN_GOLD_GLOW = "rgba(200,155,60,0.35)";

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
        {/* Soft gold glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(60% 50% at 50% 0%, ${MAVEN_GOLD_GLOW}, transparent 70%)`,
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

              <div className="mt-5 inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest"
                style={{ background: MAVEN_GOLD_SOFT, color: MAVEN_GOLD }}
              >
                <BookOpen className="size-3.5" />
                by GuildLabs
              </div>

              <h1 className="mt-6 font-display text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl">
                Your community already{" "}
                <span style={{ color: MAVEN_GOLD }}>answered that.</span>
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
                  className="inline-flex items-center justify-center gap-2.5 rounded-full px-6 py-3.5 font-display text-base font-bold text-black transition-all hover:brightness-110 active:scale-[0.98]"
                  style={{
                    backgroundColor: MAVEN_GOLD,
                    boxShadow: `0 18px 40px -12px ${MAVEN_GOLD_GLOW}`,
                  }}
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

              <p className="mt-4 text-xs text-muted-foreground">
                Free · open source · no external services
              </p>
            </div>

            {/* Visual demo */}
            <MavenSurfaceDemo />
          </motion.div>
        </div>
      </section>

      {/* ── Problem → Benefit ─────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-2xl">
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em]"
              style={{ color: MAVEN_GOLD }}
            >
              The repeat-question problem
            </span>
            <h2 className="mt-4 font-display text-4xl font-black leading-tight tracking-tight sm:text-5xl">
              Communities ask the same things on repeat.
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
          </div>

          <h3 className="mt-16 font-mono text-xs font-semibold uppercase tracking-[0.18em]"
            style={{ color: MAVEN_GOLD }}
          >
            What you get
          </h3>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {BENEFITS.map((p, i) => (
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
                  style={{ background: MAVEN_GOLD_SOFT, color: MAVEN_GOLD }}
                >
                  <p.icon className="size-5" />
                </div>
                <h4 className="mt-5 font-display text-xl font-black">{p.title}</h4>
                <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Commands strip ────────────────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl rounded-3xl border border-card-border bg-card p-8">
          <div className="grid gap-8 md:grid-cols-[1fr,1.4fr]">
            <div>
              <h3 className="font-display text-3xl font-black leading-tight">
                Eight commands, one bot.
              </h3>
              <p className="mt-3 text-sm text-muted-foreground">
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
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="px-6 pb-32 text-center">
        <div className="mx-auto max-w-2xl">
          <Sparkles
            className="mx-auto size-8"
            style={{ color: MAVEN_GOLD }}
          />
          <h2 className="mt-5 font-display text-4xl font-black leading-tight tracking-tight">
            Stop answering the same question every week.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Add Maven in a couple of minutes, or read exactly what it does first.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={INVITE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2.5 rounded-full px-6 py-3.5 font-display text-base font-bold text-black transition-all hover:brightness-110 active:scale-[0.98]"
              style={{
                backgroundColor: MAVEN_GOLD,
                boxShadow: `0 18px 40px -12px ${MAVEN_GOLD_GLOW}`,
              }}
            >
              <DiscordIcon className="size-5" color="currentColor" /> Add Maven to my server
            </a>
            <a href={REPO_URL} target="_blank" rel="noreferrer">
              <Button variant="outline" size="lg">
                <GithubIcon className="size-5" /> View the source
              </Button>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

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

/** Animated "Maven surfacing a past answer" mockup. Loops on a 5s cycle. */
function MavenSurfaceDemo() {
  const [stage, setStage] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setStage((s) => (s + 1) % 4), 1600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-3xl border border-white/10 bg-[#1a1c24] p-3 shadow-[0_30px_80px_-30px_rgba(200,155,60,0.4)]">
      <div className="rounded-2xl bg-[#0a0a0c] p-4">
        {/* Channel header */}
        <div className="flex items-center gap-1.5 text-[11px] text-white/40">
          <span className="text-white/60">#</span> support
        </div>

        {/* User question */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: stage >= 0 ? 1 : 0, y: 0 }}
          transition={{ duration: 0.3 }}
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
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: stage >= 2 ? 1 : 0, y: stage >= 2 ? 0 : 8 }}
          transition={{ duration: 0.4 }}
          className="mt-4 ml-10 rounded-xl border-l-2 p-3"
          style={{
            borderColor: MAVEN_GOLD,
            background: "rgba(200,155,60,0.06)",
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="grid size-6 place-items-center rounded-full"
              style={{ background: MAVEN_GOLD_SOFT, color: MAVEN_GOLD }}
            >
              <BookOpen className="size-3.5" />
            </div>
            <span className="text-sm font-bold" style={{ color: MAVEN_GOLD }}>
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
            "Where do I configure the auto-role for new joiners?"
          </div>
          <motion.a
            href="#"
            onClick={(e) => e.preventDefault()}
            initial={{ opacity: 0 }}
            animate={{ opacity: stage >= 3 ? 1 : 0 }}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold"
            style={{ color: MAVEN_GOLD }}
          >
            Jump to that conversation
            <ArrowRight className="size-3" />
          </motion.a>
        </motion.div>

        {/* Bottom status */}
        <div className="mt-4 flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-1.5 text-[10px] font-mono text-white/40">
          <span className="flex items-center gap-1.5">
            <span
              className="size-1.5 rounded-full"
              style={{ background: MAVEN_GOLD }}
            />
            indexed 1,247 questions
          </span>
          <span>87 repeats caught this week</span>
        </div>
      </div>
    </div>
  );
}
