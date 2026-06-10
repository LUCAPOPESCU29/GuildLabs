"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * A card surface that paints a soft radial glow following the cursor. Pure CSS
 * vars (--mx/--my) updated on pointer move — no re-renders, no rAF. The glow is
 * token-driven (defaults to the brand primary) and fades in only on hover, so
 * static / touch / reduced-motion contexts just see a normal card.
 *
 * Renders an <a> (Next Link) when `href` is set, otherwise a <div>.
 */
export function SpotlightCard({
  children,
  className,
  href,
  /** OKLCH/any CSS color for the glow. Defaults to the brand primary token. */
  glow = "var(--primary)",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
  glow?: string;
} & React.HTMLAttributes<HTMLElement>) {
  const onPointerMove = React.useCallback((e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }, []);

  const glowLayer = (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      style={{
        background:
          "radial-gradient(220px circle at var(--mx, 50%) var(--my, 0%), color-mix(in oklab, var(--spot) 22%, transparent), transparent 60%)",
        ["--spot" as string]: glow,
      }}
    />
  );

  const cls = cn("group relative overflow-hidden", className);

  if (href) {
    return (
      <Link href={href} className={cls} onPointerMove={onPointerMove}>
        {glowLayer}
        {children}
      </Link>
    );
  }

  return (
    <div className={cls} onPointerMove={onPointerMove} {...rest}>
      {glowLayer}
      {children}
    </div>
  );
}
