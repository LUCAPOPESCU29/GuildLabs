"use client";

import * as React from "react";
import { motion, type Variants } from "framer-motion";

/**
 * Shared dashboard form primitives, lifted out of the guild config page so the
 * ChartIt config section can reuse the exact same look and behaviour.
 */

type IconType = React.ComponentType<{ className?: string }>;
type CardColor = "primary" | "accent" | "coral" | "secondary";

const COLOR_MAP: Record<CardColor, string> = {
  primary: "bg-primary/15 text-primary",
  accent: "bg-accent/15 text-accent",
  coral: "bg-coral/15 text-coral",
  secondary: "bg-secondary/15 text-secondary",
};

export function ConfigCard({
  icon: Icon,
  title,
  color = "primary",
  children,
  variants,
}: {
  icon: IconType;
  title: string;
  color?: CardColor;
  children: React.ReactNode;
  variants?: Variants;
}) {
  return (
    <motion.div variants={variants} className="glass rounded-3xl p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className={`grid size-10 place-items-center rounded-2xl ${COLOR_MAP[color]}`}>
          <Icon className="size-5" />
        </div>
        <h2 className="font-display text-lg font-bold">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </motion.div>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span className="text-sm font-medium">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ${
          checked ? "bg-primary" : "bg-muted-foreground/30"
        }`}
      >
        <span
          className={`pointer-events-none size-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="glass-input w-full rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">— Select —</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="glass-input w-full rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="glass-input w-full rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}
