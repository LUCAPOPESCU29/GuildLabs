"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Sparkles,
  Check,
  ChevronUp,
  ChevronDown,
  Trash2,
} from "lucide-react";
import {
  SERVER_TYPES,
  MODERATION,
  FEATURES,
  CHANNEL_GROUPS,
  ROLE_PACKS,
  ADVANCED,
  STEPS,
} from "@/lib/wizard-data";
import {
  initialState,
  generateBlueprint,
  ROLE_PALETTE,
  PERM_PRESET_LABELS,
  PERM_PRESET_ORDER,
  type WizardState,
  type CustomRole,
  type PermPreset,
} from "@/lib/blueprint";
import { OptionCard } from "./option-card";
import { ToggleRow } from "./toggle-row";
import { PreviewPanel } from "./preview-panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function toggle(list: string[], id: string) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

/** Live AI hint shown contextually as the user selects. */
function aiHint(state: WizardState, step: number): string | null {
  if (step === 0) {
    if (state.types.includes("gaming") && state.types.includes("community"))
      return "Smart mix detected: I'll add #clips, #lfg and a voice-lobby.";
    if (state.types.includes("gaming") && state.types.includes("school"))
      return "Unusual combo — I'll split study zones from gaming zones.";
    if (state.types.length >= 3)
      return "Big blend! I'll merge overlapping channels into one clean layout.";
  }
  if (step === 1 && state.features.includes("economy"))
    return "Economy on → I'll add a #shop channel and currency roles.";
  if (step === 4 && state.advanced.includes("verification"))
    return "Verification gates the server — new members unlock chat after verifying.";
  return null;
}

const variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -60 : 60 }),
};

/** Stable id for a new custom role (crypto.randomUUID with a safe fallback). */
function roleId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `role-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function Wizard() {
  const [state, setState] = React.useState<WizardState>(initialState);
  const [step, setStep] = React.useState(0);
  const [dir, setDir] = React.useState(1);
  const reduce = useReducedMotion();

  const set = (patch: Partial<WizardState>) => setState((s) => ({ ...s, ...patch }));
  const blueprint = React.useMemo(() => generateBlueprint(state), [state]);
  const hint = aiHint(state, step);

  // Pre-fill from query params (e.g. arriving from a template's "Build this server free").
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const name = params.get("name");
    const rawTypes = params.get("types");
    if (!name && !rawTypes) return;

    const validIds = new Set(SERVER_TYPES.map((o) => o.id));
    const types = (rawTypes?.split(",") ?? []).map((t) => t.trim()).filter((t) => validIds.has(t));

    setState((s) => ({
      ...s,
      ...(name ? { serverName: name } : {}),
      ...(types.length ? { types } : {}),
    }));

    document.getElementById("builder")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const go = (next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(Math.max(0, Math.min(STEPS.length - 1, next)));
    if (typeof window !== "undefined")
      document.getElementById("builder")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ── Custom-role editor helpers ────────────────────────────────────────────
  const addCustomRole = () => {
    const color = ROLE_PALETTE[state.customRoles.length % ROLE_PALETTE.length];
    const next: CustomRole = {
      id: roleId(),
      name: "",
      color,
      hoist: false,
      perms: "member",
    };
    set({ customRoles: [...state.customRoles, next] });
  };

  const updateCustomRole = (id: string, patch: Partial<CustomRole>) =>
    set({
      customRoles: state.customRoles.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    });

  const removeCustomRole = (id: string) =>
    set({ customRoles: state.customRoles.filter((r) => r.id !== id) });

  const moveCustomRole = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= state.customRoles.length) return;
    const next = [...state.customRoles];
    [next[index], next[target]] = [next[target], next[index]];
    set({ customRoles: next });
  };

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const canProceed = step !== 0 || state.types.length > 0;

  return (
    <section id="builder" className="relative mx-auto w-full max-w-6xl scroll-mt-24 px-4 pb-28">
      {/* progress rail */}
      <div className="glass sticky top-20 z-30 mx-auto mb-8 flex max-w-3xl items-center justify-between gap-1 rounded-full p-2">
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <button
              key={s.id}
              onClick={() => i <= step && go(i)}
              disabled={i > step}
              className={cn(
                "group relative flex flex-1 items-center justify-center gap-2 rounded-full px-2 py-2 text-xs font-medium transition-colors duration-300",
                i <= step ? "cursor-pointer" : "cursor-not-allowed",
                active ? "text-primary-foreground" : done ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {active && (
                <motion.span
                  layoutId="rail-active"
                  className="absolute inset-0 -z-0 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span
                className={cn(
                  "relative grid size-5 place-items-center rounded-full text-[0.65rem]",
                  done && "bg-secondary text-white",
                  !done && !active && "bg-muted"
                )}
              >
                {done ? <Check className="size-3" strokeWidth={3} /> : s.id}
              </span>
              <span className="relative hidden sm:inline">{s.title}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        {/* step panel */}
        <div className="glass-strong relative overflow-hidden rounded-3xl p-6 sm:p-8">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="mb-6">
                <div className="flex items-center gap-2 text-xs font-medium text-secondary">
                  STEP {current.id} / {STEPS.length}
                </div>
                <h2 className="mt-1 font-display text-2xl tracking-wide text-foreground sm:text-3xl">
                  {current.title}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{current.hint}</p>
              </div>

              {/* STEP 1 — type */}
              {step === 0 && (
                <div className="space-y-5">
                  <input
                    value={state.serverName}
                    onChange={(e) => set({ serverName: e.target.value })}
                    placeholder="Server name (e.g. Neon Nexus)"
                    className="glass-input w-full rounded-2xl px-4 py-3 font-display tracking-wide outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    {SERVER_TYPES.map((o) => (
                      <OptionCard
                        key={o.id}
                        option={o}
                        selected={state.types.includes(o.id)}
                        onToggle={() => set({ types: toggle(state.types, o.id) })}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2 — style + features */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Moderation level
                    </p>
                    <div className="grid gap-3 sm:grid-cols-3" role="radiogroup">
                      {MODERATION.map((o) => (
                        <OptionCard
                          key={o.id}
                          option={o}
                          radio
                          selected={state.moderation === o.id}
                          onToggle={() => set({ moderation: o.id })}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Features
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {FEATURES.map((o) => (
                        <ToggleRow
                          key={o.id}
                          option={o}
                          on={state.features.includes(o.id)}
                          onToggle={() => set({ features: toggle(state.features, o.id) })}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3 — channels */}
              {step === 2 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {CHANNEL_GROUPS.map((o) => (
                    <ToggleRow
                      key={o.id}
                      option={o}
                      on={state.channels.includes(o.id)}
                      onToggle={() => set({ channels: toggle(state.channels, o.id) })}
                    />
                  ))}
                </div>
              )}

              {/* STEP 4 — roles */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {ROLE_PACKS.map((o) => (
                      <OptionCard
                        key={o.id}
                        option={o}
                        selected={state.rolePacks.includes(o.id)}
                        onToggle={() => set({ rolePacks: toggle(state.rolePacks, o.id) })}
                      />
                    ))}
                  </div>
                  <div>
                    <div className="mb-2 flex items-baseline justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Custom roles
                      </p>
                      {state.customRoles.length > 0 && (
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {state.customRoles.length} custom{" "}
                          {state.customRoles.length === 1 ? "role" : "roles"}
                        </span>
                      )}
                    </div>

                    {state.customRoles.length === 0 ? (
                      <p className="mb-3 rounded-2xl border border-dashed border-muted bg-muted/30 p-4 text-sm text-muted-foreground">
                        Add your own roles and give each one a color, a place in the
                        hierarchy, and a permission level.
                      </p>
                    ) : (
                      <ul className="mb-3 max-h-[26rem] space-y-2 overflow-y-auto pr-1">
                        <AnimatePresence initial={false}>
                          {state.customRoles.map((r, i) => (
                            <motion.li
                              key={r.id}
                              layout={!reduce}
                              initial={reduce ? false : { opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={reduce ? undefined : { opacity: 0, scale: 0.97 }}
                              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                            >
                              <CustomRoleRow
                                role={r}
                                index={i}
                                total={state.customRoles.length}
                                onChange={(patch) => updateCustomRole(r.id, patch)}
                                onRemove={() => removeCustomRole(r.id)}
                                onMove={(delta) => moveCustomRole(i, delta)}
                              />
                            </motion.li>
                          ))}
                        </AnimatePresence>
                      </ul>
                    )}

                    <Button variant="glass" onClick={addCustomRole}>
                      <Plus className="size-4" /> Add role
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 5 — advanced */}
              {step === 4 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {ADVANCED.map((o) => (
                    <ToggleRow
                      key={o.id}
                      option={o}
                      on={state.advanced.includes(o.id)}
                      onToggle={() => set({ advanced: toggle(state.advanced, o.id) })}
                    />
                  ))}
                </div>
              )}

              {/* STEP 6 — preview */}
              {step === 5 && (
                <PreviewPanel
                  state={state}
                  blueprint={blueprint}
                  onEdit={() => go(0)}
                  onRegenerate={() => setState({ ...state })}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* AI live hint */}
          <AnimatePresence>
            {hint && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="mt-6 flex items-start gap-2 rounded-2xl border border-secondary/30 bg-secondary/10 p-3 text-sm text-foreground/90"
              >
                <Sparkles className="mt-0.5 size-4 shrink-0 text-secondary" />
                {hint}
              </motion.div>
            )}
          </AnimatePresence>

          {/* nav */}
          {!isLast && (
            <div className="mt-8 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => go(step - 1)}
                disabled={step === 0}
                className={cn(step === 0 && "invisible")}
              >
                <ArrowLeft className="size-4" /> Back
              </Button>
              <Button onClick={() => go(step + 1)} disabled={!canProceed}>
                {step === STEPS.length - 2 ? "Preview blueprint" : "Next"}
                <ArrowRight className="size-4" />
              </Button>
            </div>
          )}
        </div>

        {/* live side preview (desktop) */}
        <aside className="hidden lg:block">
          <div className="glass sticky top-24 rounded-3xl p-5">
            <div className="flex items-center gap-2 text-xs font-medium text-secondary">
              <Sparkles className="size-4" /> LIVE PREVIEW
            </div>
            <h3 className="mt-1 truncate font-display text-xl">{blueprint.name}</h3>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{blueprint.summary}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-center">
              {[
                ["Categories", blueprint.stats.categories],
                ["Channels", blueprint.stats.channels],
                ["Voice", blueprint.stats.voice],
                ["Roles", blueprint.stats.roles],
              ].map(([label, val]) => (
                <div key={label as string} className="rounded-2xl bg-muted/50 py-3">
                  <div className="font-display text-xl">{val}</div>
                  <div className="text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                    {label}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 max-h-64 space-y-2 overflow-auto pr-1 font-mono text-xs">
              {blueprint.categories.map((c) => (
                <div key={c.name}>
                  <div className="text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                    {c.emoji} {c.name}
                  </div>
                  {c.channels.slice(0, 4).map((ch) => (
                    <div key={ch.name + ch.type} className="truncate pl-2 text-foreground/70">
                      {ch.type === "voice" ? "🔊" : "#"} {ch.name}
                    </div>
                  ))}
                  {c.channels.length > 4 && (
                    <div className="pl-2 text-muted-foreground">
                      +{c.channels.length - 4} more
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

// ── Custom role editor row ────────────────────────────────────────────────────

function CustomRoleRow({
  role,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  role: CustomRole;
  index: number;
  total: number;
  onChange: (patch: Partial<CustomRole>) => void;
  onRemove: () => void;
  onMove: (delta: -1 | 1) => void;
}) {
  const label = role.name.trim() || "Untitled role";
  return (
    <div className="glass rounded-2xl p-3">
      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
        {/* Reorder — keyboard accessible up/down */}
        <div className="flex shrink-0 flex-col">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label={`Move ${label} up`}
            className="grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
          >
            <ChevronUp className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            aria-label={`Move ${label} down`}
            className="grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
          >
            <ChevronDown className="size-4" />
          </button>
        </div>

        {/* Color — native picker (keyboard reachable) with hex shown as text */}
        <label className="relative shrink-0 cursor-pointer" aria-label={`Color for ${label}`}>
          <span
            className="block size-9 rounded-xl ring-1 ring-white/15"
            style={{ background: role.color, boxShadow: `0 0 12px ${role.color}66` }}
          />
          <input
            type="color"
            value={role.color}
            onChange={(e) => onChange({ color: e.target.value })}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
            aria-label={`Pick a color for ${label}`}
          />
        </label>

        {/* Name */}
        <input
          value={role.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Role name…"
          aria-label="Role name"
          className="glass-input min-w-0 flex-1 rounded-xl px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />

        {/* Remove */}
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          className="grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {/* Second row: permission preset + hoist + hex readout */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <div
          className="flex flex-wrap gap-1 rounded-xl bg-muted/40 p-1"
          role="radiogroup"
          aria-label={`Permission level for ${label}`}
        >
          {PERM_PRESET_ORDER.map((preset) => {
            const active = role.perms === preset;
            return (
              <button
                key={preset}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange({ perms: preset as PermPreset })}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {PERM_PRESET_LABELS[preset]}
              </button>
            );
          })}
        </div>

        {/* Hoist toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={role.hoist}
          aria-label={`Display ${label} separately in the member list`}
          onClick={() => onChange({ hoist: !role.hoist })}
          className={cn(
            "flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            role.hoist ? "bg-secondary/15 text-foreground" : "bg-muted/40 text-muted-foreground"
          )}
        >
          <span
            className={cn(
              "relative h-4 w-7 shrink-0 rounded-full p-0.5 transition-colors",
              role.hoist ? "bg-primary" : "bg-muted"
            )}
          >
            <motion.span
              layout
              transition={{ type: "spring", stiffness: 500, damping: 32 }}
              className={cn("block size-3 rounded-full bg-white shadow", role.hoist ? "ml-auto" : "ml-0")}
            />
          </span>
          Hoist
        </button>

        <span className="ml-auto font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
          {role.color}
        </span>
      </div>
    </div>
  );
}
