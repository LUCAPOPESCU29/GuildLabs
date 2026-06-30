"use client";

import * as React from "react";
import { Lightbulb, Eye, EyeOff, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CodeBlock } from "@/components/ui/code-block";
import type { Lab as LabData } from "@/lib/learn/labs";

const DIFF: Record<LabData["difficulty"], string> = {
  Easy: "text-success bg-success/10",
  Medium: "text-amber-500 bg-amber-500/10",
  Hard: "text-destructive bg-destructive/10",
};

export function Lab({ lab, onComplete }: { lab: LabData; onComplete?: () => void }) {
  const [checked, setChecked] = React.useState<boolean[]>(() => lab.checkpoints.map(() => false));
  const [showHint, setShowHint] = React.useState(false);
  const [showSolution, setShowSolution] = React.useState(false);
  const allChecked = checked.every(Boolean);

  React.useEffect(() => {
    if (allChecked) onComplete?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allChecked]);

  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex items-center gap-3">
        <span className={cn("rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-widest", DIFF[lab.difficulty])}>
          {lab.difficulty}
        </span>
        <h3 className="font-display text-xl font-black">{lab.title}</h3>
      </div>
      <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{lab.goal}</p>

      <div className="mt-4 space-y-2">
        {lab.checkpoints.map((cp, i) => (
          <label key={i} className="flex cursor-pointer items-start gap-3 text-sm text-foreground/85">
            <button
              type="button"
              onClick={() => setChecked((c) => c.map((v, j) => (j === i ? !v : v)))}
              aria-pressed={checked[i]}
              className={cn(
                "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-colors cursor-pointer",
                checked[i] ? "border-success bg-success text-white" : "border-card-border hover:border-primary/50"
              )}
            >
              {checked[i] && <Check className="size-3.5" strokeWidth={3} />}
            </button>
            <span className={cn(checked[i] && "text-muted-foreground line-through")}>{cp}</span>
          </label>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => setShowHint((s) => !s)} className="inline-flex items-center gap-1.5 rounded-lg border border-card-border bg-card/40 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-primary/10 cursor-pointer">
          <Lightbulb className="size-3.5" /> {showHint ? "Hide hint" : "Hint"}
        </button>
        <button onClick={() => setShowSolution((s) => !s)} className="inline-flex items-center gap-1.5 rounded-lg border border-card-border bg-card/40 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-primary/10 cursor-pointer">
          {showSolution ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />} {showSolution ? "Hide solution" : "Reveal solution"}
        </button>
      </div>

      {showHint && <p className="mt-3 rounded-xl bg-accent/[0.07] p-3 text-sm text-foreground/75">{lab.hint}</p>}
      {showSolution && (
        <div className="mt-3">
          <CodeBlock code={lab.solution.code} filename={lab.solution.filename} language={lab.solution.language} />
        </div>
      )}
    </div>
  );
}
