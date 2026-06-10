"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CAPS } from "@/lib/construct-ai";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  "Crypto trading community",
  "Indie game guild",
  "Study group",
  "Art & illustration hub",
  "Local football club",
] as const;

const EXAMPLE_PROMPTS: Record<string, string> = {
  "Crypto trading community":
    "A crypto trading community for ~2,000 members. We share market analysis, price alerts and alpha, run weekly voice AMAs, and want clear not-financial-advice disclaimers. Holder roles for verified token holders. Balanced moderation.",
  "Indie game guild":
    "An indie game guild of around 500 players. We need LFG and clips channels, squad voice rooms, a place to share builds and feedback, game-night events, and roles for different games. Chill, high-energy vibe.",
  "Study group":
    "A focused study group for university students. Subject channels for homework help, a resources library, quiet focus voice rooms, exam countdowns, and a teacher/student role split. Strict, distraction-free moderation.",
  "Art & illustration hub":
    "An art and illustration community for creators. Showcase, work-in-progress and feedback channels, monthly prompt challenges, a critique corner, and roles by medium (digital, traditional, 3D). Warm and supportive vibe.",
  "Local football club":
    "A Discord for a local football club — match-day chat, fixtures and results, training coordination voice, a highlights channel, and roles for players, coaches and supporters. Friendly and casual.",
};

export function DescribeBox({
  value,
  onChange,
  onSubmit,
  busy,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  busy?: boolean;
}) {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const count = value.length;
  const tooShort = value.trim().length < CAPS.description.min;
  const tooLong = count > CAPS.description.max;
  const canSubmit = !tooShort && !tooLong && !busy;

  function pickExample(label: string) {
    onChange(EXAMPLE_PROMPTS[label] ?? label);
    ref.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canSubmit) {
      e.preventDefault();
      onSubmit();
    }
  }

  return (
    <div className="glass-strong relative overflow-hidden rounded-3xl p-5 sm:p-7">
      <div className="flex items-center gap-2 text-xs font-medium text-secondary">
        <Wand2 className="size-4" /> DESCRIBE IT
      </div>
      <h2 className="mt-1 font-display text-2xl tracking-wide text-foreground sm:text-3xl">
        Describe your server
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Tell us who it&apos;s for, the vibe, the channels and roles you imagine. The AI
        asks a couple of quick questions, then designs the whole thing.
      </p>

      <div className="mt-5">
        <label htmlFor="describe" className="sr-only">
          Describe your server
        </label>
        <textarea
          id="describe"
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          rows={6}
          maxLength={CAPS.description.max}
          placeholder="e.g. A cozy book club for sci-fi readers — monthly reads, spoiler-safe discussion channels, a voice room for live chats, and roles for current vs. finished books…"
          aria-describedby="describe-count"
          className="glass-input w-full resize-y rounded-2xl px-4 py-3.5 text-[0.95rem] leading-relaxed outline-none placeholder:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="mt-2 flex items-center justify-between gap-3 text-xs">
          <span className="text-muted-foreground">
            <Sparkles className="mr-1 inline size-3 text-secondary" />
            AI-generated — you&apos;ll review &amp; edit everything before deploy.
          </span>
          <span
            id="describe-count"
            className={cn(
              "tabular-nums",
              tooLong ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {count}/{CAPS.description.max}
          </span>
        </div>
      </div>

      {/* example chips */}
      <div className="mt-4">
        <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground">
          Try one
        </p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => pickExample(label)}
              className="rounded-full border border-card-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground/90 transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
        <AnimatePresence>
          {tooShort && value.length > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-muted-foreground"
            >
              A little more detail helps — aim for a sentence or two.
            </motion.p>
          )}
        </AnimatePresence>
        <Button
          size="lg"
          magnetic
          onClick={onSubmit}
          disabled={!canSubmit}
          className="sm:ml-auto"
        >
          {busy ? "Thinking…" : "Generate my server"}
          <ArrowRight className="size-5" />
        </Button>
      </div>
    </div>
  );
}
