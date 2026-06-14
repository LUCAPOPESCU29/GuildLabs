"use client";

/**
 * Live "try /ask" widget for the Maven page. Hits the same
 * `/api/playground/ask` endpoint as the playground (Groq when configured, a
 * deterministic offline knowledge base otherwise). Accent passed in by host.
 */

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2, MessageCircleQuestion, Send } from "lucide-react";

const SUGGESTIONS = [
  "What is GuildLabs?",
  "How does Construct build a server?",
  "Is ChartIt free?",
  "What makes Maven private?",
];

type Answer = { text: string; source?: "ai" | "offline" };

export function AskDemo({ accent }: { accent: string }) {
  const reduce = useReducedMotion();
  const [q, setQ] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [answer, setAnswer] = React.useState<Answer | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const run = React.useCallback(async (raw: string) => {
    const question = raw.trim();
    if (!question || busy) return;
    setBusy(true);
    setError(null);
    setAnswer(null);
    try {
      const res = await fetch("/api/playground/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.answer) {
        setError(json?.error || "Couldn't get an answer — try again.");
      } else {
        setAnswer({ text: json.answer, source: json.source });
      }
    } catch {
      setError("Network hiccup — try again.");
    } finally {
      setBusy(false);
    }
  }, [busy]);

  return (
    <div className="glass-strong mx-auto w-full max-w-xl rounded-3xl p-5 sm:p-6" style={{ ["--demo-accent" as string]: accent }}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
        <MessageCircleQuestion className="size-4" /> Try it live
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(q);
        }}
        className="mt-3 flex gap-2"
      >
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground">/ask</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ask anything about GuildLabs…"
            aria-label="Your question"
            maxLength={500}
            className="glass-input w-full rounded-2xl py-3 pl-[3.25rem] pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <button
          type="submit"
          disabled={busy || !q.trim()}
          className="grid size-12 shrink-0 place-items-center rounded-2xl text-white transition-opacity disabled:opacity-50 cursor-pointer"
          style={{ background: accent }}
          aria-label="Ask"
        >
          {busy ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setQ(s);
              run(s);
            }}
            className="rounded-full border border-card-border bg-muted/40 px-2.5 py-1 text-xs text-foreground/80 transition-colors hover:border-[var(--demo-accent)]/50 hover:text-foreground cursor-pointer"
          >
            {s}
          </button>
        ))}
      </div>

      {(answer || error || busy) && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-2xl bg-[#1e1f22] p-4 text-left"
        >
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-full text-xs font-bold text-white" style={{ background: accent }}>
              M
            </span>
            <span className="font-display text-sm font-bold text-white">Maven</span>
            <span className="rounded bg-[#5865f2] px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-white">Bot</span>
            {answer?.source === "offline" && (
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[0.6rem] font-medium text-white/60">offline demo</span>
            )}
          </div>
          <div className="mt-2 text-sm leading-relaxed text-white/85">
            {busy ? <span className="text-white/40">Maven is thinking…</span> : error ? <span className="text-[#f2b8b5]">{error}</span> : answer?.text}
          </div>
        </motion.div>
      )}
    </div>
  );
}
