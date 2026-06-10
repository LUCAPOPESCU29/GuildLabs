"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Hash,
  Volume2,
  Radio,
  MessageSquare,
  Rocket,
  Pencil,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  LayoutList,
  Braces,
  Sparkles,
} from "lucide-react";
import type { WizardState, Blueprint } from "@/lib/blueprint";
import { toJSON } from "@/lib/blueprint";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BorderBeam } from "@/components/fx/border-beam";
import { cn } from "@/lib/utils";
import { DeployDialog } from "@/components/deploy-dialog";

const channelIcon = (type: string) =>
  type === "voice" ? Volume2 : type === "stage" ? Radio : type === "forum" ? MessageSquare : Hash;

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="glass rounded-2xl px-3 py-3 text-center">
      <div className="font-display text-2xl text-foreground">{value}</div>
      <div className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

export function PreviewPanel({
  state,
  blueprint,
  onEdit,
  onRegenerate,
}: {
  state: WizardState;
  blueprint: Blueprint;
  onEdit: () => void;
  onRegenerate: () => void;
}) {
  const [tab, setTab] = React.useState<"layout" | "roles" | "json">("layout");
  const [copied, setCopied] = React.useState(false);
  const [deployOpen, setDeployOpen] = React.useState(false);

  const blueprintJSON = React.useMemo(
    () => toJSON(state, blueprint),
    [state, blueprint]
  );
  const json = React.useMemo(
    () => JSON.stringify(blueprintJSON, null, 2),
    [blueprintJSON]
  );

  async function copyJSON() {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      toast.success("Blueprint JSON copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  }

  const tabs = [
    { id: "layout", label: "Channels", icon: LayoutList },
    { id: "roles", label: "Roles", icon: ShieldCheck },
    { id: "json", label: "JSON", icon: Braces },
  ] as const;

  return (
    <div className="space-y-5">
      {/* header + mix note */}
      <div className="relative overflow-hidden rounded-3xl">
        <div className="glass-strong relative rounded-3xl p-5">
          <BorderBeam duration={7} />
          <div className="flex items-center gap-2 text-xs font-medium text-secondary">
            <Sparkles className="size-4" /> AI BLUEPRINT
          </div>
          <h3 className="mt-1 font-display text-2xl text-foreground">{blueprint.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{blueprint.summary}</p>
          <p className="mt-3 rounded-xl bg-muted/60 p-3 text-sm text-foreground/90">
            {blueprint.mixNote}
          </p>
          <div className="mt-4 grid grid-cols-4 gap-2">
            <Stat value={blueprint.stats.categories} label="Cats" />
            <Stat value={blueprint.stats.channels} label="Chans" />
            <Stat value={blueprint.stats.voice} label="Voice" />
            <Stat value={blueprint.stats.roles} label="Roles" />
          </div>
        </div>
      </div>

      {/* tabs */}
      <div className="glass flex gap-1 rounded-full p-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "relative flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-medium cursor-pointer transition-colors duration-300",
                active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {active && (
                <motion.span
                  layoutId="preview-tab"
                  className="absolute inset-0 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className="relative size-4" />
              <span className="relative">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* tab body */}
      <div className="glass min-h-[18rem] rounded-3xl p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            {tab === "layout" && (
              <div className="space-y-4 font-mono text-sm">
                {blueprint.categories.map((cat) => (
                  <div key={cat.name}>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      <span>{cat.emoji}</span>
                      {cat.name}
                    </div>
                    <ul className="mt-1.5 space-y-0.5">
                      {cat.channels.map((ch) => {
                        const Icon = channelIcon(ch.type);
                        return (
                          <li
                            key={ch.name + ch.type}
                            className="flex items-center gap-2 rounded-lg px-2 py-1 text-foreground/80 transition-colors hover:bg-muted/70"
                          >
                            <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate">{ch.name}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {tab === "roles" && (
              <ul className="space-y-2">
                {blueprint.roles.map((r) => (
                  <li
                    key={r.name}
                    className="flex items-center gap-3 rounded-xl bg-muted/50 p-3"
                  >
                    <span
                      className="size-3 shrink-0 rounded-full"
                      style={{ background: r.color, boxShadow: `0 0 10px ${r.color}` }}
                    />
                    <span
                      className="font-display text-sm tracking-wide"
                      style={{ color: r.color }}
                    >
                      {r.name}
                    </span>
                    {r.hoist && (
                      <span className="rounded-md bg-background/60 px-1.5 py-0.5 text-[0.6rem] uppercase tracking-wider text-muted-foreground">
                        hoisted
                      </span>
                    )}
                    <span className="ml-auto truncate text-xs text-muted-foreground">
                      {r.perms}
                    </span>
                  </li>
                ))}
                <li className="mt-3 border-t border-muted pt-3">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Permissions summary
                  </div>
                  <ul className="space-y-1.5">
                    {blueprint.permissions.map((p, i) => (
                      <li key={i} className="flex gap-2 text-sm text-foreground/80">
                        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-secondary" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </li>
              </ul>
            )}

            {tab === "json" && (
              <div className="relative">
                <button
                  onClick={copyJSON}
                  className="glass absolute right-2 top-2 z-10 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs cursor-pointer transition-colors hover:text-primary"
                >
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <pre className="max-h-72 overflow-auto rounded-2xl bg-background-deep/80 p-4 text-xs leading-relaxed text-foreground/90">
                  {json}
                </pre>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Button
          variant="accent"
          size="lg"
          className="col-span-2 sm:col-span-2"
          onClick={() => setDeployOpen(true)}
        >
          <Rocket className="size-5" /> Deploy to Discord
        </Button>
        <Button variant="glass" size="lg" onClick={onEdit}>
          <Pencil className="size-4" /> Edit
        </Button>
        <Button variant="outline" size="lg" onClick={onRegenerate}>
          <RefreshCw className="size-4" /> Regenerate
        </Button>
      </div>

      <DeployDialog
        open={deployOpen}
        onClose={() => setDeployOpen(false)}
        blueprint={blueprintJSON}
      />
    </div>
  );
}
