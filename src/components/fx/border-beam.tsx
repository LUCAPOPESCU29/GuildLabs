"use client";

import { cn } from "@/lib/utils";

/** Magic-UI style traveling border beam (decorative). */
export function BorderBeam({
  className,
  duration = 6,
  delay = 0,
}: {
  className?: string;
  duration?: number;
  delay?: number;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] [border:1px_solid_transparent]",
        "[mask:linear-gradient(transparent,transparent),linear-gradient(white,white)] [mask-clip:padding-box,border-box] [mask-composite:intersect]",
        className
      )}
    >
      <div
        className="absolute aspect-square w-12 animate-beam rounded-full bg-gradient-to-l from-[rgb(var(--neon-2))] via-[rgb(var(--neon-1))] to-transparent"
        style={{
          offsetPath: "rect(0 auto auto 0 round 1.2rem)",
          offsetDistance: "0%",
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
        }}
      />
    </div>
  );
}
