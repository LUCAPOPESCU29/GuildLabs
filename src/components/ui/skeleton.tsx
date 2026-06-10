import { cn } from "@/lib/utils";

/** Themed shimmer placeholder. Reuses the global --animate-shimmer keyframe. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("relative overflow-hidden rounded-xl bg-muted/60", className)}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
    </div>
  );
}
