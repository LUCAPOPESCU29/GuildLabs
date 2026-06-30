"use client";

/**
 * Challenge — a freeCodeCamp-style interactive step: instructions on the left,
 * an editable code editor in the middle, a console + test results on the right,
 * and a "Check" button that runs the learner's JS in a sandbox and validates
 * the output against the step's tests.
 */

import * as React from "react";
import { Play, RotateCcw, Eye, ArrowLeft, ArrowRight, Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { runCode } from "@/lib/learn/sandbox";
import type { ChallengeStep } from "@/lib/learn/curriculum";

function inline(text: string): React.ReactNode[] {
  return text.split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith("`") && part.endsWith("`") ? (
      <code key={i} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">{part.slice(1, -1)}</code>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}

export function Challenge({
  step,
  index,
  total,
  title,
  passed,
  onPass,
  onPrev,
  onNext,
}: {
  step: ChallengeStep;
  index: number;
  total: number;
  title: string;
  passed: boolean;
  onPass: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const [code, setCode] = React.useState(step.starter);
  const [logs, setLogs] = React.useState<string[]>([]);
  const [results, setResults] = React.useState<{ text: string; ok: boolean }[]>([]);
  const [running, setRunning] = React.useState(false);
  const [ran, setRan] = React.useState(false);
  const taRef = React.useRef<HTMLTextAreaElement>(null);
  const gutterRef = React.useRef<HTMLDivElement>(null);

  // Reset editor when the step changes.
  React.useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- reset local state to the new step prop */
    setCode(step.starter);
    setLogs([]);
    setResults([]);
    setRan(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [step]);

  const lineCount = code.split("\n").length;

  async function check() {
    setRunning(true);
    const res = await runCode(code);
    setLogs(res.error ? [...res.logs, `⛔ ${res.error}`] : res.logs);
    const r = step.tests.map((t) => ({ text: t.text, ok: !res.error && t.check(res.logs, code) }));
    setResults(r);
    setRan(true);
    setRunning(false);
    if (r.length > 0 && r.every((x) => x.ok)) onPass();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const s = ta.selectionStart;
      const next = code.slice(0, s) + "  " + code.slice(ta.selectionEnd);
      setCode(next);
      requestAnimationFrame(() => ta.setSelectionRange(s + 2, s + 2));
    }
  }

  const allOk = ran && results.length > 0 && results.every((r) => r.ok);

  return (
    <div className="grid gap-px overflow-hidden rounded-2xl border border-card-border bg-card-border lg:grid-cols-[1fr,1.25fr,0.9fr] lg:h-[68vh]">
      {/* Instructions */}
      <div className="overflow-y-auto bg-background p-6">
        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</div>
        <h3 className="mt-1 font-display text-xl font-black">Step {index + 1} <span className="text-muted-foreground">/ {total}</span></h3>
        <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-muted-foreground">
          {step.instructions.split("\n\n").map((p, i) => <p key={i}>{inline(p)}</p>)}
        </div>
        {step.example && (
          <div className="mt-4">
            <div className="mb-1 text-xs font-semibold text-muted-foreground">Example</div>
            <pre className="overflow-x-auto rounded-xl bg-[#0b0c10] p-3 font-mono text-xs leading-relaxed text-[#dbdee1]"><code>{step.example}</code></pre>
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="flex min-h-[280px] flex-col bg-[#0b0c10]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
          <span className="font-mono text-xs text-white/45">main.js</span>
          <div className="flex gap-1">
            <button onClick={() => setCode(step.starter)} className="grid size-7 place-items-center rounded-md text-white/50 hover:bg-white/10 hover:text-white cursor-pointer" aria-label="Reset code"><RotateCcw className="size-3.5" /></button>
            <button onClick={() => setCode(step.solution)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-white/50 hover:bg-white/10 hover:text-white cursor-pointer"><Eye className="size-3.5" /> Solution</button>
          </div>
        </div>
        <div className="flex min-h-0 flex-1">
          <div ref={gutterRef} className="select-none overflow-hidden border-r border-white/[0.05] py-3 pl-3 pr-2 text-right font-mono text-xs leading-[1.6] text-white/25" aria-hidden>
            {Array.from({ length: lineCount }, (_, i) => <div key={i}>{i + 1}</div>)}
          </div>
          <textarea
            ref={taRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={onKeyDown}
            onScroll={(e) => { if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop; }}
            spellCheck={false}
            className="min-h-0 flex-1 resize-none bg-transparent py-3 pl-3 pr-4 font-mono text-[0.82rem] leading-[1.6] text-[#e6e8f0] outline-none"
            aria-label="Code editor"
          />
        </div>
      </div>

      {/* Console + tests */}
      <div className="flex min-h-[240px] flex-col bg-[#08090d]">
        <div className="border-b border-white/[0.06] px-3 py-2 font-mono text-xs text-white/45">Console</div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3 font-mono text-[0.78rem] leading-relaxed">
          {logs.length === 0 ? (
            <span className="text-white/25">Press Check to run your code…</span>
          ) : (
            logs.map((l, i) => <div key={i} className={cn("whitespace-pre-wrap", l.startsWith("⛔") ? "text-[#ff6b6b]" : "text-white/75")}>{l}</div>)
          )}
        </div>
        {ran && (
          <div className="space-y-1.5 border-t border-white/[0.06] p-3">
            {results.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                {r.ok ? <Check className="mt-0.5 size-3.5 shrink-0 text-[#34d8b0]" /> : <X className="mt-0.5 size-3.5 shrink-0 text-[#ff6b6b]" />}
                <span className={r.ok ? "text-white/70" : "text-white/50"}>{r.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer controls (full width) */}
      <div className="flex items-center justify-between gap-3 bg-background px-4 py-3 lg:col-span-3">
        <button onClick={onPrev} disabled={!onPrev} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors enabled:hover:text-foreground disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed">
          <ArrowLeft className="size-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          {allOk && <span className="hidden items-center gap-1 text-sm font-semibold text-success sm:inline-flex"><Check className="size-4" /> Passed</span>}
          <button onClick={check} disabled={running} className="inline-flex items-center gap-2 rounded-xl bg-[#f5c518] px-5 py-2.5 font-display font-bold text-black transition-[filter] hover:brightness-105 disabled:opacity-70 cursor-pointer">
            {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />} Check your code
          </button>
          <button onClick={onNext} disabled={!onNext || (!passed && !allOk)} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 font-display font-bold text-primary-foreground transition-[filter] hover:brightness-110 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed">
            Next <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
