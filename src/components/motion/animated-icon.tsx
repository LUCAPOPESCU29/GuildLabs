"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { EASE_EXPO } from "@/lib/motion";

type Intent = "scale" | "rotate" | "nudge" | "spin";

/**
 * Consistent icon micro-motion wrapper. Drop a lucide icon inside and it gets a
 * tasteful hover/press reaction. For state-swaps (menu↔close, copy↔check) use
 * AnimatePresence at the call site; this handles the per-icon hover feel.
 */
export function AnimatedIcon({
  children,
  intent = "scale",
  className,
}: {
  children: React.ReactNode;
  intent?: Intent;
  className?: string;
}) {
  const reduce = useReducedMotion();

  const hover = reduce
    ? undefined
    : intent === "rotate"
      ? { rotate: 12 }
      : intent === "nudge"
        ? { x: 2 }
        : intent === "spin"
          ? { rotate: 90 }
          : { scale: 1.15 };

  return (
    <motion.span
      className={cn("inline-flex", className)}
      whileHover={hover}
      whileTap={reduce ? undefined : { scale: 0.9 }}
      transition={{ duration: 0.18, ease: EASE_EXPO }}
    >
      {children}
    </motion.span>
  );
}
