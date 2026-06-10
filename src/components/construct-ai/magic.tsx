"use client";

/**
 * Small, on-theme animation primitives for the Construct AI flow.
 * Magic-UI-style, but hand-built so they (a) use the GuildLabs motion tokens,
 * (b) need no shadcn registry / network step, and (c) all honour
 * prefers-reduced-motion. Kept dependency-free (canvas confetti, no extra deps).
 */

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import confetti from "canvas-confetti";
import { EASE_EXPO, DUR } from "@/lib/motion";
import { cn } from "@/lib/utils";

// ── BlurFade ─────────────────────────────────────────────────────────────────
/** Fade + slight rise + de-blur on mount. Used for staggered card reveals. */
export function BlurFade({
  children,
  delay = 0,
  className,
  y = 12,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: DUR.entrance, delay, ease: EASE_EXPO }}
    >
      {children}
    </motion.div>
  );
}

// ── Typewriter ───────────────────────────────────────────────────────────────
/** Types text out character-by-character; reduced-motion shows it instantly. */
export function Typewriter({
  text,
  className,
  speed = 18,
  onDone,
}: {
  text: string;
  className?: string;
  speed?: number;
  onDone?: () => void;
}) {
  const reduce = useReducedMotion();
  const [count, setCount] = React.useState(0);
  const doneRef = React.useRef(onDone);
  React.useEffect(() => {
    doneRef.current = onDone;
  });

  React.useEffect(() => {
    if (reduce) {
      doneRef.current?.();
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= text.length) {
        clearInterval(id);
        doneRef.current?.();
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed, reduce]);

  const display = reduce ? text : text.slice(0, count);
  return (
    <span className={className} aria-label={text}>
      <span aria-hidden>{display}</span>
      {!reduce && count < text.length && (
        <motion.span
          aria-hidden
          className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.12em] bg-current"
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 0.9, repeat: Infinity }}
        />
      )}
    </span>
  );
}

// ── ShimmerLine ──────────────────────────────────────────────────────────────
/** A skeleton bar with a sweeping shimmer — used while the blueprint "builds". */
export function ShimmerLine({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-full bg-muted/70", className)}>
      <div
        className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-foreground/15 to-transparent"
        aria-hidden
      />
    </div>
  );
}

// ── Confetti ─────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ["#6366f1", "#a78bfa", "#34d399", "#fb7185", "#fbbf24", "#38bdf8"];

/** One-shot confetti burst (canvas-confetti), fired when `fire` flips to true. */
export function Confetti({ fire }: { fire: boolean }) {
  const reduce = useReducedMotion();
  const firedRef = React.useRef(false);

  React.useEffect(() => {
    if (!fire || reduce || firedRef.current) return;
    firedRef.current = true;
    const colors = CONFETTI_COLORS;
    void confetti({ particleCount: 130, spread: 75, startVelocity: 42, origin: { y: 0.35 }, colors });
    void confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.55 }, colors });
    void confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.55 }, colors });
  }, [fire, reduce]);

  return null;
}
