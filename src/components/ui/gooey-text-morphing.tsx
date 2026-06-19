"use client";

/**
 * GooeyText — morphing kinetic headline (SVG "gooey" threshold blend).
 *
 * Adapted from the 21st.dev component with two important changes for this
 * codebase:
 *  1. The original never cancelled its requestAnimationFrame on unmount (a
 *     leak); this version does.
 *  2. The per-frame blur morph is expensive on phones, so on reduced-motion or
 *     a coarse pointer it falls back to a cheap interval cross-fade — no rAF,
 *     no per-frame filter.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

interface GooeyTextProps {
  texts: string[];
  morphTime?: number;
  cooldownTime?: number;
  align?: "center" | "left";
  className?: string;
  textClassName?: string;
}

const FADE_CSS = `@keyframes glGooeyFade{0%{opacity:0;transform:translateY(8px)}100%{opacity:1;transform:translateY(0)}}`;

export function GooeyText({
  texts,
  morphTime = 1,
  cooldownTime = 0.25,
  align = "center",
  className,
  textClassName,
}: GooeyTextProps) {
  const text1Ref = React.useRef<HTMLSpanElement>(null);
  const text2Ref = React.useRef<HTMLSpanElement>(null);
  const [lite, setLite] = React.useState(false);
  const [idx, setIdx] = React.useState(0);

  // Decide once mounted: reduced motion or a coarse pointer (phones) → use the
  // cheap path. Defaults to the full morph on the server / desktop.
  React.useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce), (pointer: coarse)");
    const update = () => setLite(m.matches);
    update();
    m.addEventListener("change", update);
    return () => m.removeEventListener("change", update);
  }, []);

  // Full gooey morph (desktop, motion allowed).
  React.useEffect(() => {
    if (lite) return;
    const t1 = text1Ref.current;
    const t2 = text2Ref.current;
    if (!t1 || !t2) return;

    let textIndex = texts.length - 1;
    let time = new Date();
    let morph = 0;
    let cooldown = cooldownTime;
    let raf = 0;

    const setMorph = (fraction: number) => {
      t2.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
      t2.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;
      const f = 1 - fraction;
      t1.style.filter = `blur(${Math.min(8 / f - 8, 100)}px)`;
      t1.style.opacity = `${Math.pow(f, 0.4) * 100}%`;
    };

    const doCooldown = () => {
      morph = 0;
      t2.style.filter = "";
      t2.style.opacity = "100%";
      t1.style.filter = "";
      t1.style.opacity = "0%";
    };

    const doMorph = () => {
      morph -= cooldown;
      cooldown = 0;
      let fraction = morph / morphTime;
      if (fraction > 1) {
        cooldown = cooldownTime;
        fraction = 1;
      }
      setMorph(fraction);
    };

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const newTime = new Date();
      const shouldIncrementIndex = cooldown > 0;
      const dt = (newTime.getTime() - time.getTime()) / 1000;
      time = newTime;
      cooldown -= dt;

      if (cooldown <= 0) {
        if (shouldIncrementIndex) {
          textIndex = (textIndex + 1) % texts.length;
          t1.textContent = texts[textIndex % texts.length];
          t2.textContent = texts[(textIndex + 1) % texts.length];
        }
        doMorph();
      } else {
        doCooldown();
      }
    };

    // seed so the first paint isn't blank
    t1.textContent = texts[textIndex % texts.length];
    t2.textContent = texts[(textIndex + 1) % texts.length];
    animate();

    return () => cancelAnimationFrame(raf);
  }, [texts, morphTime, cooldownTime, lite]);

  // Cheap cross-fade for phones / reduced motion.
  React.useEffect(() => {
    if (!lite) return;
    const period = Math.max(1500, (morphTime + cooldownTime) * 1000 + 1400);
    const id = setInterval(() => setIdx((i) => (i + 1) % texts.length), period);
    return () => clearInterval(id);
  }, [lite, texts, morphTime, cooldownTime]);

  const justify = align === "left" ? "justify-start" : "justify-center";
  const spanBase = cn(
    "absolute inset-0 flex items-center select-none text-6xl leading-none md:text-[60pt]",
    justify,
    "text-foreground",
    textClassName
  );

  if (lite) {
    return (
      <div className={cn("relative", className)}>
        <style dangerouslySetInnerHTML={{ __html: FADE_CSS }} />
        <div className="relative h-full w-full">
          <span key={idx} className={spanBase} style={{ animation: "glGooeyFade .45s ease-out both" }}>
            {texts[idx]}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <svg className="absolute h-0 w-0" aria-hidden="true" focusable="false">
        <defs>
          <filter id="gooey-threshold">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 255 -140"
            />
          </filter>
        </defs>
      </svg>
      <div className="relative h-full w-full" style={{ filter: "url(#gooey-threshold)" }}>
        <span ref={text1Ref} className={spanBase} />
        <span ref={text2Ref} className={spanBase} />
      </div>
    </div>
  );
}
