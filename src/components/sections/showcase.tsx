"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { GSAP_EASE } from "@/lib/motion";
import {
  Hash,
  Volume2,
  Check,
  ShieldCheck,
  Users,
  Sparkles,
  ArrowRight,
  Megaphone,
  MessageSquare,
  Gamepad2,
  Headphones,
  Crown,
} from "lucide-react";
import { DiscordIcon } from "@/components/icons/discord";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// ────────────────────────────────────────────────────────────────────────────
// Helper: cycle hook — returns an integer that increments every `ms`
// ────────────────────────────────────────────────────────────────────────────
function useCycle(ms: number, max: number) {
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % max), ms);
    return () => clearInterval(id);
  }, [ms, max]);
  return i;
}

// ────────────────────────────────────────────────────────────────────────────
// Eyebrow label — small mono tag in a vivid color (matches reference style)
// ────────────────────────────────────────────────────────────────────────────
function Eyebrow({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      className="font-mono text-xs font-semibold uppercase tracking-[0.18em]"
      style={{ color }}
    >
      {children}
    </span>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────────────────────────────────────
export function Showcase() {
  const storyRef = React.useRef<HTMLDivElement>(null);
  const railRef = React.useRef<HTMLDivElement>(null);

  // Scroll-driven storytelling: a blueprint "spine" draws down the middle as
  // you scroll, demo panels float in 3D with a scrubbed parallax, copy rises
  // in once. Desktop gets the scrub; mobile gets cheap once-reveals; reduced
  // motion gets nothing (content is in the server HTML either way).
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        {
          desktop: "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
          mobile: "(max-width: 1023px) and (prefers-reduced-motion: no-preference)",
        },
        (ctx) => {
          const desktop = !!ctx.conditions?.desktop;
          const blocks = gsap.utils.toArray<HTMLElement>("[data-story-block]", storyRef.current);

          blocks.forEach((block) => {
            const demo = block.querySelector<HTMLElement>("[data-story-demo]");
            const copy = block.querySelector<HTMLElement>("[data-story-copy]");
            if (copy) {
              gsap.from(copy, {
                y: 36,
                opacity: 0,
                duration: 0.7,
                ease: GSAP_EASE,
                scrollTrigger: { trigger: block, start: "top 78%", once: true },
              });
            }
            if (!demo) return;
            if (desktop) {
              // scrubbed 3D drift — the panel tips upright as it crosses the viewport
              gsap.fromTo(
                demo,
                { y: 90, rotateX: 9, transformPerspective: 1000 },
                {
                  y: -50,
                  rotateX: 0,
                  ease: "none",
                  scrollTrigger: { trigger: block, start: "top bottom", end: "bottom top", scrub: 0.6 },
                }
              );
            } else {
              gsap.from(demo, {
                y: 28,
                opacity: 0,
                duration: 0.6,
                ease: GSAP_EASE,
                scrollTrigger: { trigger: block, start: "top 82%", once: true },
              });
            }
          });

          // blueprint spine draws with scroll (desktop only — it runs through
          // the center gap of the two-column blocks)
          if (desktop && railRef.current) {
            gsap.fromTo(
              railRef.current,
              { scaleY: 0 },
              {
                scaleY: 1,
                ease: "none",
                scrollTrigger: {
                  // the spine's own wrapper (the two 2-col beats), not the
                  // whole story — the features grid below has no center gap
                  trigger: railRef.current.parentElement,
                  start: "top 70%",
                  end: "bottom 80%",
                  scrub: 0.4,
                },
              }
            );
          }
        }
      );
      return () => mm.revert();
    },
    { scope: storyRef }
  );

  return (
    <section className="relative overflow-hidden bg-background py-28 text-foreground">
      <BackgroundGrid />

      <div className="relative mx-auto max-w-6xl px-4">
        {/* ── Section heading ───────────────────────────────────────────────── */}
        <div className="mb-24 max-w-3xl">
          <Eyebrow color="#a78bfa">See it in motion</Eyebrow>
          <h2 className="mt-4 font-display text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl">
            Watch a server{" "}
            <span className="text-muted-foreground">come together.</span>
          </h2>
        </div>

        <div ref={storyRef}>
          {/* the two 2-column story beats share a blueprint spine down the
              center gap — it draws in as the story scrolls */}
          <div className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 lg:block"
            >
              <div
                ref={railRef}
                className="h-full w-full origin-top"
                style={{
                  background:
                    "linear-gradient(to bottom, var(--primary), var(--accent) 55%, var(--coral))",
                  boxShadow: "0 0 12px 1px color-mix(in oklab, var(--primary) 35%, transparent)",
                }}
              />
            </div>
            <div className="space-y-32">
              <InviteBlock />
              <DeployBlock />
            </div>
          </div>
          <div className="mt-32">
            <FeaturesBlock />
          </div>
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Block 1: ADD THE BOT
// ────────────────────────────────────────────────────────────────────────────
function InviteBlock() {
  return (
    <div data-story-block className="grid items-center gap-12 lg:grid-cols-2">
      <div data-story-copy>
        <Eyebrow color="#a78bfa">01 — One-click invite</Eyebrow>
        <h3 className="mt-4 font-display text-4xl font-black leading-tight tracking-tight text-foreground">
          Add GuildLabs to your server in 10 seconds.
        </h3>
        <p className="mt-4 max-w-md text-muted-foreground">
          Sign in with Discord, pick the server, GuildLabs joins with Administrator. No bot tokens.
          No copy-pasting into a terminal. No reading docs.
        </p>
        <ul className="mt-6 space-y-2.5 text-sm text-foreground/85">
          {["Built-in OAuth2 invite", "Granular permission preview", "Per-guild config saved automatically"].map((line) => (
            <li key={line} className="flex items-center gap-2.5">
              <span className="grid size-5 place-items-center rounded-full bg-[#a78bfa]/15 text-[#7c5cf2] dark:text-[#c4b5fd]">
                <Check className="size-3" strokeWidth={3} />
              </span>
              {line}
            </li>
          ))}
        </ul>
      </div>
      <InviteDemo />
    </div>
  );
}

function InviteDemo() {
  // 4 stages, ~2.4s each
  const stage = useCycle(2400, 4);

  return (
    <div data-story-demo className="relative will-change-transform">
      <div className="rounded-3xl border border-white/10 bg-[#1a1c24] p-6 shadow-[0_30px_80px_-30px_rgba(167,139,250,0.45)]">
        {/* Mock Discord OAuth permissions card */}
        <div className="rounded-2xl border border-white/5 bg-black/40 p-5">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl bg-[#5865F2]">
              <DiscordIcon className="size-6" color="white" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-white/40">External app</div>
              <div className="font-display text-lg font-bold">GuildLabs</div>
            </div>
          </div>

          <div className="mt-4 text-sm text-white/70">
            Add to server <span className="font-mono text-white">Aurora HQ</span>
          </div>

          {/* Permission rows */}
          <ul className="mt-3 space-y-1.5 text-xs">
            {["Manage Roles", "Manage Channels", "Kick / Ban Members", "Send Messages"].map((perm, i) => (
              <motion.li
                key={perm}
                className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-1.5 text-white/70"
                initial={false}
                animate={{
                  opacity: stage >= 1 ? 1 : 0.35,
                  x: stage >= 1 ? 0 : -6,
                }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
              >
                <motion.span
                  initial={false}
                  animate={{
                    backgroundColor: stage >= 2 ? "#22c55e33" : "transparent",
                    color: stage >= 2 ? "#86efac" : "#a3a3a3",
                  }}
                  className="grid size-4 place-items-center rounded-full"
                >
                  <Check className="size-2.5" strokeWidth={4} />
                </motion.span>
                {perm}
              </motion.li>
            ))}
          </ul>

          {/* Authorize button */}
          <motion.button
            initial={false}
            animate={{
              backgroundColor:
                stage >= 3 ? "#22c55e" : stage >= 2 ? "#5865F2" : "#3a3f55",
              boxShadow: stage === 2 ? "0 0 0 4px rgba(88,101,242,0.25)" : "0 0 0 0 rgba(0,0,0,0)",
            }}
            transition={{ duration: 0.4 }}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white"
          >
            <AnimatePresence mode="wait">
              {stage < 3 ? (
                <motion.span key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  Authorize
                </motion.span>
              ) : (
                <motion.span
                  key="done"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2"
                >
                  <Check className="size-4" strokeWidth={3} /> Bot joined
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Bottom: a tiny status line */}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2 text-xs text-white/55">
          <span className="flex items-center gap-1.5">
            <motion.span
              className="size-2 rounded-full"
              animate={{ backgroundColor: stage >= 3 ? "#22c55e" : "#fbbf24" }}
            />
            {stage >= 3 ? "Online — Construct#8110" : "Connecting…"}
          </span>
          <span className="font-mono">{stage >= 3 ? "0 errors" : "checking perms"}</span>
        </div>
      </div>

      {/* Floating step indicator */}
      <div className="absolute -bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/10 bg-[#0a0a0c] px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest">
        {["sign in", "select", "authorize", "ready"].map((s, i) => (
          <React.Fragment key={s}>
            <span
              className={`transition-colors ${
                stage === i ? "text-white" : stage > i ? "text-[#86efac]" : "text-white/30"
              }`}
            >
              {s}
            </span>
            {i < 3 && <ArrowRight className="size-2.5 text-white/20" />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Block 2: DEPLOY A BLUEPRINT
// ────────────────────────────────────────────────────────────────────────────

const BLUEPRINT_CATS = [
  {
    name: "Information",
    icon: Megaphone,
    channels: [
      { type: "text", name: "rules" },
      { type: "text", name: "announcements" },
      { type: "text", name: "welcome" },
    ],
  },
  {
    name: "Community",
    icon: MessageSquare,
    channels: [
      { type: "text", name: "general" },
      { type: "text", name: "off-topic" },
      { type: "text", name: "memes" },
    ],
  },
  {
    name: "Gaming",
    icon: Gamepad2,
    channels: [
      { type: "text", name: "lfg" },
      { type: "text", name: "clips" },
    ],
  },
  {
    name: "Voice",
    icon: Headphones,
    channels: [
      { type: "voice", name: "Lounge" },
      { type: "voice", name: "Gaming Room" },
    ],
  },
];

function DeployBlock() {
  return (
    <div data-story-block className="grid items-center gap-12 lg:grid-cols-2">
      <DeployDemo />
      <div data-story-copy className="lg:order-first">
        <Eyebrow color="#10b981">02 — Blueprint deployment</Eyebrow>
        <h3 className="mt-4 font-display text-4xl font-black leading-tight tracking-tight text-foreground">
          From JSON to live server in seconds.
        </h3>
        <p className="mt-4 max-w-md text-muted-foreground">
          Run <code className="rounded-md bg-foreground/[0.08] px-1.5 py-0.5 font-mono text-sm text-foreground">/setup</code> with
          your blueprint. GuildLabs creates roles, categories and channels with the right permission
          overwrites — no clicking through Server Settings, ever.
        </p>
        <ul className="mt-6 space-y-2.5 text-sm text-foreground/85">
          {[
            "Atomic deploys — skips items that already exist",
            "Permission overwrites per channel + per role",
            "Real-time progress in the Discord reply",
          ].map((line) => (
            <li key={line} className="flex items-center gap-2.5">
              <span className="grid size-5 place-items-center rounded-full bg-[#10b981]/15 text-[#10b981] dark:text-[#86efac]">
                <Check className="size-3" strokeWidth={3} />
              </span>
              {line}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function DeployDemo() {
  // Each cycle has 7 stages: idle + 4 categories + done + reset
  const stage = useCycle(900, 7);
  const channelsRevealed = stage; // 0..6

  return (
    <div
      data-story-demo
      className="relative rounded-3xl border border-white/10 bg-[#1a1c24] p-3 shadow-[0_30px_80px_-30px_rgba(134,239,172,0.35)] will-change-transform"
    >
      <div className="flex h-[26rem] overflow-hidden rounded-2xl bg-[#0a0a0c]">
        {/* Mock Discord channel sidebar */}
        <div className="flex w-full flex-col">
          {/* Server header */}
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
            <span className="font-display font-bold">Aurora HQ</span>
            <span className="font-mono text-[10px] text-white/40">
              {channelsRevealed >= 6 ? "DEPLOYED" : "DEPLOYING…"}
            </span>
          </div>

          {/* Channel tree */}
          <div className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
            <AnimatePresence>
              {BLUEPRINT_CATS.map((cat, ci) => {
                const visible = channelsRevealed > ci;
                if (!visible) return null;
                const CatIcon = cat.icon;
                return (
                  <motion.div
                    key={cat.name}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-0.5"
                  >
                    <div className="flex items-center gap-1.5 px-2 pt-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                      <CatIcon className="size-3" />
                      {cat.name}
                    </div>
                    <motion.div
                      initial="hidden"
                      animate="show"
                      variants={{ show: { transition: { staggerChildren: 0.06 } } }}
                    >
                      {cat.channels.map((ch) => {
                        const Icon = ch.type === "voice" ? Volume2 : Hash;
                        return (
                          <motion.div
                            key={ch.name}
                            variants={{
                              hidden: { opacity: 0, x: -8 },
                              show: { opacity: 1, x: 0 },
                            }}
                            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-white/70 hover:bg-white/[0.04]"
                          >
                            <Icon className="size-3.5 text-white/40" />
                            {ch.name}
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Success toast */}
          <AnimatePresence>
            {channelsRevealed >= 5 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="m-3 flex items-center gap-3 rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/10 p-3"
              >
                <div className="grid size-8 place-items-center rounded-full bg-[#22c55e]">
                  <Check className="size-4 text-black" strokeWidth={3} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-[#86efac]">Blueprint deployed</div>
                  <div className="text-xs text-white/60">
                    7 roles · 4 categories · 10 channels · skipped 0
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Block 3: FEATURES GRID
// ────────────────────────────────────────────────────────────────────────────
function FeaturesBlock() {
  return (
    <div data-story-block>
      <div data-story-copy className="mb-12 max-w-2xl">
        <Eyebrow color="#6366f1">03 — Features that run themselves</Eyebrow>
        <h3 className="mt-4 font-display text-4xl font-black leading-tight tracking-tight text-foreground">
          Five powerful features. Zero external services.
        </h3>
        <p className="mt-4 text-muted-foreground">
          Welcome, verification, anti-raid, leveling, tickets. Configure each from Discord or the dashboard —
          they run on your bot, with your data, in your server.
        </p>
      </div>

      <div data-story-demo className="grid gap-5 will-change-transform md:grid-cols-3">
        <FeatureCard
          title="Welcome flow"
          desc="Every new member gets a custom embed with placeholders like {user} and {server}."
          colorLight="#059669"
          colorDark="#86efac"
        >
          <WelcomeDemo />
        </FeatureCard>

        <FeatureCard
          title="Verification gate"
          desc="Members click a button, receive your verify role, and gain access to the server."
          colorLight="#4f46e5"
          colorDark="#a8b1ff"
        >
          <VerifyDemo />
        </FeatureCard>

        <FeatureCard
          title="XP leveling"
          desc="15-25 XP per message. Auto-announced. /rank shows a live progress bar. /leaderboard ranks everyone."
          colorLight="#b45309"
          colorDark="#fde68a"
        >
          <LevelDemo />
        </FeatureCard>
      </div>
    </div>
  );
}

function FeatureCard({
  title,
  desc,
  colorLight,
  colorDark,
  children,
}: {
  title: string;
  desc: string;
  colorLight: string;
  colorDark: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col rounded-3xl border border-card-border bg-card p-6"
      style={
        {
          "--accent-light": colorLight,
          "--accent-dark": colorDark,
        } as React.CSSProperties
      }
    >
      <h4 className="font-display text-2xl font-black text-[var(--accent-light)] dark:text-[var(--accent-dark)]">
        {title}
      </h4>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
      <div className="mt-6 flex-1">{children}</div>
    </div>
  );
}

// ── Welcome demo ────────────────────────────────────────────────────────────
function WelcomeDemo() {
  const stage = useCycle(2200, 3);
  return (
    <div className="rounded-2xl bg-[#0a0a0c] p-3">
      <AnimatePresence mode="wait">
        {stage === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid h-32 place-items-center text-xs text-white/30"
          >
            #welcome — waiting…
          </motion.div>
        ) : (
          <motion.div
            key="msg"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2 text-xs text-white/50">
              <Users className="size-3.5 text-[#86efac]" />
              <span className="text-[#86efac]">TheLazyDev</span> joined the server.
            </div>
            <div className="rounded-xl border-l-2 border-[#5865F2] bg-white/[0.03] p-3">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-full bg-gradient-to-br from-[#5865F2] to-[#a78bfa]" />
                <span className="text-sm font-bold">GuildLabs</span>
                <span className="text-[10px] text-white/30">BOT</span>
              </div>
              <p className="mt-2 text-sm text-white/80">
                Welcome to <strong>Aurora HQ</strong>, @TheLazyDev! 🎉
              </p>
              <div className="mt-2 text-[10px] text-white/40">Member #248 · just now</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Verify demo ─────────────────────────────────────────────────────────────
function VerifyDemo() {
  const stage = useCycle(2200, 3);
  const verified = stage >= 2;
  return (
    <div className="rounded-2xl bg-[#0a0a0c] p-3">
      <div className="space-y-2">
        <div className="rounded-xl border-l-2 border-[#5865F2] bg-white/[0.03] p-3">
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <ShieldCheck className="size-3.5 text-[#a8b1ff]" />
            Verify to enter
          </div>
          <p className="mt-1 text-xs text-white/60">Click below to confirm you&apos;re human.</p>
          <motion.button
            animate={{
              backgroundColor: verified ? "#22c55e" : "#5865F2",
              scale: stage === 1 ? 0.96 : 1,
            }}
            transition={{ duration: 0.25 }}
            className="mt-2 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold text-white"
          >
            <AnimatePresence mode="wait">
              {verified ? (
                <motion.span
                  key="done"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1.5"
                >
                  <Check className="size-3.5" strokeWidth={3} /> Verified
                </motion.span>
              ) : (
                <motion.span
                  key="verify"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1.5"
                >
                  <ShieldCheck className="size-3.5" /> Verify Me
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        <AnimatePresence>
          {verified && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 rounded-xl bg-[#22c55e]/10 px-3 py-2 text-xs text-[#86efac]"
            >
              <span className="rounded-full bg-[#a8b1ff]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#a8b1ff]">
                @verified
              </span>
              role granted
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Leveling demo ───────────────────────────────────────────────────────────
function LevelDemo() {
  const cycle = useCycle(120, 60); // 0..59
  const progress = cycle / 59; // 0..1
  const level = Math.floor(progress * 4) + 1;
  const justLevelled = cycle % 15 < 3 && cycle > 5;

  return (
    <div className="rounded-2xl bg-[#0a0a0c] p-3">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-gradient-to-br from-[#fde68a] to-[#f59e0b]" />
          <div>
            <div className="text-sm font-bold">Alex</div>
            <div className="text-[10px] text-white/40">Rank #1</div>
          </div>
        </div>
        <motion.div
          animate={{ scale: justLevelled ? [1, 1.1, 1] : 1 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-1 rounded-full bg-[#fde68a]/15 px-2 py-1 font-mono text-[10px] font-bold text-[#fde68a]"
        >
          <Crown className="size-3" />
          LVL {level}
        </motion.div>
      </div>

      {/* progress bar */}
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
        <motion.div
          className="h-full bg-gradient-to-r from-[#fde68a] to-[#f59e0b]"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-white/40">
        <span>{Math.floor(progress * 400)} XP</span>
        <span>400 to next</span>
      </div>

      <AnimatePresence>
        {justLevelled && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-3 flex items-center gap-2 rounded-xl bg-[#fde68a]/10 px-3 py-2 text-xs text-[#fde68a]"
          >
            <Sparkles className="size-3.5" />
            Level up! Welcome to <strong>Level {level}</strong>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Decorative background grid
// ────────────────────────────────────────────────────────────────────────────
function BackgroundGrid() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 text-foreground/10"
      style={{
        backgroundImage:
          "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
        backgroundSize: "64px 64px",
        maskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black, transparent)",
        WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black, transparent)",
      }}
    />
  );
}
