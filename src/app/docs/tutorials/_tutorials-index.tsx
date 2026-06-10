"use client";

import * as React from "react";
import Link from "next/link";
import Fuse from "fuse.js";
import { Search, Clock, X, GraduationCap, BookOpen } from "lucide-react";
import {
  TUTORIAL_CATEGORIES,
  TUTORIAL_LEVELS,
  type Tutorial,
  type TutorialLevel,
} from "@/lib/tutorials";
import { Reveal } from "@/components/site/reveal";
import { EmptyState } from "@/components/ui/empty-state";
import { TutIcon } from "./_icons";
import { cn } from "@/lib/utils";

const LEVEL_DOT: Record<TutorialLevel, string> = {
  Beginner: "bg-success",
  Intermediate: "bg-secondary",
  Advanced: "bg-coral",
};

function Chip({
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
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-card-border bg-muted/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

export function TutorialsIndex({ tutorials }: { tutorials: Tutorial[] }) {
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<string>("All");
  const [level, setLevel] = React.useState<string>("All");

  const fuse = React.useMemo(
    () =>
      new Fuse(tutorials, {
        keys: [
          { name: "title", weight: 0.5 },
          { name: "summary", weight: 0.3 },
          { name: "category", weight: 0.2 },
        ],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    [tutorials]
  );

  const results = React.useMemo(() => {
    const base = query.trim() ? fuse.search(query).map((r) => r.item) : tutorials;
    return base.filter(
      (t) =>
        (category === "All" || t.category === category) &&
        (level === "All" || t.level === level)
    );
  }, [query, category, level, fuse, tutorials]);

  return (
    <section className="mx-auto max-w-6xl px-4 pb-28">
      {/* search */}
      <div className="glass-strong flex items-center gap-2 rounded-2xl px-4">
        <Search className="size-5 shrink-0 text-muted-foreground" />
        <label htmlFor="tut-search" className="sr-only">
          Search tutorials
        </label>
        <input
          id="tut-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tutorials…"
          className="w-full bg-transparent py-4 text-[0.95rem] outline-none placeholder:text-muted-foreground"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* filters */}
      <div className="mt-5 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Filter by category">
          <Chip active={category === "All"} onClick={() => setCategory("All")}>All</Chip>
          {TUTORIAL_CATEGORIES.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Filter by level">
          <Chip active={level === "All"} onClick={() => setLevel("All")}>Any level</Chip>
          {TUTORIAL_LEVELS.map((l) => (
            <Chip key={l} active={level === l} onClick={() => setLevel(l)}>{l}</Chip>
          ))}
        </div>
      </div>

      <p className="mt-5 text-sm text-muted-foreground" aria-live="polite">
        {results.length} {results.length === 1 ? "tutorial" : "tutorials"}
      </p>

      {/* grid */}
      {results.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={BookOpen}
            title="No tutorials found"
            body="Try a different search, or clear the filters."
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((t, i) => (
            <Reveal key={t.slug} delay={Math.min(i, 5) * 0.04}>
              <Link
                href={`/docs/tutorials/${t.slug}`}
                className="card-hover group glass flex h-full flex-col rounded-3xl p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <TutIcon name={t.icon} className="size-5" />
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-card-border px-2 py-0.5 text-[0.7rem] font-medium text-foreground/80">
                    <span className={cn("size-1.5 rounded-full", LEVEL_DOT[t.level])} />
                    {t.level}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-lg font-black leading-snug text-balance">{t.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{t.summary}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="rounded-full bg-muted/60 px-2 py-0.5 font-medium">{t.category}</span>
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <Clock className="size-3.5" /> {t.minutes} min
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      )}

      {/* hint */}
      <p className="mt-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <GraduationCap className="size-4 text-primary" />
        New tutorials are added as features ship.
      </p>
    </section>
  );
}
