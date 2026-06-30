"use client";

import * as React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/lib/learn/quizzes";

export function Quiz({ questions, onComplete }: { questions: QuizQuestion[]; onComplete?: (score: number) => void }) {
  const [picked, setPicked] = React.useState<Record<string, number>>({});
  const answered = Object.keys(picked).length;
  const score = questions.reduce((n, q) => n + (picked[q.id] === q.answer ? 1 : 0), 0);
  const allDone = answered === questions.length;

  React.useEffect(() => {
    if (allDone) onComplete?.(score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone]);

  return (
    <div className="space-y-6">
      {questions.map((q, qi) => {
        const choice = picked[q.id];
        const locked = choice !== undefined;
        return (
          <div key={q.id} className="glass rounded-2xl p-5">
            <p className="font-display font-bold">
              <span className="text-muted-foreground">{qi + 1}.</span> {q.q}
            </p>
            <div className="mt-3 space-y-2" role="radiogroup" aria-label={q.q}>
              {q.options.map((opt, oi) => {
                const isCorrect = oi === q.answer;
                const isChosen = choice === oi;
                const show = locked && (isChosen || isCorrect);
                return (
                  <button
                    key={oi}
                    role="radio"
                    aria-checked={isChosen}
                    disabled={locked}
                    onClick={() => setPicked((p) => ({ ...p, [q.id]: oi }))}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors",
                      !locked && "border-card-border bg-card/40 hover:border-primary/40 hover:bg-primary/5 cursor-pointer",
                      show && isCorrect && "border-success/50 bg-success/10",
                      show && isChosen && !isCorrect && "border-destructive/50 bg-destructive/10",
                      locked && !show && "border-card-border opacity-50"
                    )}
                  >
                    <span className="flex-1">{opt}</span>
                    {show && isCorrect && <Check className="size-4 text-success" />}
                    {show && isChosen && !isCorrect && <X className="size-4 text-destructive" />}
                  </button>
                );
              })}
            </div>
            {locked && (
              <p className="mt-3 rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground" aria-live="polite">
                {q.explain}
              </p>
            )}
          </div>
        );
      })}

      <div className="glass rounded-2xl p-5 text-center">
        {allDone ? (
          <>
            <p className="font-display text-2xl font-black">
              {score}/{questions.length} {score === questions.length ? "— perfect 🎉" : score >= questions.length - 1 ? "— nicely done" : "— keep going"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Scroll back up to review any you missed.</p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{answered}/{questions.length} answered</p>
        )}
      </div>
    </div>
  );
}
