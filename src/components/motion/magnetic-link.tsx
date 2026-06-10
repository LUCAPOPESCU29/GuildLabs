"use client";

import * as React from "react";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { useMagnetic } from "@/lib/use-magnetic";

/**
 * A next/link CTA that gently follows the cursor (magnetic) on pointer-fine
 * devices, disabled under reduced motion. GSAP owns the transform.
 */
export function MagneticLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useMagnetic<HTMLAnchorElement>(!reduce);
  return (
    <Link href={href} ref={ref} className={className}>
      {children}
    </Link>
  );
}
