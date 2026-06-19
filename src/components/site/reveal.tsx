"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { EASE_EXPO } from "@/lib/motion";
import { useMediaQuery } from "@/lib/use-media-query";

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

// Phones get blur-free variants — animating a `filter: blur()` on every section
// as it scrolls in is a major source of mobile jank. Keep just opacity + rise.
const LITE_VARIANTS: Record<RevealVariant, Variants> = {
  fade: VARIANTS.fade,
  up: { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } },
  mask: VARIANTS.mask,
  blur: { hidden: { opacity: 0 }, show: { opacity: 1 } },
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
  const phone = useMediaQuery("(max-width: 768px)");
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      variants={(phone ? LITE_VARIANTS : VARIANTS)[variant]}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: phone ? 0.45 : 0.6, ease: EASE_EXPO, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
