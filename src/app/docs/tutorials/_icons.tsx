"use client";

import * as React from "react";
import {
  Wand2,
  ListChecks,
  GripVertical,
  ShieldCheck,
  Rocket,
  Coins,
  Gamepad2,
  Braces,
  LineChart,
  GitCompare,
  Bell,
  LayoutGrid,
  Quote,
  Server,
  KeyRound,
  Command,
  BookOpen,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  wand: Wand2,
  list: ListChecks,
  drag: GripVertical,
  shield: ShieldCheck,
  rocket: Rocket,
  coins: Coins,
  gamepad: Gamepad2,
  braces: Braces,
  chart: LineChart,
  compare: GitCompare,
  bell: Bell,
  grid: LayoutGrid,
  quote: Quote,
  server: Server,
  key: KeyRound,
  command: Command,
};

/** Renders a tutorial's icon by key (falls back to a book). */
export function TutIcon({ name, className }: { name: string; className?: string }) {
  return React.createElement(MAP[name] ?? BookOpen, { className });
}
