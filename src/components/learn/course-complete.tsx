"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Download, ArrowRight, Share2, Copy, RotateCcw } from "lucide-react";

const CONFETTI = ["#c678dd", "#34d8b0", "#d19a66", "#61afef", "#e06c75"];

/** A dependency-free confetti burst using framer-motion. */
function Confetti() {
  const pieces = React.useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        x: (i % 2 === 0 ? 1 : -1) * (20 + (i * 13) % 220),
        y: -(60 + (i * 29) % 200),
        rot: (i * 47) % 360,
        color: CONFETTI[i % CONFETTI.length],
        delay: (i % 7) * 0.04,
      })),
    []
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 flex items-start justify-center overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
          animate={{ opacity: 0, x: p.x, y: p.y, rotate: p.rot }}
          transition={{ duration: 1.1, delay: p.delay, ease: "easeOut" }}
          className="absolute top-8 size-2 rounded-[1px]"
          style={{ background: p.color }}
        />
      ))}
    </div>
  );
}

export function CourseComplete({
  name,
  emoji,
  lessons,
  steps,
  shareUrl = "https://guildlabs.fun/learn",
  next,
  onReview,
}: {
  name: string;
  emoji: string;
  lessons: number;
  steps: number;
  shareUrl?: string;
  next?: { slug: string; name: string; emoji: string } | null;
  onReview: () => void;
}) {
  const [copied, setCopied] = React.useState(false);
  const shareText = `I just built a ${name} in the browser at guildlabs.fun/learn 🤖 #DiscordBots`;
  const tweetHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;

  async function copyShare() {
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the tweet button still works */
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-3xl border border-card-border p-8 text-center sm:p-12"
      style={{ background: "linear-gradient(160deg, oklch(0.15 0.04 280), oklch(0.12 0.03 265))" }}
    >
      <Confetti />
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full opacity-20 blur-3xl" style={{ background: "var(--primary)" }} />

      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.15 }}
        className="relative mx-auto grid size-16 place-items-center rounded-2xl bg-[#34d8b0]/15 text-[#34d8b0]"
      >
        <Check className="size-8" strokeWidth={3} />
      </motion.div>

      <div className="relative mt-5 text-4xl" aria-hidden>{emoji}</div>
      <h2 className="relative mt-2 font-display text-3xl font-black text-white sm:text-4xl">You built {name}! 🎉</h2>
      <p className="relative mx-auto mt-3 max-w-md text-white/60">
        You wrote and shipped real code — {lessons} lessons, a guided workshop, and a lab across {steps} steps. That&apos;s a working bot&apos;s worth of logic.
      </p>

      {/* Share */}
      <div className="relative mt-7">
        <div className="text-xs font-bold uppercase tracking-widest text-white/35">Share your win</div>
        <div className="mt-3 flex flex-col justify-center gap-2.5 sm:flex-row">
          <a
            href={tweetHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1d9bf0] px-5 py-2.5 font-display text-sm font-bold text-white transition-[filter] hover:brightness-110"
          >
            <Share2 className="size-4" /> Post on X
          </a>
          <button
            onClick={copyShare}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 py-2.5 font-display text-sm font-bold text-white/80 transition-colors hover:bg-white/[0.11]"
          >
            {copied ? <Check className="size-4 text-[#34d8b0]" /> : <Copy className="size-4" />}
            {copied ? "Copied!" : "Copy message"}
          </button>
        </div>
      </div>

      {/* Next steps */}
      <div className="relative mt-8 flex flex-col justify-center gap-2.5 sm:flex-row">
        <Link href="/self-host" className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-display text-sm font-bold text-primary-foreground shadow-[0_8px_24px_-6px_color-mix(in_oklab,var(--primary)_55%,transparent)] transition-[filter] hover:brightness-110">
          <Download className="size-4" /> Download a real bot
        </Link>
        {next && (
          <Link href={`/learn/course/${next.slug}`} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-6 py-3 font-display text-sm font-bold text-white/80 transition-colors hover:bg-white/[0.11]">
            <span aria-hidden>{next.emoji}</span> Next: {next.name} <ArrowRight className="size-4" />
          </Link>
        )}
      </div>

      <button onClick={onReview} className="relative mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-white/40 transition-colors hover:text-white/70 cursor-pointer">
        <RotateCcw className="size-3" /> Review the lessons
      </button>
    </motion.div>
  );
}
