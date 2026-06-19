"use client";

/**
 * "Which Discord server should you build?" — an immersive, liquid-glass quiz.
 * Each answer carries weighted votes toward template slugs; we tally, pick the
 * winner, and hand a prefilled description into Construct (sessionStorage →
 * /#builder) so the user lands in the AI builder ready to generate.
 *
 * Design: immersive/interactive pattern + liquid glass. An aurora backdrop
 * shifts hue per question, transitions are spring-physics and directional,
 * options stagger in, and the result reveals with a match-strength ring +
 * confetti. Brand fonts/tokens kept for consistency. Reduced-motion safe.
 */

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMediaQuery } from "@/lib/use-media-query";
import { ArrowLeft, ArrowRight, Hash, RotateCcw, Shield, Sparkles, Users, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GuildLabsLogo } from "@/components/logo";
import { TEMPLATES, getTemplate, type ServerTemplate } from "@/lib/seo-data/templates";
import { TemplateIconBadge } from "@/components/templates/template-icon";
import { Confetti } from "@/components/construct-ai/magic";

type Weight = Partial<Record<string, number>>;
type Option = { label: string; emoji: string; weights: Weight };
/** `accent` is a brand CSS var that tints the backdrop + interactions. */
type Question = { q: string; sub: string; accent: string; options: Option[] };

const QUESTIONS: Question[] = [
  {
    q: "What's your community really about?",
    sub: "Pick the closest — we'll fine-tune from here.",
    accent: "var(--primary)",
    options: [
      { label: "Gaming & playing together", emoji: "🎮", weights: { "gaming-server": 3, "roleplay-server": 1 } },
      { label: "Crypto, trading & markets", emoji: "📈", weights: { "crypto-community": 3, "nft-community": 2 } },
      { label: "Learning & getting help", emoji: "📚", weights: { "study-group": 3, "developer-server": 1, "book-club": 1 } },
      { label: "Art, music & creativity", emoji: "🎨", weights: { "art-community": 3, "music-server": 2, "anime-server": 1 } },
      { label: "Building a product or business", emoji: "🚀", weights: { "startup-community": 3, "business-server": 2, "developer-server": 1 } },
    ],
  },
  {
    q: "What will members mostly do?",
    sub: "How the room actually spends its time.",
    accent: "var(--coral)",
    options: [
      { label: "Team up & coordinate", emoji: "🤝", weights: { "gaming-server": 2, "roleplay-server": 2 } },
      { label: "Share & critique work", emoji: "🖼️", weights: { "art-community": 2, "music-server": 2, "developer-server": 1 } },
      { label: "Analyze & trade", emoji: "💹", weights: { "crypto-community": 3, "nft-community": 2 } },
      { label: "Hang out & chat", emoji: "💬", weights: { "anime-server": 2, "music-server": 1, "book-club": 2 } },
      { label: "Grow & ship together", emoji: "📦", weights: { "startup-community": 2, "business-server": 2, "developer-server": 1 } },
    ],
  },
  {
    q: "Pick the vibe you want.",
    sub: "The energy people feel when they join.",
    accent: "var(--accent)",
    options: [
      { label: "High-energy & playful", emoji: "⚡", weights: { "gaming-server": 2, "anime-server": 2, "roleplay-server": 1 } },
      { label: "Focused & serious", emoji: "🎯", weights: { "study-group": 2, "business-server": 2, "developer-server": 1 } },
      { label: "Warm & supportive", emoji: "🫶", weights: { "art-community": 2, "book-club": 2, "music-server": 1 } },
      { label: "Fast & data-driven", emoji: "📊", weights: { "crypto-community": 2, "nft-community": 1, "startup-community": 2 } },
    ],
  },
  {
    q: "How big do you expect it to get?",
    sub: "We'll size the structure to match.",
    accent: "var(--secondary)",
    options: [
      { label: "Small & tight-knit", emoji: "🌱", weights: { "book-club": 2, "study-group": 1, "roleplay-server": 1 } },
      { label: "Steadily growing", emoji: "🌿", weights: { "art-community": 1, "music-server": 1, "developer-server": 1, "anime-server": 1 } },
      { label: "Big & busy", emoji: "🌳", weights: { "gaming-server": 2, "crypto-community": 1, "startup-community": 1, "business-server": 1 } },
    ],
  },
];

function buildPrefill(t: ServerTemplate): string {
  const roleNames = t.roles.slice(0, 4).map((r) => r.name).join(", ");
  return (
    `A ${t.name.toLowerCase()} for ${t.useCase.toLowerCase()}. ${t.description} ` +
    `Set up the key channels and roles (${roleNames}) with balanced moderation.`
  ).slice(0, 600);
}

// ── Animated aurora backdrop ──────────────────────────────────────────────────
function Aurora({ accent, reduce }: { accent: string; reduce: boolean | null }) {
  const blob = (cls: string, anim: Record<string, number[]>) => (
    <motion.div
      aria-hidden
      className={cls}
      style={{ background: `radial-gradient(circle at center, color-mix(in oklab, ${accent} 55%, transparent), transparent 68%)` }}
      animate={reduce ? undefined : anim}
      transition={{ duration: 18, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
    />
  );
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" style={{ transition: "background 700ms ease" }}>
      <div className="absolute inset-0 bg-background" />
      {blob("absolute -left-[10%] top-[-12%] h-[55vh] w-[55vh] rounded-full opacity-40 blur-3xl", { x: [0, 60, 0], y: [0, 40, 0] })}
      {blob("absolute right-[-10%] top-[18%] h-[60vh] w-[60vh] rounded-full opacity-30 blur-3xl", { x: [0, -50, 0], y: [0, 60, 0] })}
      {blob("absolute bottom-[-18%] left-[28%] h-[55vh] w-[55vh] rounded-full opacity-30 blur-3xl", { x: [0, 40, 0], y: [0, -40, 0] })}
      {/* faint grid for depth */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "34px 34px", color: "var(--foreground)" }}
      />
    </div>
  );
}

export function Quiz() {
  const reduce = useReducedMotion();
  const phone = useMediaQuery("(max-width: 768px)");
  const [step, setStep] = React.useState(0);
  const [picks, setPicks] = React.useState<number[]>([]);
  const [dir, setDir] = React.useState(1);

  const done = step >= QUESTIONS.length;
  const accent = done ? "var(--primary)" : QUESTIONS[step].accent;

  const result = React.useMemo(() => {
    if (!done) return null;
    const score: Record<string, number> = {};
    picks.forEach((optIdx, qi) => {
      const opt = QUESTIONS[qi].options[optIdx];
      if (!opt) return;
      for (const [slug, w] of Object.entries(opt.weights)) score[slug] = (score[slug] ?? 0) + (w ?? 0);
    });
    const ranked = Object.entries(score).sort((a, b) => b[1] - a[1]);
    const top = ranked[0]?.[0] ?? TEMPLATES[0].slug;
    const topScore = ranked[0]?.[1] ?? 1;
    const secondScore = ranked[1]?.[1] ?? 0;
    // Friendly confidence: how decisively the winner beat the runner-up.
    const strength = Math.max(72, Math.min(99, Math.round((topScore / (topScore + secondScore || 1)) * 100)));
    return {
      template: getTemplate(top)!,
      runnerUp: ranked[1] ? getTemplate(ranked[1][0]) : undefined,
      strength,
    };
  }, [done, picks]);

  const choose = React.useCallback(
    (optIdx: number) => {
      setDir(1);
      setPicks((p) => {
        const next = [...p];
        next[step] = optIdx;
        return next;
      });
      setStep((s) => s + 1);
    },
    [step]
  );

  function back() {
    setDir(-1);
    setStep((s) => Math.max(0, s - 1));
  }
  function restart() {
    setDir(-1);
    setPicks([]);
    setStep(0);
  }
  function buildIt(t: ServerTemplate) {
    try {
      sessionStorage.setItem("construct:describe", buildPrefill(t));
    } catch {
      /* sessionStorage unavailable — builder just starts blank */
    }
    window.location.href = "/#builder";
  }

  // Keyboard: press 1–5 to pick an option on the current question.
  React.useEffect(() => {
    if (done) return;
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= QUESTIONS[step].options.length) choose(n - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, done, choose]);

  const progress = done ? 100 : Math.round((step / QUESTIONS.length) * 100);
  const slide = (d: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, x: d * 60, filter: "blur(6px)" },
    animate: reduce ? { opacity: 1 } : { opacity: 1, x: 0, filter: "blur(0px)" },
    exit: reduce ? { opacity: 0 } : { opacity: 0, x: -d * 60, filter: "blur(6px)" },
  });

  return (
    <div className="grain relative min-h-dvh" style={{ ["--q-accent" as string]: accent }}>
      <Aurora accent={accent} reduce={reduce || phone} />
      <Confetti fire={done} />

      {/* Minimal top bar — home + skip escape (immersive-pattern best practice) */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-4 sm:px-6">
        <Link href="/" aria-label="GuildLabs home" className="flex min-h-11 items-center">
          <GuildLabsLogo className="h-8 w-auto" />
        </Link>
        <Link href="/#builder" className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
          Skip to builder →
        </Link>
      </div>

      <main className="relative flex min-h-dvh items-center justify-center px-5 py-20">
        <div className="w-full max-w-xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <span
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-widest"
              style={{ background: "color-mix(in oklab, var(--q-accent) 14%, transparent)", color: "var(--q-accent)" }}
            >
              <Sparkles className="size-3.5" /> 30-second quiz
            </span>
            <h1 className="mt-4 font-display text-3xl font-black tracking-tight sm:text-4xl">
              What server should <span className="hl">you</span> build?
            </h1>
          </div>

          {/* Progress: morphing segmented bar + live percent */}
          {!done && (
            <div className="mb-7">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>Question {step + 1} of {QUESTIONS.length}</span>
                <span className="tabular-nums" style={{ color: "var(--q-accent)" }}>{progress}%</span>
              </div>
              <div className="flex gap-1.5" aria-hidden>
                {QUESTIONS.map((_, i) => (
                  <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: i === step ? "var(--q-accent)" : "color-mix(in oklab, var(--q-accent) 70%, transparent)" }}
                      initial={false}
                      animate={{ width: i < step ? "100%" : i === step ? "100%" : "0%", opacity: i <= step ? 1 : 0 }}
                      transition={{ type: "spring", stiffness: 180, damping: 24 }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* The glass card */}
          <div className="glass-strong relative overflow-hidden rounded-[1.75rem] p-6 shadow-2xl sm:p-8" aria-live="polite">
            {/* accent sheen */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{ background: "linear-gradient(90deg, transparent, color-mix(in oklab, var(--q-accent) 70%, transparent), transparent)" }}
            />

            <AnimatePresence mode="wait" custom={dir}>
              {!done ? (
                <motion.div key={step} {...slide(dir)} transition={{ type: "spring", stiffness: 260, damping: 26 }}>
                  <h2 className="font-display text-2xl font-black leading-tight">{QUESTIONS[step].q}</h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">{QUESTIONS[step].sub}</p>

                  <div className="mt-6 space-y-2.5">
                    {QUESTIONS[step].options.map((opt, i) => (
                      <motion.button
                        key={opt.label}
                        onClick={() => choose(i)}
                        initial={reduce ? false : { opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: reduce ? 0 : 0.05 + i * 0.045, type: "spring", stiffness: 300, damping: 24 }}
                        whileHover={reduce ? undefined : { y: -2 }}
                        whileTap={reduce ? undefined : { scale: 0.98 }}
                        className="group/opt flex w-full items-center gap-3.5 rounded-2xl border border-card-border bg-card/40 p-3.5 text-left outline-none transition-colors hover:bg-[color-mix(in_oklab,var(--q-accent)_8%,transparent)] focus-visible:ring-2 focus-visible:ring-[var(--q-accent)] cursor-pointer"
                        style={{ ["--tw-ring-color" as string]: "var(--q-accent)" }}
                      >
                        <span
                          className="grid size-11 shrink-0 place-items-center rounded-xl text-xl transition-transform group-hover/opt:scale-110"
                          style={{ background: "color-mix(in oklab, var(--q-accent) 14%, transparent)" }}
                          aria-hidden
                        >
                          {opt.emoji}
                        </span>
                        <span className="flex-1 font-display font-bold leading-snug">{opt.label}</span>
                        <kbd className="hidden rounded-md border border-card-border bg-muted/60 px-1.5 py-0.5 font-mono text-[0.65rem] text-muted-foreground sm:block">
                          {i + 1}
                        </kbd>
                        <ArrowRight
                          className="size-4 shrink-0 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover/opt:translate-x-0 group-hover/opt:opacity-100"
                          style={{ color: "var(--q-accent)" }}
                        />
                      </motion.button>
                    ))}
                  </div>

                  {step > 0 && (
                    <button onClick={back} className="mt-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer">
                      <ArrowLeft className="size-4" /> Back
                    </button>
                  )}
                </motion.div>
              ) : (
                result && <ResultView result={result} reduce={reduce} onBuild={buildIt} onRestart={restart} />
              )}
            </AnimatePresence>
          </div>

          {!done && (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Tip: press <kbd className="rounded border border-card-border bg-muted/60 px-1 font-mono">1</kbd>–
              <kbd className="rounded border border-card-border bg-muted/60 px-1 font-mono">{QUESTIONS[step].options.length}</kbd> to choose
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Result ────────────────────────────────────────────────────────────────────
function ResultView({
  result,
  reduce,
  onBuild,
  onRestart,
}: {
  result: { template: ServerTemplate; runnerUp?: ServerTemplate; strength: number };
  reduce: boolean | null;
  onBuild: (t: ServerTemplate) => void;
  onRestart: () => void;
}) {
  const { template: t, runnerUp, strength } = result;
  const stats = [
    { icon: Hash, label: "Channels", value: `~${t.stats.avgChannels}` },
    { icon: Shield, label: "Roles", value: `~${t.stats.avgRoles}` },
    { icon: Users, label: "Typical size", value: t.stats.avgMembers },
  ];
  return (
    <motion.div
      key="result"
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
      className="text-center"
    >
      <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--q-accent)" }}>
        Your perfect match
      </p>

      <div className="relative mx-auto mt-5 w-fit">
        <MatchRing strength={strength} reduce={reduce} />
        <div className="absolute inset-0 grid place-items-center">
          <TemplateIconBadge slug={t.slug} size="lg" />
        </div>
      </div>

      <h2 className="mt-5 font-display text-3xl font-black">{t.name}</h2>
      <p className="mx-auto mt-2 max-w-md text-muted-foreground">{t.headline}</p>

      {/* What you'll get */}
      <div className="mt-6 grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-card-border bg-card/40 py-3">
            <s.icon className="mx-auto size-4 text-muted-foreground" />
            <div className="mt-1.5 font-display text-lg font-black tabular-nums leading-none">{s.value}</div>
            <div className="mt-1 text-[0.62rem] uppercase tracking-widest text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
        <Button size="lg" variant="primary" magnetic onClick={() => onBuild(t)} className="flex-1">
          <Wand2 className="size-5" /> Build this in Construct
        </Button>
        <Link href={`/templates/${t.slug}`} className="flex-1">
          <Button size="lg" variant="outline" className="w-full">
            Preview template <ArrowRight className="size-4" />
          </Button>
        </Link>
      </div>

      {runnerUp && (
        <p className="mt-5 text-sm text-muted-foreground">
          Runner-up:{" "}
          <Link href={`/templates/${runnerUp.slug}`} className="font-semibold text-foreground transition-colors hover:text-[var(--q-accent)]">
            {runnerUp.emoji} {runnerUp.name}
          </Link>
        </p>
      )}

      <button onClick={onRestart} className="mt-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer">
        <RotateCcw className="size-4" /> Retake quiz
      </button>
    </motion.div>
  );
}

// Circular match-strength ring around the template badge.
function MatchRing({ strength, reduce }: { strength: number; reduce: boolean | null }) {
  const R = 54;
  const C = 2 * Math.PI * R;
  const size = 128;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="color-mix(in oklab, var(--q-accent) 16%, transparent)" strokeWidth="6" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={R}
          fill="none"
          stroke="var(--q-accent)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={C}
          initial={reduce ? { strokeDashoffset: C * (1 - strength / 100) } : { strokeDashoffset: C }}
          animate={{ strokeDashoffset: C * (1 - strength / 100) }}
          transition={{ duration: reduce ? 0 : 1.1, ease: "easeOut", delay: 0.15 }}
        />
      </svg>
      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border border-card-border bg-background px-2 py-0.5 font-mono text-xs font-bold tabular-nums" style={{ color: "var(--q-accent)" }}>
        {strength}% match
      </span>
    </div>
  );
}
