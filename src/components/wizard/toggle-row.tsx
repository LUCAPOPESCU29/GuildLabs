"use client";

import { motion } from "framer-motion";
import type { Option } from "@/lib/wizard-data";
import { cn } from "@/lib/utils";

export function ToggleRow({
  option,
  on,
  onToggle,
}: {
  option: Option;
  on: boolean;
  onToggle: () => void;
}) {
  const Icon = option.icon;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={cn(
        "glass flex w-full items-center gap-3 rounded-2xl p-4 text-left cursor-pointer transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        on && "chip-selected"
      )}
    >
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl transition-colors duration-300",
          on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="size-5" strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[0.9rem] tracking-wide">{option.label}</span>
        <span className="block truncate text-xs text-muted-foreground">{option.desc}</span>
      </span>
      <span
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full p-1 transition-colors duration-300",
          on ? "bg-primary" : "bg-muted"
        )}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
          className={cn(
            "block size-5 rounded-full bg-white shadow",
            on ? "ml-auto" : "ml-0"
          )}
        />
      </span>
    </button>
  );
}
