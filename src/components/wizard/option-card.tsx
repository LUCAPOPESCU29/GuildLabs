"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { Option } from "@/lib/wizard-data";
import { cn } from "@/lib/utils";

export function OptionCard({
  option,
  selected,
  onToggle,
  radio = false,
}: {
  option: Option;
  selected: boolean;
  onToggle: () => void;
  radio?: boolean;
}) {
  const Icon = option.icon;
  return (
    <motion.button
      type="button"
      role={radio ? "radio" : "checkbox"}
      aria-checked={selected}
      onClick={onToggle}
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "glass group relative flex w-full items-center gap-3 rounded-2xl p-4 text-left cursor-pointer transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected && "chip-selected"
      )}
    >
      <span
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-xl transition-colors duration-300",
          selected
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground group-hover:text-foreground"
        )}
      >
        <Icon className="size-5" strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[0.95rem] tracking-wide text-foreground">
          {option.label}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {option.desc}
        </span>
      </span>
      <span
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-md border transition-all duration-300",
          radio && "rounded-full",
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-[color-mix(in_oklab,var(--foreground)_25%,transparent)] text-transparent"
        )}
      >
        <Check className="size-3.5" strokeWidth={3} />
      </span>
    </motion.button>
  );
}
