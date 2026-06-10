"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Wand2, ListChecks } from "lucide-react";
import { Wizard } from "@/components/wizard/wizard";
import { AiBuilder } from "./ai-builder";
import { cn } from "@/lib/utils";

type Mode = "ai" | "wizard";

const MODES = [
  { id: "ai" as const, label: "Describe it", icon: Wand2 },
  { id: "wizard" as const, label: "Step by step", icon: ListChecks },
];

export function BuilderModes() {
  const [mode, setMode] = React.useState<Mode>("ai");
  const reduce = useReducedMotion();

  return (
    <div className="scroll-mt-24">
      {/* mode switch */}
      <div className="mx-auto mb-10 flex w-full max-w-sm gap-1 rounded-full bg-card p-1 shadow-[var(--card-shadow)] ring-1 ring-card-border">
        {MODES.map((m) => {
          const Icon = m.icon;
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              aria-pressed={active}
              className={cn(
                "relative flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {active && (
                <motion.span
                  layoutId="builder-mode-pill"
                  className="absolute inset-0 -z-0 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <Icon className="relative size-4" />
              <span className="relative">
                {m.label}
                {m.id === "ai" && <span className="ml-1">✨</span>}
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {mode === "ai" ? <AiBuilder /> : <Wizard />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
