"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Loader2, MessageCircleQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlurFade, Typewriter } from "./magic";
import { cn } from "@/lib/utils";
import type { AiAnswer, ClarifyQuestion, ClarifyResult } from "@/lib/construct-ai";

type Draft = Record<string, string>;

async function fetchClarify(description: string, answers: AiAnswer[]): Promise<ClarifyResult> {
  try {
    const res = await fetch("/api/construct/clarify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, answers }),
    });
    if (!res.ok) return { done: true };
    return (await res.json()) as ClarifyResult;
  } catch {
    return { done: true };
  }
}

export function ClarifyChat({
  description,
  onDone,
}: {
  description: string;
  onDone: (answers: AiAnswer[]) => void;
}) {
  const [answers, setAnswers] = React.useState<AiAnswer[]>([]);
  const [questions, setQuestions] = React.useState<ClarifyQuestion[]>([]);
  const [draft, setDraft] = React.useState<Draft>({});
  const [loading, setLoading] = React.useState(true);
  const startedRef = React.useRef(false);

  const loadRound = React.useCallback(
    async (acc: AiAnswer[]) => {
      setLoading(true);
      setQuestions([]);
      const result = await fetchClarify(description, acc);
      if (result.done) {
        onDone(acc);
        return;
      }
      setQuestions(result.questions);
      setDraft({});
      setLoading(false);
    },
    [description, onDone]
  );

  // Kick off the first round once.
  React.useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void loadRound([]);
  }, [loadRound]);

  const allAnswered =
    questions.length > 0 && questions.every((q) => (draft[q.id] ?? "").trim().length > 0);

  function setAnswer(id: string, val: string) {
    setDraft((d) => ({ ...d, [id]: val }));
  }

  function submitRound() {
    const round: AiAnswer[] = questions.map((q) => ({
      question: q.question,
      answer: (draft[q.id] ?? "").trim(),
    }));
    const next = [...answers, ...round];
    setAnswers(next);
    void loadRound(next);
  }

  return (
    <div className="glass-strong relative overflow-hidden rounded-3xl p-6 sm:p-8">
      <div className="flex items-center gap-2 text-xs font-medium text-secondary">
        <MessageCircleQuestion className="size-4" /> A FEW QUICK QUESTIONS
      </div>

      {/* transcript of already-answered rounds */}
      {answers.length > 0 && (
        <ul className="mt-4 space-y-2">
          {answers.map((a, i) => (
            <li key={i} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">{a.question}</span>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary">
                {a.answer}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* loading */}
      {loading && (
        <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-primary" />
          <Typewriter text="Thinking about what to ask…" />
        </div>
      )}

      {/* current round */}
      <AnimatePresence mode="wait">
        {!loading && questions.length > 0 && (
          <motion.div
            key={answers.length}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-5 space-y-6"
          >
            {questions.map((q, qi) => (
              <BlurFade key={q.id} delay={qi * 0.08}>
                <fieldset>
                  <legend className="flex items-start gap-2 font-display text-lg text-foreground">
                    <Sparkles className="mt-1 size-4 shrink-0 text-secondary" />
                    <Typewriter text={q.question} />
                  </legend>

                  {q.options && q.options.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label={q.question}>
                      {q.options.map((opt) => {
                        const active = draft[q.id] === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => setAnswer(q.id, opt)}
                            className={cn(
                              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              active
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-card-border bg-muted/40 text-foreground/90 hover:border-primary/40 hover:bg-primary/10"
                            )}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {q.allowFreeText !== false && (
                    <input
                      type="text"
                      value={
                        // Show free text only when it isn't one of the chip options.
                        q.options?.includes(draft[q.id] ?? "") ? "" : draft[q.id] ?? ""
                      }
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      placeholder={q.options?.length ? "…or type your own" : "Type your answer"}
                      aria-label={`Answer: ${q.question}`}
                      className="glass-input mt-3 w-full rounded-2xl px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  )}
                </fieldset>
              </BlurFade>
            ))}

            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => onDone(answers)}
                className="rounded text-sm text-muted-foreground hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Skip &amp; generate now →
              </button>
              <Button size="lg" onClick={submitRound} disabled={!allAnswered}>
                Continue <ArrowRight className="size-5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
