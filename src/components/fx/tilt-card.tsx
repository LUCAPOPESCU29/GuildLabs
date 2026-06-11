"use client";

import * as React from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Pointer-tracked 3D tilt surface. Mouse-only (touch scrolling stays
 * untouched), reduced-motion safe (renders a plain div), transform-only —
 * no layout work, no re-renders on move (motion values + CSS vars).
 *
 * Children render inside a `preserve-3d` context, so a child may pop toward
 * the viewer with `[transform:translateZ(32px)]` — as long as every wrapper
 * between it and the TiltCard also sets `[transform-style:preserve-3d]` and
 * none of them is overflow-hidden (overflow flattens 3D).
 */
export function TiltCard({
  children,
  className,
  max = 7,
  glare = false,
  perspective = 1000,
}: {
  children: React.ReactNode;
  className?: string;
  /** Max tilt in degrees from rest. */
  max?: number;
  /** Paint a soft moving highlight that follows the cursor. */
  glare?: boolean;
  perspective?: number;
}) {
  const reduce = useReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const springX = useSpring(rx, { stiffness: 220, damping: 18, mass: 0.6 });
  const springY = useSpring(ry, { stiffness: 220, damping: 18, mass: 0.6 });

  const onPointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Mouse only — on touch the tilt fights the scroll gesture.
      if (e.pointerType !== "mouse") return;
      const el = e.currentTarget;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width; // 0..1
      const py = (e.clientY - r.top) / r.height;
      rx.set((0.5 - py) * max * 2);
      ry.set((px - 0.5) * max * 2);
      if (glare) {
        el.style.setProperty("--gx", `${px * 100}%`);
        el.style.setProperty("--gy", `${py * 100}%`);
      }
    },
    [glare, max, rx, ry]
  );

  const reset = React.useCallback(() => {
    rx.set(0);
    ry.set(0);
  }, [rx, ry]);

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={cn("group/tilt relative [transform-style:preserve-3d]", className)}
      style={{ rotateX: springX, rotateY: springY, transformPerspective: perspective }}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
    >
      {children}
      {glare && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/tilt:opacity-100"
          style={{
            background:
              "radial-gradient(320px circle at var(--gx, 50%) var(--gy, 30%), oklch(1 0 0 / 0.16), transparent 60%)",
            transform: "translateZ(1px)",
          }}
        />
      )}
    </motion.div>
  );
}
