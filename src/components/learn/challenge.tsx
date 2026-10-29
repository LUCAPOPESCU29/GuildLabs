"use client";

import * as React from "react";
import {
  Play, RotateCcw, Eye, ArrowLeft, ArrowRight,
  Check, X, Loader2, Maximize2, Minimize2, Lightbulb,
  FileText, Code2, SquareTerminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { runCode } from "@/lib/learn/sandbox";
import { trackLearn } from "@/lib/learn/track";
import type { ChallengeStep } from "@/lib/learn/curriculum";

function inline(text: string, dark = false): React.ReactNode[] {
  return text.split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith("`") && part.endsWith("`") ? (
      <code
        key={i}
        className={
          dark
            ? "rounded border border-white/[0.09] bg-white/[0.07] px-1.5 py-0.5 font-mono text-[0.83em] text-white/70"
            : "rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground"
        }
      >
        {part.slice(1, -1)}
      </code>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}

/* ── Lightweight regex syntax highlighter (no external lib) ──────────────── */

const TOK_COLOR: Record<string, string> = {
  c: "#5c6370", // comment
  s: "#98c379", // string
  k: "#c678dd", // keyword
  l: "#56b6c2", // literal (true/false/null…)
  n: "#d19a66", // number
};

const KEYWORDS =
  "const|let|var|function|return|if|else|for|of|in|while|do|switch|case|break|continue|" +
  "async|await|new|typeof|instanceof|class|extends|super|this|throw|try|catch|finally|" +
  "yield|delete|void|import|from|export|default";
const LITERALS = "true|false|null|undefined|NaN|Infinity";

const TOKENIZER = new RegExp(
  "(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)" + // 1 comments
    "|(`(?:\\\\.|[^`\\\\])*`|\"(?:\\\\.|[^\"\\\\])*\"|'(?:\\\\.|[^'\\\\])*')" + // 2 strings
    "|\\b(" + KEYWORDS + ")\\b" + // 3 keywords
    "|\\b(" + LITERALS + ")\\b" + // 4 literals
    "|\\b(\\d+(?:\\.\\d+)?)\\b", // 5 numbers
  "g"
);

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlight(code: string): string {
  // Escape first, then tokenize — string/comment delimiters and word chars are
  // untouched by escaping, so token matching stays correct.
  const escaped = escapeHtml(code);
  const html = escaped.replace(TOKENIZER, (m, comment, str, kw, lit, num) => {
    const cls = comment ? "c" : str ? "s" : kw ? "k" : lit ? "l" : num ? "n" : "";
    return cls ? `<span style="color:${TOK_COLOR[cls]}">${m}</span>` : m;
  });
  // Trailing newline needs a placeholder so the highlighted layer keeps the
  // same height as the textarea (which shows an extra blank line).
  return html.endsWith("\n") ? html + " " : html;
}

/* Drag handle between panes */
function DragHandle({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) {
  return (
    <div
      onMouseDown={onMouseDown}
      className="group relative flex w-[5px] shrink-0 cursor-col-resize select-none items-center justify-center"
      style={{ background: "rgba(255,255,255,0.03)" }}
    >
      {/* Visible line */}
      <div className="absolute inset-y-0 w-px bg-white/[0.06] transition-colors group-hover:bg-primary/50" />
      {/* Extended hit area */}
      <div className="absolute inset-y-0 -inset-x-1.5 z-10" />
    </div>
  );
}

type MobileTab = "instructions" | "code" | "console";

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
  const [results, setResults] = React.useState<{ text: string; ok: boolean; hint?: string }[]>([]);
  const [running, setRunning] = React.useState(false);
  const [ran, setRan] = React.useState(false);
  const [fullscreen, setFullscreen] = React.useState(false);
  const [hintsShown, setHintsShown] = React.useState(0);
  const [mobileTab, setMobileTab] = React.useState<MobileTab>("instructions");

  /* Resizable pane sizes — [left%, mid%], right pane takes flex-1 */
  const [sizes, setSizes] = React.useState([32, 41]);
  const [dragging, setDragging] = React.useState(false);
  const paneRowRef = React.useRef<HTMLDivElement>(null);

  const taRef = React.useRef<HTMLTextAreaElement>(null);
  const gutterRef = React.useRef<HTMLDivElement>(null);
  const highlightRef = React.useRef<HTMLPreElement>(null);

  const highlighted = React.useMemo(() => highlight(code), [code]);

  /* Esc exits fullscreen */
  React.useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFullscreen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  /* Reset on step change */
  React.useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setCode(step.starter);
    setLogs([]);
    setResults([]);
    setRan(false);
    setHintsShown(0);
    setMobileTab("instructions");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [step]);

  /* Drag-to-resize handler */
  function startResize(divider: 0 | 1, e: React.MouseEvent) {
    e.preventDefault();
    const row = paneRowRef.current;
    if (!row) return;
    const totalW = row.getBoundingClientRect().width;
    const startX = e.clientX;
    const startSizes = [...sizes];
    setDragging(true);

    function onMove(ev: MouseEvent) {
      const dPct = ((ev.clientX - startX) / totalW) * 100;
      setSizes(() => {
        if (divider === 0) {
          const a = Math.max(15, Math.min(55, startSizes[0] + dPct));
          const b = Math.max(20, startSizes[1] - (a - startSizes[0]));
          return [a, b];
        } else {
          const b = Math.max(20, Math.min(65, startSizes[1] + dPct));
          return [startSizes[0], b];
        }
      });
    }
    function onUp() {
      setDragging(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  const lineCount = code.split("\n").length;
  const allOk = ran && results.length > 0 && results.every((r) => r.ok);
  const fs = fullscreen;
  const hints = step.hints ?? [];
  const hasMoreHints = hintsShown < hints.length;

  async function check() {
    setRunning(true);
    const res = await runCode(code);
    setLogs(res.error ? [...res.logs, `⛔ ${res.error}`] : res.logs);
    const r = step.tests.map((t) => ({
      text: t.text,
      ok: !res.error && t.check(res.logs, code),
      hint: t.hint,
    }));
    setResults(r);
    setRan(true);
    setRunning(false);
    setMobileTab("console"); // surface output on mobile
    if (r.length > 0 && r.every((x) => x.ok)) {
      trackLearn("step_pass", { lesson: title, step: index + 1 });
      onPass();
    }
  }

  function revealHint() {
    setHintsShown((n) => {
      const next = Math.min(hints.length, n + 1);
      if (next > n) trackLearn("hint_revealed", { lesson: title, step: index + 1, hint: next });
      return next;
    });
  }

  function revealSolution() {
    setCode(step.solution);
    trackLearn("solution_revealed", { lesson: title, step: index + 1 });
  }

  function syncScroll(e: React.UIEvent<HTMLTextAreaElement>) {
    const top = e.currentTarget.scrollTop;
    const left = e.currentTarget.scrollLeft;
    if (gutterRef.current) gutterRef.current.scrollTop = top;
    if (highlightRef.current) {
      highlightRef.current.scrollTop = top;
      highlightRef.current.scrollLeft = left;
    }
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

  /* ── Shared pane content ────────────────────────────────────────────── */

  const instructionsPaneContent = (
    <div className={cn("h-full overflow-y-auto p-6", fs ? "" : "bg-background")}>
      <div className={cn(
        "font-mono text-[0.63rem] font-bold tracking-widest uppercase",
        fs ? "" : "text-muted-foreground"
      )} style={fs ? { color: "color-mix(in oklab, var(--primary) 55%, transparent)" } : {}}>
        {title}
      </div>
      <h3 className={cn("mt-1.5 font-display text-xl font-black", fs ? "text-white/90" : "")}>
        Step {index + 1}
        <span className={cn("ml-1.5", fs ? "text-white/25" : "text-muted-foreground")}>/ {total}</span>
      </h3>
      <div className={cn("mt-4 space-y-3 text-[14.5px] leading-[1.7]", fs ? "text-white/48" : "text-muted-foreground")}>
        {step.instructions.split("\n\n").map((p, i) => <p key={i}>{inline(p, fs)}</p>)}
      </div>
      {step.example && (
        <div className="mt-5">
          <div className={cn("mb-1.5 font-mono text-[0.65rem] font-semibold tracking-wider uppercase", fs ? "text-white/25" : "text-muted-foreground")}>
            Example
          </div>
          <pre className="overflow-x-auto rounded-xl p-3.5 font-mono text-xs leading-relaxed text-[#d4d8e8]" style={{ background: fs ? "#07080d" : "#0b0c10" }}>
            <code>{step.example}</code>
          </pre>
        </div>
      )}
    </div>
  );

  const editorPaneContent = (
    <div className="flex h-full flex-col bg-[#0b0c10]">
      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-3 py-2">
        <span className="font-mono text-xs text-white/40">main.js</span>
        <div className="flex items-center gap-0.5">
          <button onClick={() => setCode(step.starter)} className="grid size-7 place-items-center rounded-md text-white/40 transition-colors hover:bg-white/[0.08] hover:text-white cursor-pointer" aria-label="Reset code">
            <RotateCcw className="size-3.5" />
          </button>
          {hints.length > 0 && hasMoreHints && (
            <button onClick={revealHint} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-amber-400/70 transition-colors hover:bg-amber-400/10 hover:text-amber-300 cursor-pointer" aria-label="Reveal a hint">
              <Lightbulb className="size-3.5" /> Hint {hintsShown > 0 ? `${hintsShown}/${hints.length}` : ""}
            </button>
          )}
          <button onClick={revealSolution} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-white/40 transition-colors hover:bg-white/[0.08] hover:text-white cursor-pointer">
            <Eye className="size-3.5" /> Solution
          </button>
          <button onClick={() => setFullscreen((f) => !f)} className="hidden size-7 place-items-center rounded-md text-white/40 transition-colors hover:bg-white/[0.08] hover:text-white cursor-pointer lg:grid" aria-label={fs ? "Exit fullscreen" : "Fullscreen"}>
            {fs ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </button>
        </div>
      </div>
      {hintsShown > 0 && (
        <div className="shrink-0 space-y-1.5 border-b border-amber-400/10 bg-amber-400/[0.04] px-3 py-2.5">
          {hints.slice(0, hintsShown).map((h, i) => (
            <div key={i} className="flex items-start gap-2 text-[0.78rem] leading-relaxed text-amber-200/70">
              <Lightbulb className="mt-0.5 size-3 shrink-0 text-amber-400/60" />
              <span>{inline(h, true)}</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex min-h-0 flex-1">
        <div ref={gutterRef} className="select-none overflow-hidden border-r border-white/[0.05] py-3 pl-3 pr-2 text-right font-mono text-xs leading-[1.6] text-white/20" aria-hidden>
          {Array.from({ length: lineCount }, (_, i) => <div key={i}>{i + 1}</div>)}
        </div>
        <div className="relative min-h-0 flex-1">
          <pre
            ref={highlightRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 m-0 overflow-hidden whitespace-pre-wrap break-words py-3 pl-3 pr-4 font-mono text-[0.82rem] leading-[1.6] text-[#e6e8f0]"
          >
            <code dangerouslySetInnerHTML={{ __html: highlighted }} />
          </pre>
          <textarea
            ref={taRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={onKeyDown}
            onScroll={syncScroll}
            spellCheck={false}
            className="absolute inset-0 h-full w-full resize-none whitespace-pre-wrap break-words bg-transparent py-3 pl-3 pr-4 font-mono text-[0.82rem] leading-[1.6] text-transparent caret-[#e6e8f0] outline-none"
            aria-label="Code editor"
          />
        </div>
      </div>
    </div>
  );

  const consolePaneContent = (
    <div className="flex h-full flex-col" style={{ background: fs ? "#07080c" : "#08090d" }}>
      <div className={cn("shrink-0 border-b px-3 py-2 font-mono text-xs", fs ? "border-white/[0.05] text-white/35" : "border-white/[0.06] text-white/45")}>
        Console
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3 font-mono text-[0.78rem] leading-relaxed">
        {logs.length === 0 ? (
          <span className="text-white/20">Press Check to run your code…</span>
        ) : (
          logs.map((l, i) => (
            <div key={i} className={cn("whitespace-pre-wrap", l.startsWith("⛔") ? "text-[#ff6b6b]" : "text-white/70")}>{l}</div>
          ))
        )}
      </div>
      {ran && (
        fs ? (
          <div className="shrink-0 border-t border-white/[0.05] p-3 space-y-1.5">
            {results.map((r, i) => (
              <div key={i}>
                <div className={cn("flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[0.72rem] font-medium", r.ok ? "border-[#34d8b0]/[0.18] bg-[#34d8b0]/[0.07] text-[#34d8b0]" : "border-[#ff6b6b]/[0.18] bg-[#ff6b6b]/[0.07] text-[#ff6b6b]/70")}>
                  {r.ok ? <Check className="size-3 shrink-0" /> : <X className="size-3 shrink-0" />}
                  {r.text}
                </div>
                {!r.ok && r.hint && (
                  <p className="mt-1 pl-2.5 text-[0.7rem] leading-relaxed text-amber-200/60">💡 {inline(r.hint, true)}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="shrink-0 space-y-1.5 border-t border-white/[0.06] p-3">
            {results.map((r, i) => (
              <div key={i}>
                <div className="flex items-start gap-2 text-xs">
                  {r.ok ? <Check className="mt-0.5 size-3.5 shrink-0 text-[#34d8b0]" /> : <X className="mt-0.5 size-3.5 shrink-0 text-[#ff6b6b]" />}
                  <span className={r.ok ? "text-white/70" : "text-white/50"}>{r.text}</span>
                </div>
                {!r.ok && r.hint && (
                  <p className="mt-1 pl-6 text-[0.72rem] leading-relaxed text-amber-200/55">💡 {inline(r.hint, true)}</p>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );

  const footerContent = (
    <div className={cn("flex shrink-0 items-center justify-between gap-3 px-5 py-3.5", fs ? "bg-[#0d0f1c] border-t border-white/[0.05]" : "bg-background border-t border-card-border")}>
      <button onClick={onPrev} disabled={!onPrev} className={cn("inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed", fs ? "text-white/35 hover:bg-white/[0.06] hover:text-white/70" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
        <ArrowLeft className="size-4" /> Back
      </button>
      <div className="flex items-center gap-2.5">
        {allOk && (
          <span className={cn("hidden items-center gap-1.5 text-sm font-semibold sm:inline-flex", fs ? "text-[#34d8b0]" : "text-success")}>
            <Check className="size-4" /> Passed
          </span>
        )}
        <button onClick={check} disabled={running} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 font-display text-sm font-bold text-primary-foreground shadow-[0_8px_24px_-6px_color-mix(in_oklab,var(--primary)_65%,transparent)] transition-[filter,box-shadow] hover:brightness-110 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed">
          {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
          <span className="hidden sm:inline">Check your code</span>
          <span className="sm:hidden">Check</span>
        </button>
        <button onClick={onNext} disabled={!onNext || (!passed && !allOk)} className={cn("inline-flex items-center gap-1.5 rounded-full border px-5 py-2.5 font-display text-sm font-bold backdrop-blur-sm transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed", fs ? "border-white/[0.12] bg-white/[0.06] text-white/65 hover:bg-white/[0.11] hover:text-white" : "border-card-border bg-card/40 text-foreground hover:border-primary/40 hover:bg-primary/10 hover:text-primary")}>
          Next <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );

  /* ── Mobile tab bar ─────────────────────────────────────────────────── */
  const MOBILE_TABS: { id: MobileTab; label: string; icon: typeof FileText }[] = [
    { id: "instructions", label: "Steps", icon: FileText },
    { id: "code", label: "Code", icon: Code2 },
    { id: "console", label: "Console", icon: SquareTerminal },
  ];
  const mobileTabBar = (
    <div className={cn("flex shrink-0 items-center gap-1 border-b p-1.5", fs ? "border-white/[0.06] bg-[#0d0f1c]" : "border-card-border bg-muted/40")}>
      {MOBILE_TABS.map((t) => {
        const active = mobileTab === t.id;
        const showDot = t.id === "console" && ran && !active;
        return (
          <button
            key={t.id}
            onClick={() => setMobileTab(t.id)}
            className={cn(
              "relative flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors cursor-pointer",
              active
                ? fs ? "bg-white/[0.1] text-white" : "bg-primary/15 text-primary"
                : fs ? "text-white/40 hover:text-white/70" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="size-3.5" /> {t.label}
            {showDot && <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-[#34d8b0]" />}
          </button>
        );
      })}
    </div>
  );

  /* ── Pane row (shared between modes) ────────────────────────────────── */
  const paneRow = (
    <>
      {/* Desktop: resizable 3-pane */}
      <div ref={paneRowRef} className="hidden min-h-0 flex-1 lg:flex">
        {/* Instructions */}
        <div className="shrink-0 overflow-hidden" style={{ width: `${sizes[0]}%`, background: fs ? "#0c0e1a" : undefined }}>
          {instructionsPaneContent}
        </div>
        <DragHandle onMouseDown={(e) => startResize(0, e)} />
        {/* Editor */}
        <div style={{ width: `${sizes[1]}%` }} className="shrink-0 overflow-hidden">
          {editorPaneContent}
        </div>
        <DragHandle onMouseDown={(e) => startResize(1, e)} />
        {/* Console — takes remaining space */}
        <div className="min-w-[15%] flex-1 overflow-hidden">
          {consolePaneContent}
        </div>
      </div>

      {/* Mobile: tabbed single pane */}
      <div className="flex min-h-0 flex-1 flex-col lg:hidden">
        {mobileTabBar}
        <div className="min-h-0 flex-1 overflow-hidden">
          {mobileTab === "instructions" && instructionsPaneContent}
          {mobileTab === "code" && editorPaneContent}
          {mobileTab === "console" && consolePaneContent}
        </div>
      </div>
    </>
  );

  /* ── Normal mode ─────────────────────────────────────────────────────── */
  if (!fullscreen) {
    return (
      <>
        {dragging && <div className="fixed inset-0 z-[9999] cursor-col-resize" />}
        <div className="flex h-[78vh] flex-col overflow-hidden rounded-2xl border border-card-border bg-card-border lg:h-[68vh]">
          {paneRow}
          {footerContent}
        </div>
      </>
    );
  }

  /* ── Fullscreen focus mode ───────────────────────────────────────────── */
  const progressPct = Math.round(((index + 1) / total) * 100);

  return (
    <>
      {dragging && <div className="fixed inset-0 z-[9999] cursor-col-resize" />}
      <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: "#090b11" }}>

        {/* Focus header */}
        <header className="relative flex shrink-0 items-center justify-between px-5" style={{ height: "2.875rem", background: "#0d0f1c" }}>
          {/* Progress line at bottom */}
          <div className="absolute bottom-0 inset-x-0 h-[1px]" style={{ background: "rgba(255,255,255,0.05)" }}>
            <div className="h-full transition-[width] duration-700 ease-out" style={{ width: `${progressPct}%`, background: "linear-gradient(to right, var(--primary), color-mix(in oklab, var(--primary) 50%, transparent))" }} />
          </div>
          {/* Left */}
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="size-1.5 shrink-0 rounded-full" style={{ background: "var(--primary)", opacity: 0.6 }} />
            <span className="truncate font-mono text-[0.65rem] font-semibold tracking-widest text-white/30 uppercase">{title}</span>
          </div>
          {/* Center — step dots */}
          <div className="absolute inset-x-0 flex justify-center pointer-events-none">
            <div className="flex items-center gap-[5px]">
              {Array.from({ length: total }, (_, i) => (
                <span key={i} className="rounded-full transition-all duration-300" style={{ width: i === index ? "1.375rem" : "0.375rem", height: "0.375rem", background: i <= index ? "var(--primary)" : "rgba(255,255,255,0.12)", opacity: i < index ? 0.45 : 1 }} />
              ))}
            </div>
          </div>
          {/* Right */}
          <button onClick={() => setFullscreen(false)} className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-[0.65rem] font-semibold tracking-widest text-white/30 uppercase transition-colors hover:bg-white/[0.06] hover:text-white/65 cursor-pointer" aria-label="Exit fullscreen">
            <Minimize2 className="size-3" /> <span>Esc</span>
          </button>
        </header>

        {/* Dark pane row + footer */}
        <div className="flex flex-1 min-h-0 flex-col" style={{ background: "rgba(255,255,255,0.035)" }}>
          {paneRow}
          {footerContent}
        </div>
      </div>
    </>
  );
}
