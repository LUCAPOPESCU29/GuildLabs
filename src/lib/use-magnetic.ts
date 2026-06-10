"use client";

import * as React from "react";
import gsap from "gsap";

/**
 * Magnetic cursor-follow for primary CTAs. The element gently tracks the pointer
 * within `radius` px and springs back on leave. Pointer-fine devices only, and
 * disabled under reduced motion (caller passes `enabled=false`).
 *
 * GSAP owns the x/y transform here; do NOT also drive transform on the same
 * element with framer-motion (the Button only uses framer for scale on hover/tap,
 * which composes fine via separate transform channels managed by GSAP's quickTo).
 */
export function useMagnetic<T extends HTMLElement>(enabled: boolean, strength = 0.35, radius = 80) {
  const ref = React.useRef<T | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "expo.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "expo.out" });

    function onMove(e: MouseEvent) {
      const r = el!.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      if (Math.hypot(dx, dy) < radius + Math.max(r.width, r.height) / 2) {
        xTo(dx * strength);
        yTo(dy * strength);
      } else {
        xTo(0);
        yTo(0);
      }
    }
    function onLeave() {
      xTo(0);
      yTo(0);
    }

    window.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      gsap.killTweensOf(el);
    };
  }, [enabled, strength, radius]);

  return ref;
}
