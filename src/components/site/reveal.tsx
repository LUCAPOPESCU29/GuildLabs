"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { EASE_EXPO } from "@/lib/motion";

type RevealVariant = "fade" | "up" | "mask" | "blur";

const VARIANTS: Record<RevealVariant, Variants> = {
  fade: { hidden: { opacity: 0 }, show: { opacity: 1 } },
  // default — a soft rise + de-blur reads more "premium" than a plain fade
  up: {
    hidden: { opacity: 0, y: 26, filter: "blur(6px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)" },
  },
  mask: {
    hidden: { opacity: 0, clipPath: "inset(0 0 100% 0)" },
    show: { opacity: 1, clipPath: "inset(0 0 0% 0)" },
  },
  blur: { hidden: { opacity: 0, filter: "blur(8px)" }, show: { opacity: 1, filter: "blur(0px)" } },
};

/** Scroll-reveal wrapper: reveals content into view once. Default = rise+de-blur. */
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
      transition={{ duration: 0.6, ease: EASE_EXPO, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
