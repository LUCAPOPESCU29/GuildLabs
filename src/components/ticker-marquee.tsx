"use client";

import * as React from "react";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";

/**
 * Slow, GPU-cheap horizontal marquee of tickers linking to their live charts.
 * Pauses on hover; under reduced motion it renders a static, wrapped row.
 * Only `transform` is animated (translateX), so it stays at 60fps.
 */
export function TickerMarquee({ tickers, speed = 40 }: { tickers: string[]; speed?: number }) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div className="flex flex-wrap justify-center gap-2">
        {tickers.map((t) => (
          <Chip key={t} symbol={t} />
        ))}
      </div>
    );
  }

  // Duplicate the row so the CSS translate from 0 → -50% loops seamlessly.
  // CSS animation (not framer) so hover-pause via play-state never jumps.
  const row = [...tickers, ...tickers];

  return (
    <div className="group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div
        className="flex w-max gap-2 group-hover:[animation-play-state:paused]"
        style={{ animation: `marquee ${speed}s linear infinite` }}
      >
        {row.map((t, i) => (
          <Chip key={`${t}-${i}`} symbol={t} />
        ))}
      </div>
    </div>
  );
}

function Chip({ symbol }: { symbol: string }) {
  return (
    <Link
      href={`/c/${encodeURIComponent(symbol)}`}
      className="shrink-0 rounded-full border border-card-border bg-card px-4 py-1.5 font-mono text-sm font-medium transition-colors hover:border-accent/50 hover:text-accent"
    >
      {symbol}
    </Link>
  );
}
