"use client";

import * as React from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Counts a number up from 0 when it scrolls into view (GSAP). The final value is
 * server-rendered (SEO + no-JS), then set to 0 pre-paint and animated. Reduced
 * motion shows the final value with no animation.
 */
export function CountUp({
  value,
  format = (n: number) => Math.round(n).toLocaleString("en-US"),
  duration = 1.4,
  className,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const el = ref.current!;
        const obj = { v: 0 };
        el.textContent = format(0);
        gsap.to(obj, {
          v: value,
          duration,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
          onUpdate: () => {
            el.textContent = format(obj.v);
          },
        });
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [value] }
  );

  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  );
}
