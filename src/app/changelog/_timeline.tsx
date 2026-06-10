"use client";

import * as React from "react";
import { Plus, ArrowUp, Wrench } from "lucide-react";
import type { ChangelogEntry, ChangeType, BotTag } from "@/lib/seo-data/changelog";

const TYPE_META: Record<ChangeType, { label: string; className: string; Icon: typeof Plus }> = {
  added: { label: "Added", className: "bg-accent/15 text-accent", Icon: Plus },
  improved: { label: "Improved", className: "bg-primary/15 text-primary", Icon: ArrowUp },
  fixed: { label: "Fixed", className: "bg-coral/15 text-coral", Icon: Wrench },
};

function formatDate(iso: string) {
  // Stable, locale-independent formatting to avoid hydration mismatches.
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[m - 1]} ${d}, ${y}`;
}

export function ChangelogTimeline({ entries }: { entries: ChangelogEntry[] }) {
  const bots = React.useMemo(
    () => Array.from(new Set(entries.map((e) => e.bot))) as BotTag[],
    [entries]
  );
  const [filter, setFilter] = React.useState<BotTag | "all">("all");

  const shown = filter === "all" ? entries : entries.filter((e) => e.bot === filter);

  return (
    <div>
      {/* Filter */}
      {bots.length > 1 && (
        <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter by bot">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            All
          </FilterChip>
          {bots.map((b) => (
            <FilterChip key={b} active={filter === b} onClick={() => setFilter(b)}>
              {b}
            </FilterChip>
          ))}
        </div>
      )}

      {/* Timeline */}
      <ol className="relative space-y-10 border-l border-card-border pl-8">
        {shown.map((entry, i) => (
          <li key={`${entry.date}-${i}`} className="relative">
            <span
              aria-hidden
              className="absolute -left-[2.45rem] top-1.5 size-3 rounded-full bg-primary ring-4 ring-background"
            />
            <div className="flex flex-wrap items-center gap-3">
              <time dateTime={entry.date} className="font-mono text-sm text-muted-foreground">
                {formatDate(entry.date)}
              </time>
              <span className="rounded-full border border-card-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {entry.bot}
              </span>
              {entry.version && (
                <span className="font-mono text-xs text-primary">v{entry.version}</span>
              )}
            </div>

            <h2 className="mt-2 font-display text-2xl font-black tracking-tight">{entry.title}</h2>
            <p className="mt-1 text-muted-foreground">{entry.summary}</p>

            <ul className="mt-4 space-y-2">
              {entry.items.map((item, j) => {
                const meta = TYPE_META[item.type];
                return (
                  <li key={j} className="flex items-start gap-3 text-sm">
                    <span
                      className={`mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${meta.className}`}
                    >
                      <meta.Icon className="size-3" />
                      {meta.label}
                    </span>
                    <span className="text-foreground/90">{item.text}</span>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>

      {shown.length === 0 && (
        <p className="text-muted-foreground">No updates for that filter yet.</p>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "border border-card-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
