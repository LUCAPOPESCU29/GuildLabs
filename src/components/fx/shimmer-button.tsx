"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface ShimmerButtonProps {
  href?: string;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}

export function ShimmerButton({
  href,
  onClick,
  className,
  children,
  size = "md",
}: ShimmerButtonProps) {
  const base = cn(
    "group relative inline-flex cursor-pointer select-none items-center justify-center gap-2 overflow-hidden rounded-full font-display font-bold transition-all duration-300",
    "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35",
    "hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    {
      "px-5 py-2 text-sm": size === "sm",
      "px-7 py-3.5 text-base": size === "md",
      "px-9 py-4 text-lg": size === "lg",
    },
    className
  );

  const shimmer = (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent"
    />
  );

  if (href) {
    return (
      <Link href={href} className={base}>
        {shimmer}
        <span className="relative flex items-center gap-2">{children}</span>
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={base}>
      {shimmer}
      <span className="relative flex items-center gap-2">{children}</span>
    </button>
  );
}
