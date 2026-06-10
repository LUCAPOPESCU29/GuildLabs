"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, Loader2, Sparkles } from "lucide-react";
import type { Blueprint } from "@/lib/blueprint";
import type { AiAnswer } from "@/lib/construct-ai";
import { Button } from "@/components/ui/button";
import { DescribeBox } from "./describe-box";
import { TosGate, hasAcceptedTos } from "./tos-gate";
import { ClarifyChat } from "./clarify-chat";
import { AiResult } from "./ai-result";
import { Typewriter, ShimmerLine } from "./magic";
import type { GenerateOk } from "@/app/api/construct/generate/route";
import type { ConstructError } from "@/lib/construct-ai";

type Phase = "describe" | "tos" | "clarify" | "generating" | "result" | "error";

export function AiBuilder() {
  const reduce = useReducedMotion();
  const [phase, setPhase] = React.useState<Phase>("describe");
  const [description, setDescription] = React.useState("");
  const [answers, setAnswers] = React.useState<AiAnswer[]>([]);
  const [blueprint, setBlueprint] = React.useState<Blueprint | null>(null);
  const [source, setSource] = React.useState<"ai" | "offline">("ai");
  const [errorMsg, setErrorMsg] = React.useState("");
  const runToken = React.useRef(0);

  const runGenerate = React.useCallback(
    async (desc: string, ans: AiAnswer[]) => {
      const token = ++runToken.current;
      setPhase("generating");
      try {
        const res = await fetch("/api/construct/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: desc, answers: ans }),
        });
        const data = (await res.json()) as GenerateOk | ConstructError;
        if (token !== runToken.current) return; // superseded
        if ("ok" in data && data.ok) {
          setBlueprint(data.blueprint);
          setSource(data.source === "offline" ? "offline" : "ai");
          setPhase("result");
        } else {
          setErrorMsg(("error" in data && data.error) || "Couldn't generate a blueprint.");
          setPhase("error");
        }
      } catch {
        if (token !== runToken.current) return;
        setErrorMsg("Network error — please try again.");
        setPhase("error");
      }
    },
    []
  );

  const onClarifyDone = React.useCallback(
    (a: AiAnswer[]) => {
      setAnswers(a);
      void runGenerate(description, a);
    },
    [description, runGenerate]
  );

  function startFromDescribe() {
    if (!hasAcceptedTos()) {
      setPhase("tos");
    } else {
      setPhase("clarify");
    }
  }

  function reset() {
    runToken.current++;
    setAnswers([]);
    setBlueprint(null);
    setPhase("describe");
  }

  const fade = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -12 },
        transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const },
      };

  return (
    <div className="mx-auto w-full max-w-3xl px-4">
      <AnimatePresence mode="wait">
        {phase === "describe" && (
          <motion.div key="describe" {...fade}>
            <DescribeBox value={description} onChange={setDescription} onSubmit={startFromDescribe} />
          </motion.div>
        )}

        {phase === "tos" && (
          <motion.div key="tos" {...fade}>
            <TosGate onAccept={() => setPhase("clarify")} />
          </motion.div>
        )}

        {phase === "clarify" && (
          <motion.div key="clarify" {...fade}>
            <ClarifyChat description={description} onDone={onClarifyDone} />
          </motion.div>
        )}

        {phase === "generating" && (
          <motion.div key="generating" {...fade}>
            <GeneratingPanel />
          </motion.div>
        )}

        {phase === "result" && blueprint && (
          <motion.div key="result" {...fade} className="max-w-3xl">
            <AiResult initial={blueprint} source={source} onRestart={reset} />
          </motion.div>
        )}

        {phase === "error" && (
          <motion.div key="error" {...fade}>
            <div className="glass-strong rounded-3xl p-8 text-center">
              <div className="mx-auto grid size-16 place-items-center rounded-full bg-destructive/15 text-destructive">
                <AlertCircle className="size-8" />
              </div>
              <h2 className="mt-4 font-display text-2xl font-black">Couldn&apos;t generate</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{errorMsg}</p>
              <div className="mt-6 flex justify-center gap-2">
                <Button variant="outline" size="lg" onClick={() => setPhase("describe")}>
                  Edit description
                </Button>
                <Button size="lg" onClick={() => runGenerate(description, answers)}>
                  Try again
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GeneratingPanel() {
  return (
    <div className="glass-strong rounded-3xl p-8">
      <div className="flex items-center gap-2 text-xs font-medium text-secondary">
        <Sparkles className="size-4" /> BUILDING
      </div>
      <h2 className="mt-1 font-display text-2xl tracking-wide text-foreground">
        <Typewriter text="Designing your server…" />
      </h2>
      <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin text-primary" />
        Laying out categories, channels and roles.
      </p>
      <div className="mt-6 space-y-5">
        {[3, 4, 3].map((rows, ci) => (
          <div key={ci}>
            <ShimmerLine className="h-3 w-28" />
            <div className="mt-2 space-y-1.5 pl-4">
              {Array.from({ length: rows }).map((_, ri) => (
                <ShimmerLine key={ri} className="h-2.5" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
