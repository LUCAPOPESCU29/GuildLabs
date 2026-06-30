"use client";

/**
 * Workshop — "choose what your bot does". A behavior chooser whose selection
 * live-updates the generated code and the simulated terminal. Single-select for
 * the simple track, multi-select for the medium one.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { CodeBlock } from "@/components/ui/code-block";
import { Terminal } from "@/components/learn/terminal";
import { behaviorsFor, composeIndex, composeDeploy, composeTerminal } from "@/lib/learn/workshops";

export function Workshop({ tier, onPick }: { tier: "simple" | "medium"; onPick?: () => void }) {
  const behaviors = behaviorsFor(tier);
  const multi = tier === "medium";
  const [selected, setSelected] = React.useState<string[]>(tier === "simple" ? ["roll"] : ["roll", "serverinfo"]);
  const [tab, setTab] = React.useState<"index" | "deploy">("index");

  function toggle(id: string) {
    onPick?.();
    setSelected((s) => {
      if (!multi) return [id];
      return s.includes(id) ? s.filter((x) => x !== id) : [...s, id];
    });
  }

  const code = tab === "index" ? composeIndex(selected) : composeDeploy(selected);
  const term = composeTerminal(selected);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {behaviors.map((b) => {
          const on = selected.includes(b.id);
          return (
            <button
              key={b.id}
              onClick={() => toggle(b.id)}
              aria-pressed={on}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition-colors cursor-pointer",
                on ? "border-primary/50 bg-primary/15 text-foreground" : "border-card-border bg-card/40 text-muted-foreground hover:text-foreground"
              )}
              title={b.desc}
            >
              <span aria-hidden>{b.emoji}</span>
              <span className="font-semibold">{b.label}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-2.5 text-xs text-muted-foreground">
        {multi
          ? "Pick as many as you like — your bot composes them all. The code and terminal update live."
          : "Pick one behavior — switch between them to watch the code and terminal change."}
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-2 flex gap-1">
            {(["index", "deploy"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-lg px-2.5 py-1 font-mono text-xs font-semibold transition-colors cursor-pointer",
                  tab === t ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "index" ? "index.js" : "deploy-commands.js"}
              </button>
            ))}
          </div>
          <CodeBlock code={code} filename={tab === "index" ? "index.js" : "deploy-commands.js"} language="javascript" />
        </div>
        <Terminal lines={term} title="bash" />
      </div>
    </div>
  );
}
