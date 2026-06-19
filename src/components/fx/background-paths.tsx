"use client";

/**
 * Animated "floating paths" background — adapted from the 21st.dev component,
 * recolored to the GuildLabs brand (violet → mint gradient strokes instead of
 * slate) so it sits behind the robot on the dark CTA band. Background-only
 * layer (no hero text/button — the section composes those itself).
 *
 * Reduced-motion safe: strokes render statically when motion is reduced.
 */

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useMediaQuery } from "@/lib/use-media-query";

function FloatingPaths({ position, gradient }: { position: number; gradient: string }) {
  const reduce = useReducedMotion();
  const phone = useMediaQuery("(max-width: 768px)");
  // Phones: far fewer paths and no infinite animation. 72 animated SVG strokes
  // is one of the heaviest things on the page for a mobile GPU.
  const still = reduce || phone;
  const count = phone ? 10 : 36;
  const paths = Array.from({ length: count }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position} -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${152 - i * 5 * position} ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${684 - i * 5 * position} ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.5 + i * 0.03,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg className="h-full w-full" viewBox="0 0 696 316" fill="none" aria-hidden>
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--secondary)" />
            <stop offset="55%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke={`url(#${gradient})`}
            strokeWidth={path.width}
            strokeOpacity={0.12 + path.id * 0.025}
            initial={{ pathLength: 0.3, opacity: 0.6 }}
            animate={
              still
                ? { pathLength: 1, opacity: 0.4 }
                : { pathLength: 1, opacity: [0.3, 0.6, 0.3], pathOffset: [0, 1, 0] }
            }
            transition={
              still
                ? { duration: 0 }
                : { duration: 20 + (path.id % 10), repeat: Number.POSITIVE_INFINITY, ease: "linear" }
            }
          />
        ))}
      </svg>
    </div>
  );
}

/** Two interleaved layers of brand-colored flowing paths. */
export function BackgroundPaths({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 ${className}`} aria-hidden>
      <FloatingPaths position={1} gradient="gl-paths-a" />
      <FloatingPaths position={-1} gradient="gl-paths-b" />
    </div>
  );
}
