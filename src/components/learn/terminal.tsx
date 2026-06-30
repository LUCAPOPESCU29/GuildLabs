"use client";

/**
 * Terminal — a *simulated* console that plays a scripted sequence of commands
 * and output (no real execution). Used in the learn workshops so the build
 * "feels" live. Reduced-motion safe (shows everything instantly), and the
 * typewriter is a bounded timer chain — never a permanent rAF.
 */

import * as React from "react";
import { Play, RotateCcw } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export type TermLine = { t: string; type?: "cmd" | "out" | "ok" | "err" | "comment" };

export function Terminal({
  lines,
  title = "terminal",
  className,
}: {
  lines: TermLine[];
  title?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [shown, setShown] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = React.useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const play = React.useCallback(() => {
    clear();
    if (reduce) {
      setShown(lines.length);
      return;
    }
    setShown(0);
    setPlaying(true);
    let delay = 0;
    lines.forEach((ln, i) => {
      delay += ln.type === "cmd" ? 520 : 300;
      timers.current.push(
        setTimeout(() => {
          setShown(i + 1);
          if (i === lines.length - 1) setPlaying(false);
        }, delay)
      );
    });
  }, [lines, reduce, clear]);

  // Reset whenever the script changes (e.g. learner picks a different behavior).
  React.useEffect(() => {
    clear();
    /* eslint-disable react-hooks/set-state-in-effect -- sync internal state to the lines prop */
    setPlaying(false);
    setShown(reduce ? lines.length : 0);
    /* eslint-enable react-hooks/set-state-in-effect */
    return clear;
  }, [lines, reduce, clear]);

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-white/10 bg-[#08090d] shadow-xl ring-1 ring-black/50", className)}>
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.03] px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
          <span className="ml-2 font-mono text-xs text-white/40">{title}</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={play}
            disabled={playing}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40 cursor-pointer"
          >
            <Play className="size-3.5" /> Run
          </button>
          <button
            onClick={() => {
              clear();
              setPlaying(false);
              setShown(0);
            }}
            className="grid size-7 place-items-center rounded-md text-white/50 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
            aria-label="Reset terminal"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </div>
      </div>
      <div className="h-[320px] overflow-y-auto p-4 font-mono text-[0.8rem] leading-relaxed" aria-live="polite">
        {shown === 0 ? (
          <div className="text-white/30">
            Press <span className="font-semibold text-[#34d8b0]">Run</span> to start the build…
          </div>
        ) : (
          lines.slice(0, shown).map((ln, i) => <Row key={i} line={ln} />)
        )}
        {playing && <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-[#34d8b0] align-middle" />}
      </div>
    </div>
  );
}

function Row({ line }: { line: TermLine }) {
  const { t, type = "out" } = line;
  if (type === "cmd") return <div className="text-white"><span className="text-[#34d8b0]">$ </span>{t}</div>;
  if (type === "ok") return <div className="text-[#34d8b0]">✔ {t}</div>;
  if (type === "err") return <div className="text-[#ff6b6b]">✘ {t}</div>;
  if (type === "comment") return <div className="text-white/35"># {t}</div>;
  return <div className="whitespace-pre-wrap text-white/70">{t}</div>;
}
