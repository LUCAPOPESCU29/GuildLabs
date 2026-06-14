"use client";

/**
 * "Which Discord server should you build?" quiz. Each answer carries weighted
 * votes toward template slugs; we tally, pick the winner, and hand off a
 * prefilled description into Construct (sessionStorage → /#builder) so the user
 * lands in the AI builder ready to generate.
 */

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, RotateCcw, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TEMPLATES, getTemplate, type ServerTemplate } from "@/lib/seo-data/templates";
import { TemplateIconBadge } from "@/components/templates/template-icon";

type Weight = Partial<Record<string, number>>;
type Option = { label: string; emoji: string; weights: Weight };
type Question = { q: string; options: Option[] };

const QUESTIONS: Question[] = [
  {
    q: "What's your community really about?",
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
    options: [
      { label: "High-energy & playful", emoji: "⚡", weights: { "gaming-server": 2, "anime-server": 2, "roleplay-server": 1 } },
      { label: "Focused & serious", emoji: "🎯", weights: { "study-group": 2, "business-server": 2, "developer-server": 1 } },
      { label: "Warm & supportive", emoji: "🫶", weights: { "art-community": 2, "book-club": 2, "music-server": 1 } },
      { label: "Fast & data-driven", emoji: "📊", weights: { "crypto-community": 2, "nft-community": 1, "startup-community": 2 } },
    ],
  },
  {
    q: "How big do you expect it to get?",
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

export function Quiz() {
  const [step, setStep] = React.useState(0); // 0..QUESTIONS.length-1, then result
  const [picks, setPicks] = React.useState<number[]>([]);

  const done = step >= QUESTIONS.length;

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
    const runnerUp = ranked[1]?.[0];
    return { template: getTemplate(top)!, runnerUp: runnerUp ? getTemplate(runnerUp) : undefined };
  }, [done, picks]);

  function choose(optIdx: number) {
    setPicks((p) => {
      const next = [...p];
      next[step] = optIdx;
      return next;
    });
    setStep((s) => s + 1);
  }

  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  function restart() {
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

  return (
    <main className="relative min-h-screen px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-primary">
            <Sparkles className="size-3.5" /> 30-second quiz
          </span>
          <h1 className="mt-4 font-display text-4xl font-black tracking-tight sm:text-5xl">
            What Discord server should you build?
          </h1>
          <p className="mt-3 text-muted-foreground">
            Four quick questions. We&apos;ll match you to a template and set up the builder.
          </p>
        </div>

        {/* Progress */}
        {!done && (
          <div className="mt-8 flex items-center gap-2">
            {QUESTIONS.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
        )}

        <div className="mt-8">
          <AnimatePresence mode="wait">
            {!done ? (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25 }}
              >
                <h2 className="font-display text-2xl font-black">{QUESTIONS[step].q}</h2>
                <div className="mt-5 space-y-3">
                  {QUESTIONS[step].options.map((opt, i) => (
                    <button
                      key={opt.label}
                      onClick={() => choose(i)}
                      className="glass flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5 hover:bg-primary/5 hover:ring-2 hover:ring-primary/30 cursor-pointer"
                    >
                      <span className="text-2xl" aria-hidden>{opt.emoji}</span>
                      <span className="font-display font-bold">{opt.label}</span>
                      <ArrowRight className="ml-auto size-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
                {step > 0 && (
                  <button onClick={back} className="mt-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                    <ArrowLeft className="size-4" /> Back
                  </button>
                )}
              </motion.div>
            ) : (
              result && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 240, damping: 22 }}
                  className="text-center"
                >
                  <p className="text-sm font-semibold uppercase tracking-widest text-primary">Your match</p>
                  <div className="mt-4 flex justify-center">
                    <TemplateIconBadge slug={result.template.slug} size="lg" />
                  </div>
                  <h2 className="mt-4 font-display text-3xl font-black">{result.template.name}</h2>
                  <p className="mx-auto mt-2 max-w-md text-muted-foreground">{result.template.headline}</p>

                  <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
                    <Button size="lg" variant="primary" magnetic onClick={() => buildIt(result.template)}>
                      <Wand2 className="size-5" /> Build this in Construct
                    </Button>
                    <Link href={`/templates/${result.template.slug}`}>
                      <Button size="lg" variant="outline" className="w-full">
                        View template <ArrowRight className="size-4" />
                      </Button>
                    </Link>
                  </div>

                  {result.runnerUp && (
                    <p className="mt-6 text-sm text-muted-foreground">
                      Also a good fit:{" "}
                      <Link href={`/templates/${result.runnerUp.slug}`} className="font-semibold text-foreground hover:text-primary">
                        {result.runnerUp.emoji} {result.runnerUp.name}
                      </Link>
                    </p>
                  )}

                  <button onClick={restart} className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                    <RotateCcw className="size-4" /> Retake quiz
                  </button>
                </motion.div>
              )
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
