"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { EASE_EXPO } from "@/lib/motion";

/**
 * Per-route transition. Next re-mounts template.tsx on every navigation, so this
 * fades each page in.
 *
 * IMPORTANT: opacity ONLY — no transform/filter. A transformed (or filtered)
 * ancestor would create a containing block and break `position: fixed` for
 * descendants (the floating navbar, the chart's fullscreen). Opacity is safe.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: EASE_EXPO }}
    >
      {children}
    </motion.div>
  );
}
