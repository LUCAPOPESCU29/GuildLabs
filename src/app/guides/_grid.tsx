"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import type { GuidePost } from "@/lib/seo-data/guides";

export function GuidesGrid({ guides }: { guides: GuidePost[] }) {
  const tags = React.useMemo(
    () => Array.from(new Set(guides.flatMap((g) => g.tags))).sort(),
    [guides]
  );
  const [active, setActive] = React.useState<string | null>(null);

  const shown = active ? guides.filter((g) => g.tags.includes(active)) : guides;

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter by tag">
        <Chip active={active === null} onClick={() => setActive(null)}>
          All
        </Chip>
        {tags.map((t) => (
          <Chip key={t} active={active === t} onClick={() => setActive(t)}>
            {t}
          </Chip>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {shown.map((g) => (
          <Link
            key={g.slug}
            href={`/guides/${g.slug}`}
            className="group glass flex flex-col rounded-3xl p-6 transition-all hover:-translate-y-1"
          >
            <div className="flex flex-wrap gap-2">
              {g.tags.map((t) => (
                <span key={t} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-mono text-primary">
                  {t}
                </span>
              ))}
            </div>
            <h2 className="mt-4 font-display text-xl font-black leading-snug">{g.title}</h2>
            <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">{g.description}</p>
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" /> {g.readingMinutes} min read
              </span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-primary text-primary-foreground" : "border border-card-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
