"use client";

import * as React from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import { MessageCircle, Hash, Sparkles } from "lucide-react";

type Star = { cx: number; cy: number; r: number; delay: string };

/**
 * Illustrated twilight scene — the "Discord painting" hero backdrop.
 * Layered parallax: stars → glowing moon → three mountain ridges →
 * pine forest → foreground foliage. No mascot characters (trademark-safe);
 * a glowing moon + floating chat bubbles carry the Discord mood.
 */
export function HeroScene() {
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // each layer drifts at a different rate for depth
  const moonY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const ridge1Y = useTransform(scrollYProgress, [0, 1], [0, 40]);
  const ridge2Y = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const ridge3Y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const fadeOut = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const [stars, setStars] = React.useState<Star[]>([]);
  React.useEffect(() => {
    setStars(
      Array.from({ length: 70 }, () => ({
        cx: Math.random() * 1440,
        cy: Math.random() * 460,
        r: Math.random() * 1.6 + 0.4,
        delay: `${Math.random() * 4}s`,
      }))
    );
  }, []);

  return (
    <div ref={ref} aria-hidden className="absolute inset-0 overflow-hidden">
      {/* sky wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, var(--sky-top) 0%, var(--sky-mid) 48%, var(--sky-low) 100%)",
        }}
      />

      {/* stars */}
      <svg
        className="absolute inset-x-0 top-0 h-[60%] w-full"
        viewBox="0 0 1440 480"
        preserveAspectRatio="xMidYMin slice"
      >
        {stars.map((s, i) => (
          <circle
            key={i}
            cx={s.cx}
            cy={s.cy}
            r={s.r}
            fill="white"
            className="animate-twinkle"
            style={{ animationDelay: s.delay }}
          />
        ))}
      </svg>

      {/* glowing moon */}
      <motion.div
        style={{ y: moonY, opacity: fadeOut }}
        className="absolute right-[14%] top-[12%] sm:right-[18%]"
      >
        <div className="relative grid place-items-center">
          <div
            className="absolute size-64 rounded-full blur-2xl sm:size-80"
            style={{ background: "color-mix(in oklab, var(--moon) 55%, transparent)" }}
          />
          <div
            className="relative size-28 rounded-full sm:size-36"
            style={{
              background:
                "radial-gradient(circle at 35% 30%, oklch(0.92 0.06 268), var(--moon) 70%)",
              boxShadow:
                "0 0 60px 8px color-mix(in oklab, var(--moon) 60%, transparent)",
            }}
          >
            {/* craters */}
            <span className="absolute left-6 top-7 size-4 rounded-full bg-black/10" />
            <span className="absolute right-7 top-12 size-6 rounded-full bg-black/10" />
            <span className="absolute bottom-6 left-12 size-3 rounded-full bg-black/10" />
          </div>
        </div>
      </motion.div>

      {/* floating chat bubbles */}
      <FloatingBubbles progress={scrollYProgress} />

      {/* ridge 3 — farthest, lightest */}
      <motion.svg
        style={{ y: ridge3Y }}
        className="absolute inset-x-0 bottom-0 h-[58%] w-full"
        viewBox="0 0 1440 420"
        preserveAspectRatio="xMidYMax slice"
      >
        <path
          d="M0 300 L180 200 L360 280 L560 160 L760 270 L980 180 L1200 290 L1440 210 L1440 420 L0 420 Z"
          fill="color-mix(in oklab, var(--sky-low) 70%, oklch(0.45 0.1 300))"
        />
      </motion.svg>

      {/* ridge 2 — mid */}
      <motion.svg
        style={{ y: ridge2Y }}
        className="absolute inset-x-0 bottom-0 h-[48%] w-full"
        viewBox="0 0 1440 360"
        preserveAspectRatio="xMidYMax slice"
      >
        <path
          d="M0 240 L240 120 L480 230 L720 110 L960 240 L1200 130 L1440 220 L1440 360 L0 360 Z"
          fill="color-mix(in oklab, var(--sky-mid) 55%, oklch(0.32 0.09 290))"
        />
      </motion.svg>

      {/* ridge 1 — nearest, darkest, with a pine forest on the crest */}
      <motion.svg
        style={{ y: ridge1Y }}
        className="absolute inset-x-0 bottom-0 h-[40%] w-full"
        viewBox="0 0 1440 300"
        preserveAspectRatio="xMidYMax slice"
      >
        <path
          d="M0 180 L300 90 L620 170 L900 80 L1180 165 L1440 100 L1440 300 L0 300 Z"
          fill="oklch(0.2 0.06 288)"
        />
        {/* pines along the ridge */}
        {PINES.map((p, i) => (
          <Pine key={i} x={p.x} y={p.y} s={p.s} />
        ))}
      </motion.svg>

      {/* foreground foliage */}
      <svg
        className="absolute inset-x-0 bottom-0 h-[18%] w-full"
        viewBox="0 0 1440 140"
        preserveAspectRatio="xMidYMax slice"
      >
        <path
          d="M0 60 C120 20 220 90 340 60 C460 30 540 100 680 70 C820 40 920 100 1080 65 C1220 35 1320 95 1440 60 L1440 140 L0 140 Z"
          fill="oklch(0.16 0.05 286)"
        />
      </svg>

      {/* gentle vignette toward content side */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 20% 40%, transparent 40%, color-mix(in oklab, var(--sky-top) 55%, transparent) 100%)",
        }}
      />
    </div>
  );
}

const PINES = [
  { x: 280, y: 92, s: 1 },
  { x: 340, y: 110, s: 0.8 },
  { x: 880, y: 82, s: 1.1 },
  { x: 940, y: 104, s: 0.75 },
  { x: 1160, y: 168, s: 0.9 },
  { x: 600, y: 172, s: 0.7 },
];

function Pine({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="oklch(0.14 0.045 285)">
      <polygon points="0,-46 -14,-10 14,-10" />
      <polygon points="0,-30 -18,12 18,12" />
      <rect x={-3} y={10} width={6} height={14} />
    </g>
  );
}

function FloatingBubbles({ progress }: { progress: MotionValue<number> }) {
  const y = useTransform(progress, [0, 1], [0, -60]);
  const opacity = useTransform(progress, [0, 0.7], [1, 0]);
  const bubbles = [
    { icon: MessageCircle, top: "26%", left: "12%", delay: 0, tint: "var(--primary)" },
    { icon: Hash, top: "46%", left: "8%", delay: 0.6, tint: "var(--accent)" },
    { icon: Sparkles, top: "20%", left: "40%", delay: 1.1, tint: "var(--secondary)" },
  ];
  return (
    <motion.div style={{ y, opacity }} className="absolute inset-0">
      {bubbles.map((b, i) => {
        const Icon = b.icon;
        return (
          <div
            key={i}
            className="absolute animate-float"
            style={{ top: b.top, left: b.left, animationDelay: `${b.delay}s` }}
          >
            <div
              className="grid size-12 place-items-center rounded-2xl rounded-bl-md sm:size-14"
              style={{
                background: "color-mix(in oklab, var(--card) 85%, transparent)",
                border: "1px solid color-mix(in oklab, var(--card-border) 70%, transparent)",
                backdropFilter: "blur(8px)",
                boxShadow: `0 12px 30px -14px ${b.tint}`,
              }}
            >
              <Icon className="size-6" style={{ color: b.tint }} />
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}
