"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { EASE_EXPO } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/lib/use-media-query";

export type BotSlide = {
  name: string;
  href: string;
  glow: string;
  icon: React.ComponentType<{ className?: string }>;
  body: string;
};

/** Drag distance / fling velocity that counts as a swipe. */
const SWIPE_DISTANCE = 60;
const SWIPE_VELOCITY = 400;

/**
 * 3D interactive slides for the bot lineup — a perspective deck where the
 * active bot sits front-and-center and its neighbours recede with a rotateY.
 * Drag/swipe, click a side slide, use the arrows/dots, or arrow keys.
 * Gentle autoplay until the user touches it. transform-only animation.
 * Reduced motion falls back to a static grid of the same cards.
 */
export function BotSlides({ bots }: { bots: BotSlide[] }) {
  const reduce = useReducedMotion();
  const phone = useMediaQuery("(max-width: 768px)");
  const [index, setIndex] = React.useState(0);
  const [stageW, setStageW] = React.useState(0);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const inView = useInView(stageRef, { amount: 0.4 });
  /** Once the user interacts, autoplay stops for good. */
  const interactedRef = React.useRef(false);
  const hoverRef = React.useRef(false);
  const draggingRef = React.useRef(false);
  const n = bots.length;

  const go = React.useCallback(
    (dir: number) => setIndex((i) => (i + dir + n) % n),
    [n]
  );

  // Slide geometry tracks the stage width so drag (px) and animate (px) agree.
  React.useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setStageW(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Gentle autoplay: only while visible, unhovered, and untouched. Off on
  // phones — periodically re-running the 3D card transforms causes jank, and
  // swiping is the natural mobile gesture anyway.
  React.useEffect(() => {
    if (reduce || !inView || phone) return;
    const id = setInterval(() => {
      if (interactedRef.current || hoverRef.current || document.hidden) return;
      setIndex((i) => (i + 1) % n);
    }, 5000);
    return () => clearInterval(id);
  }, [n, reduce, inView, phone]);

  if (reduce) {
    return (
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {bots.map((b) => (
          <SlideCard key={b.name} bot={b} active />
        ))}
      </div>
    );
  }

  const slideW = Math.min(stageW * 0.82, 544);
  const sideOffset = slideW * 0.58;

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label="The GuildLabs bots"
      tabIndex={0}
      className="relative mt-10 rounded-[2rem] outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          interactedRef.current = true;
          go(e.key === "ArrowLeft" ? -1 : 1);
          e.preventDefault();
        }
      }}
      onPointerEnter={() => (hoverRef.current = true)}
      onPointerLeave={() => (hoverRef.current = false)}
    >
      {/* ambient glow tinted by the active bot */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-64 w-[34rem] max-w-[92%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-3xl [transition:background_700ms_ease]"
        style={{ background: bots[index].glow }}
      />

      <div ref={stageRef} className="relative h-[26rem] sm:h-[24rem]">
        {bots.map((b, i) => {
          const diff = (i - index + n) % n;
          const pos = diff > n / 2 ? diff - n : diff; // …,-1,0,1,…
          const active = pos === 0;
          const offstage = Math.abs(pos) > 1;
          return (
            <div
              key={b.name}
              className="pointer-events-none absolute inset-0 grid place-items-center"
              style={{ zIndex: 2 - Math.abs(pos) }}
              aria-hidden={!active}
            >
              <motion.div
                className={cn(
                  "pointer-events-auto w-[min(82%,34rem)]",
                  active ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
                )}
                animate={{
                  x: pos * sideOffset,
                  scale: active ? 1 : 0.85,
                  rotateY: pos * -24,
                  opacity: offstage ? 0 : active ? 1 : 0.55,
                }}
                transition={{ duration: 0.55, ease: EASE_EXPO }}
                style={{ transformPerspective: 1100 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.18}
                onDragStart={() => {
                  draggingRef.current = true;
                  interactedRef.current = true;
                }}
                onDragEnd={(_, info) => {
                  window.setTimeout(() => (draggingRef.current = false), 120);
                  if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY) go(1);
                  else if (info.offset.x > SWIPE_DISTANCE || info.velocity.x > SWIPE_VELOCITY) go(-1);
                }}
                onClickCapture={(e) => {
                  // A drag should never count as a click on the slide / its link.
                  if (draggingRef.current) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                  }
                  if (!active) {
                    interactedRef.current = true;
                    setIndex(i);
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
              >
                <SlideCard bot={b} active={active} />
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* controls */}
      <div className="mt-2 flex items-center justify-center gap-4">
        <button
          type="button"
          aria-label="Previous bot"
          onClick={() => {
            interactedRef.current = true;
            go(-1);
          }}
          className="grid size-11 cursor-pointer place-items-center rounded-full border-2 border-card-border bg-card transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="flex items-center">
          {bots.map((b, i) => (
            <button
              key={b.name}
              type="button"
              aria-label={`Show ${b.name}`}
              aria-current={i === index}
              onClick={() => {
                interactedRef.current = true;
                setIndex(i);
              }}
              className="group grid size-9 cursor-pointer place-items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
            >
              <span
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i === index ? "w-6 bg-primary" : "w-2 bg-card-border group-hover:bg-primary/40"
                )}
              />
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label="Next bot"
          onClick={() => {
            interactedRef.current = true;
            go(1);
          }}
          className="grid size-11 cursor-pointer place-items-center rounded-full border-2 border-card-border bg-card transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowRight className="size-4" />
        </button>
      </div>

      <span className="sr-only" aria-live="polite">
        {bots[index].name}
      </span>
    </div>
  );
}

/** One bot, styled as a mini product window. */
function SlideCard({ bot, active }: { bot: BotSlide; active: boolean }) {
  const Icon = bot.icon;
  return (
    <div className="overflow-hidden rounded-[1.75rem] border-2 border-card-border bg-card shadow-[var(--elevation-2)]">
      {/* window chrome */}
      <div className="flex items-center gap-1.5 border-b-2 border-card-border/60 bg-background-deep/40 px-5 py-3">
        <span className="size-2.5 rounded-full bg-coral/70" />
        <span className="size-2.5 rounded-full bg-accent/70" />
        <span className="size-2.5 rounded-full bg-primary/60" />
        <span className="ml-2 truncate font-mono text-xs text-muted-foreground">
          guildlabs / {bot.name.toLowerCase()}
        </span>
      </div>

      <div className="relative p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full opacity-[0.14] blur-2xl"
          style={{ background: bot.glow }}
        />
        <span
          className="grid size-12 place-items-center rounded-xl"
          style={{
            background: `color-mix(in oklab, ${bot.glow} 14%, transparent)`,
            color: bot.glow,
          }}
        >
          <Icon className="size-6" />
        </span>
        <h3 className="mt-4 font-display text-2xl font-black sm:text-3xl">{bot.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {bot.body}
        </p>
        <Link
          href={bot.href}
          tabIndex={active ? 0 : -1}
          draggable={false}
          className="mt-5 inline-flex items-center gap-1 text-sm font-semibold hover:opacity-80"
          style={{ color: bot.glow }}
        >
          Learn more <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
