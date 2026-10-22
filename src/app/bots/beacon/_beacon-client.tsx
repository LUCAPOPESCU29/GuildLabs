"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Container,
  Radar,
  Terminal,
  TrendingUp,
  Users,
} from "lucide-react";
import { GuildLabsLogo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { SectionWithMockup } from "@/components/ui/section-with-mockup";
import { DiscordIcon } from "@/components/icons/discord";
import { GithubIcon } from "@/components/icons/github";
import { TiltCard } from "@/components/fx/tilt-card";
import { SpotlightCard } from "@/components/fx/spotlight-card";
import { Reveal } from "@/components/site/reveal";
import { SectionLabel } from "@/components/site/section-label";
import { EASE_EXPO } from "@/lib/motion";

// Beacon's accent is a warm signal amber — a lighthouse, not a siren. It's
// token-driven with light-dark() so it stays readable in both themes; the
// dark Discord-style mocks below keep fixed inks because their surface never
// changes with the theme.
const ACCENT = "light-dark(#b45309, #fbbf24)";
const ACCENT_SOFT = `color-mix(in oklab, ${ACCENT} 12%, transparent)`;
const ACCENT_GLOW = `color-mix(in oklab, ${ACCENT} 35%, transparent)`;
const MOCK_AMBER = "#fbbf24";
const MOCK_SOFT = "rgba(251,191,36,0.12)";
const MOCK_UP = "#34d399";

// Beacon runs on its own Discord app. Until the hosted instance is live the
// CTA falls back to the self-host path instead of a broken invite.
const BEACON_CLIENT_ID = process.env.NEXT_PUBLIC_BEACON_CLIENT_ID ?? "";
// Create Invite + View Channels + Send Messages + Embed Links.
const INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${BEACON_CLIENT_ID}&permissions=19457&scope=bot+applications.commands`;
const REPO_URL = "https://github.com/LUCAPOPESCU29/GuildLabs/tree/main/beacon";
const DOCKER_CMD = "docker run -d --env-file .env -v beacon-data:/data -p 8080:8080 beacon";

const PRINCIPLES = [
  {
    icon: Activity,
    title: "Ranked by activity, not bumps",
    body: "Beacon scores every server on who's online, who's growing, and what's on the calendar. There is no bump command, so the best community wins — not whoever spams a button most often.",
  },
  {
    icon: Radar,
    title: "A page that stays live",
    body: "Member and online counts, upcoming events, and a growth chart update themselves from Discord. Your page is never a stale screenshot of a server that used to exist.",
  },
  {
    icon: Container,
    title: "Yours to host",
    body: "One container, one data folder, MIT licensed. Run the official instance or your own directory with the identical product — no privileged intents, no AI, no third-party services.",
  },
];

export default function BeaconClient() {
  const reduce = useReducedMotion();
  const hasInvite = BEACON_CLIENT_ID.length > 0;

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
              {/* Beacon lockup — studio mark + display wordmark */}
              <div className="flex items-center gap-4">
                <img
                  src="/GuildLabs Logo - R2 -transparent- copy.png"
                  alt=""
                  aria-hidden
                  className="h-12 w-auto sm:h-14"
                />
                <span className="font-display text-5xl font-black tracking-tight sm:text-6xl">
                  Beacon
                </span>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <div
                  className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-widest"
                  style={{ background: ACCENT_SOFT, color: ACCENT }}
                >
                  <Radar className="size-3.5" />
                  by GuildLabs
                </div>
                <div className="inline-flex items-center rounded-full border border-card-border px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Beta
                </div>
              </div>

              <h1 className="mt-6 font-display text-5xl font-black leading-[0.95] tracking-tight text-balance sm:text-6xl">
                Your server, <span style={{ color: ACCENT }}>discoverable.</span>
              </h1>

              <p className="mt-5 max-w-lg text-lg text-muted-foreground">
                Beacon gives any Discord server a live public page and a place in
                a directory ranked by real activity — not bumps. Free, open source,
                and self-hostable.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {hasInvite ? (
                  <a
                    href={INVITE_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full bg-primary px-7 py-3.5 font-display text-base font-bold text-primary-foreground shadow-[0_18px_40px_-12px_color-mix(in_oklab,var(--primary)_60%,transparent)] transition-all hover:brightness-110 active:scale-[0.98]"
                  >
                    <DiscordIcon className="size-5" color="currentColor" />
                    Add to Discord
                    <ArrowRight className="size-4" />
                  </a>
                ) : (
                  <a
                    href={REPO_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full bg-primary px-7 py-3.5 font-display text-base font-bold text-primary-foreground shadow-[0_18px_40px_-12px_color-mix(in_oklab,var(--primary)_60%,transparent)] transition-all hover:brightness-110 active:scale-[0.98]"
                  >
                    <Container className="size-5" />
                    Coming soon — self-host it today
                    <ArrowRight className="size-4" />
                  </a>
                )}

                <a href={REPO_URL} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="lg">
                    <GithubIcon className="size-5" /> View source
                  </Button>
                </a>
              </div>

              <p className="mt-4 text-sm text-muted-foreground">
                Free · open source · one command to get listed
              </p>
            </div>

            {/* Visual demo, framed as a GuildLabs product window */}
            <TiltCard glare max={8} perspective={1100} className="rounded-[1.75rem]">
              <ProductWindow name="beacon / directory">
                <BeaconDirectoryDemo />
              </ProductWindow>
            </TiltCard>
          </motion.div>
        </div>
      </section>

      {/* ── Principles ────────────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <Reveal className="mb-14 max-w-2xl">
            <SectionLabel tone="primary">How Beacon works</SectionLabel>
            <h2 className="mt-5 font-display text-4xl font-black leading-tight tracking-tight text-balance sm:text-5xl">
              Discovery for the servers{" "}
              <em className="not-italic text-muted-foreground">Discord forgot.</em>
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Discord&apos;s own Server Discovery needs about a thousand members.
              Beacon is for everyone below that line.
            </p>
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

      {/* ── Four steps strip ──────────────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <Reveal className="mx-auto max-w-5xl">
          <ProductWindow name="beacon / setup">
            <div className="grid gap-8 bg-card p-6 sm:p-8 md:grid-cols-[1fr,1.4fr]">
              <div>
                <h3 className="font-display text-3xl font-black leading-tight">
                  Four steps, one link.
                </h3>
                <p className="mt-3 text-base text-muted-foreground">
                  No dashboard to learn. Everything happens in Discord, and the
                  page builds itself from data the bot already has.
                </p>
              </div>

              <div className="grid gap-2 text-sm">
                <StepRow n="1" title="Invite Beacon" desc="Four plain permissions. No privileged intents." />
                <StepRow n="2" title="Run /beacon setup" desc="Tagline, tags, and the channel your invite opens to." />
                <StepRow n="3" title="Run /beacon publish" desc="Listed in the directory under your tags, instantly." />
                <StepRow n="4" title="Share your link" desc="/beacon stats shows views, join clicks, and rank." />
              </div>
            </div>
          </ProductWindow>
        </Reveal>
      </section>

      {/* ── What it does ──────────────────────────────────────────────────── */}
      <SectionWithMockup
        accent={MOCK_AMBER}
        title={
          <>
            Get found.
            <br />
            Stay found.
          </>
        }
        description={
          <>
            Your page shows what a Discord invite never can: how many people are
            actually online, whether the server is growing, and what&apos;s
            happening this week. Visitors join a community they can see is alive,
            and every Monday Beacon tells you how many of them came from your
            page.
          </>
        }
        primaryMockup={<BeaconPageMock />}
        secondaryMockup={<BeaconRankMock />}
      />

      {/* ── Self-host ─────────────────────────────────────────────────────── */}
      <section className="px-6 py-24">
        <Reveal className="mx-auto max-w-5xl">
          <ProductWindow name="beacon / self-host">
            <div className="grid gap-8 bg-card p-6 sm:p-8 md:grid-cols-[1fr,1.2fr]">
              <div>
                <SectionLabel tone="outline">Open source</SectionLabel>
                <h3 className="mt-5 font-display text-3xl font-black leading-tight">
                  Run your own directory.
                </h3>
                <p className="mt-3 text-base text-muted-foreground">
                  The hosted instance is run by GuildLabs. Self-hosters get the
                  identical product with their own listings — nothing phones home.
                </p>
                <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                  {[
                    "One process: the bot and the web pages together",
                    "One folder to back up — SQLite plus banners",
                    "MIT licensed, Node 22, no native dependencies",
                  ].map((line) => (
                    <li key={line} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0" style={{ color: ACCENT }} />
                      {line}
                    </li>
                  ))}
                </ul>
                <a href={REPO_URL} target="_blank" rel="noreferrer" className="mt-6 inline-block">
                  <Button variant="outline">
                    <GithubIcon className="size-4" /> View on GitHub
                  </Button>
                </a>
              </div>

              <TerminalBlock />
            </div>
          </ProductWindow>
        </Reveal>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="px-6 pb-32 text-center">
        <Reveal className="mx-auto max-w-2xl">
          <Radar className="mx-auto size-8" style={{ color: ACCENT }} />
          <h2 className="mt-5 font-display text-4xl font-black leading-tight tracking-tight text-balance sm:text-5xl">
            Get found <span style={{ color: ACCENT }}>the honest way.</span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            A live page, a fair ranking, and a weekly note on where your members
            came from. One command to start.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {hasInvite ? (
              <a href={INVITE_URL} target="_blank" rel="noreferrer">
                <Button size="lg">
                  <DiscordIcon className="size-5" color="currentColor" /> Add Beacon to Discord
                </Button>
              </a>
            ) : (
              <a href={REPO_URL} target="_blank" rel="noreferrer">
                <Button size="lg">
                  <Container className="size-5" /> Self-host Beacon
                </Button>
              </a>
            )}
            <a href={REPO_URL} target="_blank" rel="noreferrer">
              <Button variant="outline" size="lg">
                <GithubIcon className="size-5" /> View source
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
function ProductWindow({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border-2 border-card-border bg-card shadow-[var(--elevation-3)]">
      <div className="flex items-center gap-1.5 border-b-2 border-card-border/60 bg-background-deep/40 px-5 py-3">
        <span className="size-2.5 rounded-full bg-coral/70" />
        <span className="size-2.5 rounded-full bg-accent/70" />
        <span className="size-2.5 rounded-full bg-primary/60" />
        <span className="ml-2 truncate font-mono text-xs text-muted-foreground">guildlabs / {name}</span>
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

/** The Docker one-liner, styled as a terminal. */
function TerminalBlock() {
  return (
    <div className="overflow-hidden rounded-2xl bg-[#0a0a0c] text-[13px] leading-relaxed">
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5 font-mono text-[11px] text-white/40">
        <Terminal className="size-3.5" />
        self-host
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-white/80">
        <code>
          <span className="text-white/35">$ </span>cp .env.example .env{"\n"}
          <span className="text-white/35">$ </span>
          <span style={{ color: MOCK_AMBER }}>{DOCKER_CMD}</span>
          {"\n\n"}
          <span className="text-white/35">→ </span>beacon online as Beacon#0001{"\n"}
          <span className="text-white/35">→ </span>web listening on :8080
        </code>
      </pre>
    </div>
  );
}

// ── Mocks ───────────────────────────────────────────────────────────────────

const DEMO_SERVERS = [
  { id: "a", name: "Stretch Trading", online: 310, members: "2.4k", tag: "Trading" },
  { id: "b", name: "Balkan Rush RP", online: 460, members: "5.1k", tag: "Roleplay" },
  { id: "c", name: "Polyglot Café", online: 60, members: "330", tag: "Languages" },
  { id: "you", name: "Indie Game Devs", online: 140, members: "820", tag: "Programming", you: true },
];

/** Hero mock: a directory where "your" server climbs the ranking. Loops. */
function BeaconDirectoryDemo() {
  const reduce = useReducedMotion();
  const [stage, setStage] = React.useState(reduce ? 3 : 0);
  React.useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setStage((s) => (s + 1) % 5), 1100);
    return () => clearInterval(id);
  }, [reduce]);

  // Stage 0..3 moves "you" from 4th to 1st; stage 4 holds, then it resets.
  const position = Math.min(3, stage);
  const others = DEMO_SERVERS.filter((s) => !s.you);
  const you = DEMO_SERVERS.find((s) => s.you)!;
  const ordered = [...others];
  ordered.splice(3 - position, 0, you);
  const online = 140 + position * 23;

  return (
    <div className="bg-[#0a0a0c] p-4">
      <div className="flex items-center gap-2 text-[11px] text-white/50">
        <Radar className="size-3.5" style={{ color: MOCK_AMBER }} />
        <span className="font-mono">servers / programming</span>
        <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] text-white/40">
          <span className="size-1.5 rounded-full" style={{ background: MOCK_AMBER }} />
          ranked by activity
        </span>
      </div>

      <div className="mt-4 space-y-1.5">
        {ordered.map((s, i) => (
          <motion.div
            key={s.id}
            layout
            transition={{ duration: 0.45, ease: EASE_EXPO }}
            className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs"
            style={{
              background: s.you ? MOCK_SOFT : "rgba(255,255,255,0.04)",
              color: s.you ? MOCK_AMBER : "rgba(255,255,255,0.7)",
            }}
          >
            <span className="w-4 font-mono text-[10px] text-white/35">#{i + 1}</span>
            <span className="grid size-6 shrink-0 place-items-center rounded-md bg-white/10 text-[10px] font-bold text-white/80">
              {s.name.slice(0, 1)}
            </span>
            <span className="truncate font-semibold">{s.name}</span>
            <span className="ml-auto flex shrink-0 items-center gap-1 font-mono text-[10px] text-white/45">
              <span className="size-1.5 rounded-full" style={{ background: MOCK_UP }} />
              {s.you ? online : s.online} online
            </span>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-1.5 font-mono text-[10px] text-white/40">
        <span>41 servers · no bump command</span>
        {position === 3 ? (
          <span className="inline-flex items-center gap-1" style={{ color: MOCK_AMBER }}>
            <Check className="size-3" /> #1 in Programming
          </span>
        ) : (
          <span>climbing…</span>
        )}
      </div>
    </div>
  );
}

/** Band mock: the server page itself — counters tick, the growth line draws. */
function BeaconPageMock() {
  const reduce = useReducedMotion();
  const [tick, setTick] = React.useState(reduce ? 12 : 0);
  React.useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setTick((t) => (t + 1) % 16), 600);
    return () => clearInterval(id);
  }, [reduce]);
  const members = 820 + Math.min(tick, 12);
  const online = 140 + (tick % 4);
  const path = "M0,40 L20,36 L40,37 L60,30 L80,28 L100,22 L120,20 L140,14 L160,12 L180,8 L200,6 L220,4";

  return (
    <div className="bg-[#313338]">
      <div className="flex items-center gap-1.5 bg-[#1e1f22] px-3 py-2">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-1.5 font-mono text-[11px] text-white/40">beacon.guildlabs.fun/s/indie-devs</span>
      </div>
      <div className="p-4">
        <div className="h-12 rounded-md" style={{ background: "linear-gradient(135deg, #6366f1, #1e1b4b)" }} />
        <div className="-mt-5 flex items-end gap-2.5 px-1">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl border-[3px] border-[#313338] bg-[#2b2d31] text-xs font-bold text-white">
            IG
          </span>
          <div className="min-w-0 truncate pb-px text-sm font-bold text-white">Indie Game Devs</div>
        </div>
        <div className="mt-1 truncate px-1 text-[11px] text-white/50">Share progress, playtest builds, ship together.</div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {["Programming", "Gaming", "Design"].map((t) => (
            <span key={t} className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/80">
              {t}
            </span>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          <Stat icon={Users} value={String(members)} label="members" />
          <Stat icon={Activity} value={String(online)} label="online" live />
          <Stat icon={CalendarDays} value="2" label="events" />
        </div>

        <div className="mt-3 rounded-md bg-[#2b2d31] p-2.5" style={{ borderLeft: `3px solid ${MOCK_AMBER}` }}>
          <div className="flex items-center justify-between text-[10px] text-white/45">
            <span>Members, last 30 days</span>
            <span className="inline-flex items-center gap-1 font-semibold" style={{ color: MOCK_UP }}>
              <TrendingUp className="size-3" /> +12
            </span>
          </div>
          <svg viewBox="0 0 220 44" className="mt-1.5 h-10 w-full" preserveAspectRatio="none" aria-hidden>
            <motion.path
              d={`${path} L220,44 L0,44 Z`}
              fill={MOCK_AMBER}
              initial={false}
              animate={{ opacity: tick >= 12 || reduce ? 0.14 : 0.06 }}
              transition={{ duration: 0.6 }}
            />
            <motion.path
              d={path}
              fill="none"
              stroke={MOCK_AMBER}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={false}
              animate={{ pathLength: reduce ? 1 : Math.min(1, tick / 12) }}
              transition={{ duration: 0.5, ease: "linear" }}
            />
          </svg>
        </div>

        <div
          className="mt-3 rounded-md py-2 text-center text-xs font-bold"
          style={{ background: MOCK_AMBER, color: "#1a1200" }}
        >
          Join server
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
  live = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
  live?: boolean;
}) {
  return (
    <div className="rounded-md bg-[#2b2d31] px-2 py-1.5">
      <div className="flex items-center gap-1 text-[10px] text-white/45">
        {live ? <span className="size-1.5 rounded-full" style={{ background: MOCK_UP }} /> : <Icon className="size-3" />}
        {label}
      </div>
      <div className="font-mono text-sm font-bold text-white">{value}</div>
    </div>
  );
}

/** Band secondary mock: the rank card that sits behind the page. */
function BeaconRankMock() {
  return (
    <div className="bg-[#313338]">
      <div className="flex items-center gap-1.5 bg-[#1e1f22] px-3 py-2">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-1.5 font-mono text-[11px] text-white/40">#general</span>
      </div>
      <div className="p-4">
        <div className="rounded-md bg-[#2b2d31] p-3" style={{ borderLeft: `3px solid ${MOCK_AMBER}` }}>
          <div className="text-xs font-bold text-white">This week on Beacon — Indie Game Devs</div>
          <div className="mt-1.5 space-y-0.5 text-[11px] text-[#dbdee1]">
            <div>
              <strong>142</strong> page views
            </div>
            <div>
              <strong>23</strong> join clicks
            </div>
            <div>
              <strong style={{ color: MOCK_UP }}>+12</strong> members
            </div>
            <div>
              Ranked <strong>#1</strong> of 41 in Programming
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
