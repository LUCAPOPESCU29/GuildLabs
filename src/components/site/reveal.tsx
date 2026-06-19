"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { EASE_EXPO } from "@/lib/motion";

type RevealVariant = "fade" | "up" | "mask" | "blur";

// Opacity + transform only — NO animated `filter: blur()`. The de-blur looked
// nice but was a real mobile cost and, when variants swapped at runtime, could
// leave content stuck blurred. Cheap, reliable, identical on every device.
const VARIANTS: Record<RevealVariant, Variants> = {
  fade: { hidden: { opacity: 0 }, show: { opacity: 1 } },
  up: { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } },
  mask: {
    hidden: { opacity: 0, clipPath: "inset(0 0 100% 0)" },
    show: { opacity: 1, clipPath: "inset(0 0 0% 0)" },
  },
  blur: { hidden: { opacity: 0 }, show: { opacity: 1 } },
};

/** Scroll-reveal wrapper: reveals content into view once with a soft rise. */
export function Reveal({
  children,
  delay = 0,
  variant = "up",
  className,
}: {
  children: ReactNode;
  delay?: number;
  variant?: RevealVariant;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      variants={VARIANTS[variant]}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease: EASE_EXPO, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
