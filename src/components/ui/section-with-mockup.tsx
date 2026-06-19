"use client";

/**
 * SectionWithMockup — a dark feature band with a title/description beside a
 * layered "mockup" (a primary card with a secondary card offset behind it).
 *
 * Adapted from the 21st.dev component for this codebase:
 *  - The mockups are React nodes (real on-brand Discord-style UI), not stock
 *    background images.
 *  - Per-section `accent` glow so each bot keeps its color.
 *  - Reduced-motion safe (the parallax y-shifts are disabled).
 */

import * as React from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionWithMockupProps {
  title: React.ReactNode;
  description: React.ReactNode;
  primaryMockup: React.ReactNode;
  secondaryMockup?: React.ReactNode;
  /** CSS color for the soft glow behind the mockup. */
  accent?: string;
  reverseLayout?: boolean;
  className?: string;
}

export function SectionWithMockup({
  title,
  description,
  primaryMockup,
  secondaryMockup,
  accent = "var(--primary)",
  reverseLayout = false,
  className,
}: SectionWithMockupProps) {
  const reduce = useReducedMotion();

  const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.18 } },
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 44 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const layoutClasses = reverseLayout ? "md:grid-cols-2 md:grid-flow-col-dense" : "md:grid-cols-2";
  const textOrderClass = reverseLayout ? "md:col-start-2" : "";
  const imageOrderClass = reverseLayout ? "md:col-start-1" : "";

  return (
    <section className={cn("relative overflow-hidden bg-[#0a0a12] py-24 md:py-36", className)}>
      {/* accent glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 left-1/2 size-[36rem] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{ background: accent }}
      />
      <div className="relative z-10 mx-auto w-full max-w-[1220px] px-6 md:px-10">
        <motion.div
          className={cn("grid grid-cols-1 items-center gap-14 md:gap-10", layoutClasses)}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* Text */}
          <motion.div
            className={cn("mx-auto mt-8 flex max-w-[546px] flex-col items-start gap-4 md:mx-0 md:mt-0", textOrderClass)}
            variants={itemVariants}
          >
            <h2 className="font-display text-3xl font-black leading-tight tracking-tight text-white md:text-[40px] md:leading-[1.08]">
              {title}
            </h2>
            <p className="text-[15px] leading-7 text-white/55">{description}</p>
          </motion.div>

          {/* Mockup */}
          <motion.div
            className={cn("relative mx-auto mt-6 w-full max-w-[330px] md:mt-0 md:max-w-[480px]", imageOrderClass)}
            variants={itemVariants}
          >
            {secondaryMockup && (
              <motion.div
                className="absolute z-0 w-[86%] overflow-hidden rounded-[26px] opacity-70 blur-[1px]"
                style={{
                  top: reverseLayout ? "auto" : "7%",
                  bottom: reverseLayout ? "7%" : "auto",
                  left: reverseLayout ? "auto" : "-13%",
                  right: reverseLayout ? "-13%" : "auto",
                }}
                initial={false}
                whileInView={reduce ? undefined : { y: reverseLayout ? -18 : -26 }}
                transition={{ duration: 1.1, ease: "easeOut" }}
                viewport={{ once: true, amount: 0.5 }}
              >
                {secondaryMockup}
              </motion.div>
            )}

            <motion.div
              className="relative z-10 overflow-hidden rounded-[26px] border border-white/10 bg-[#15151f] shadow-2xl"
              initial={false}
              whileInView={reduce ? undefined : { y: reverseLayout ? 16 : 24 }}
              transition={{ duration: 1.1, ease: "easeOut", delay: 0.1 }}
              viewport={{ once: true, amount: 0.5 }}
            >
              {primaryMockup}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* bottom hairline */}
      <div
        aria-hidden
        className="absolute bottom-0 left-0 z-0 h-px w-full"
        style={{ background: "radial-gradient(50% 50% at 50% 50%, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0) 100%)" }}
      />
    </section>
  );
}

export default SectionWithMockup;
