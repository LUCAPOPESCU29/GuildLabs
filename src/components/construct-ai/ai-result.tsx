"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import {
  Sparkles,
  Rocket,
  RotateCcw,
  Network,
  Orbit,
  WifiOff,
  Loader2,
} from "lucide-react";
import type { Blueprint } from "@/lib/blueprint";
import { aiBlueprintToDeployJSON } from "@/lib/construct-deploy";
import { Button } from "@/components/ui/button";
import { DeployDialog } from "@/components/deploy-dialog";
import { BorderBeam } from "@/components/fx/border-beam";
import { BlurFade, Typewriter, Confetti } from "./magic";
import { BlueprintEditor } from "./blueprint-editor";
import { CountUp } from "@/components/ui/count-up";
import { cn } from "@/lib/utils";

const VizFallback = ({ label }: { label: string }) => (
  <div className="flex h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
    <Loader2 className="size-4 animate-spin text-primary" /> {label}
  </div>
);

const ServerGalaxy = dynamic(() => import("./server-galaxy"), {
  ssr: false,
  loading: () => <VizFallback label="Loading 3D scene…" />,
});
const StructureTree = dynamic(() => import("./structure-tree"), {
  ssr: false,
  loading: () => <VizFallback label="Drawing structure…" />,
});

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="glass rounded-2xl px-3 py-3 text-center">
      <div className="font-display text-2xl text-foreground">
        <CountUp value={value} />
      </div>
      <div className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

export function AiResult({
  initial,
  source,
  onRestart,
}: {
  initial: Blueprint;
  source: "ai" | "offline";
  onRestart: () => void;
}) {
  const [bp, setBp] = React.useState<Blueprint>(initial);
  const [viz, setViz] = React.useState<"galaxy" | "tree">("tree");
  const [deployOpen, setDeployOpen] = React.useState(false);
  const [deployed, setDeployed] = React.useState(false);

  const deployJSON = React.useMemo(() => aiBlueprintToDeployJSON(bp), [bp]);

  return (
    <div className="space-y-6">
      <Confetti fire={deployed} />

      {/* hero galaxy */}
      <div className="glass-strong relative h-52 overflow-hidden rounded-3xl">
        <BorderBeam duration={8} />
        <div className="absolute inset-0">
          <ServerGalaxy categoryCount={bp.stats.categories} />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-secondary">
            <Sparkles className="size-4" /> AI BLUEPRINT
            {source === "offline" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-coral/15 px-2 py-0.5 text-[0.65rem] font-semibold text-coral">
                <WifiOff className="size-3" /> Offline draft
              </span>
            )}
          </div>
          <h3 className="mt-1 font-display text-3xl font-black text-foreground">
            <Typewriter text={initial.name} />
          </h3>
        </div>
      </div>

      {/* summary + stats */}
      <BlurFade delay={0.05}>
        <div className="grain glass rounded-3xl p-5">
          <p className="text-sm text-muted-foreground">
            <Typewriter text={initial.summary} speed={10} />
          </p>
          <p className="mt-3 rounded-xl bg-muted/60 p-3 text-sm text-foreground/90">{initial.mixNote}</p>
          {source === "offline" && (
            <p className="mt-3 rounded-xl border border-coral/30 bg-coral/10 p-3 text-xs text-foreground/80">
              This draft was generated offline (no <code className="font-mono">GROQ_API_KEY</code> set).
              It&apos;s a real, editable blueprint — add a key to get fully AI-tailored results.
            </p>
          )}
          <div className="mt-4 grid grid-cols-4 gap-2">
            <Stat value={bp.stats.categories} label="Cats" />
            <Stat value={bp.stats.channels} label="Chans" />
            <Stat value={bp.stats.voice} label="Voice" />
            <Stat value={bp.stats.roles} label="Roles" />
          </div>
        </div>
      </BlurFade>

      {/* editor + viz */}
      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <BlurFade delay={0.1} className="glass-strong rounded-3xl p-5">
          <h3 className="mb-4 font-display text-xl text-foreground">Refine your server</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Drag to reorder, move channels between categories, rename, and tweak roles. Changes
            update the map and deploy live.
          </p>
          <BlueprintEditor blueprint={initial} onChange={setBp} />
        </BlurFade>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <BlurFade delay={0.15} className="glass rounded-3xl p-4">
            {/* viz toggle */}
            <div className="mb-3 flex gap-1 rounded-full bg-muted/50 p-1">
              {([
                { id: "galaxy", label: "Galaxy", icon: Orbit },
                { id: "tree", label: "Structure", icon: Network },
              ] as const).map((t) => {
                const Icon = t.icon;
                const on = viz === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setViz(t.id)}
                    aria-pressed={on}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      on ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="size-4" /> {t.label}
                  </button>
                );
              })}
            </div>

            {viz === "galaxy" ? (
              <div className="h-72 overflow-hidden rounded-2xl bg-background-deep/40">
                <ServerGalaxy categoryCount={bp.stats.categories} />
              </div>
            ) : (
              <StructureTree blueprint={bp} />
            )}

            <div className="mt-4 space-y-2">
              <Button variant="accent" size="lg" className="w-full" onClick={() => setDeployOpen(true)}>
                <Rocket className="size-5" /> Deploy to Discord
              </Button>
              <Button variant="ghost" size="lg" className="w-full" onClick={onRestart}>
                <RotateCcw className="size-4" /> Start over
              </Button>
            </div>
          </BlurFade>
        </aside>
      </div>

      <DeployDialog
        open={deployOpen}
        onClose={() => setDeployOpen(false)}
        blueprint={deployJSON}
        onDeployed={() => setDeployed(true)}
      />
    </div>
  );
}
