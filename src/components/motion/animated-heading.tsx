"use client";

import * as React from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import { GSAP_EASE } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Word-by-word mask reveal for headings (GSAP owns the transform here).
 *
 * The full `text` is rendered in the server HTML (split into word spans), so
 * SEO + no-JS users see it. On mount, useGSAP (useLayoutEffect, pre-paint) sets
 * the words hidden and reveals them on scroll-in — no flash. Reduced motion
 * leaves the text visible and skips the animation.
 */
export function AnimatedHeading({
  text,
  as: Tag = "h2",
  className,
  highlight,
}: {
  text: string;
  as?: "h1" | "h2" | "h3";
  className?: string;
  /** Optional trailing word(s) rendered in the accent color. */
  highlight?: string;
}) {
  const ref = React.useRef<HTMLHeadingElement>(null);
  const words = text.split(" ");

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const inners = ref.current!.querySelectorAll<HTMLElement>("[data-w]");
        gsap.set(inners, { yPercent: 115 });
        gsap.to(inners, {
          yPercent: 0,
          duration: 0.7,
          ease: GSAP_EASE,
          stagger: 0.05,
          scrollTrigger: { trigger: ref.current, start: "top 85%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <Tag ref={ref} className={cn("font-display", className)}>
      {words.map((w, i) => (
        <React.Fragment key={i}>
          <span className="inline-block overflow-hidden align-bottom">
            <span data-w className="inline-block will-change-transform">
              {w}
            </span>
          </span>
          {i < words.length - 1 ? " " : null}
        </React.Fragment>
      ))}
      {highlight ? (
        <>
          {" "}
          <span className="inline-block overflow-hidden align-bottom">
            <span data-w className="inline-block text-accent will-change-transform">
              {highlight}
            </span>
          </span>
        </>
      ) : null}
    </Tag>
  );
}
