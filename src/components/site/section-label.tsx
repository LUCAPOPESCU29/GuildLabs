import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "primary" | "accent" | "outline";

const TONES: Record<Tone, string> = {
  primary: "bg-primary text-primary-foreground",
  accent: "bg-accent text-accent-foreground",
  outline: "border-2 border-primary/40 bg-primary/5 text-primary",
};

/**
 * Bold, branded section eyebrow — a chunky pill with an optional index.
 * Replaces the muted inline eyebrows for a louder, more designed feel.
 */
export function SectionLabel({
  children,
  index,
  tone = "primary",
  className,
}: {
  children: React.ReactNode;
  index?: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      {index && (
        <span className="font-mono text-sm font-black tabular-nums text-primary">{index}</span>
      )}
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[0.72rem] font-black uppercase tracking-[0.14em]",
          TONES[tone]
        )}
      >
        {children}
      </span>
    </div>
  );
}
