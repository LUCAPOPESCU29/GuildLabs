"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Check, BookOpen, Wrench, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Challenge } from "@/components/learn/challenge";
import { Quiz } from "@/components/learn/quiz";
import { useLearnProgress } from "@/lib/learn/progress";
import { flatten, getCourse, type Section } from "@/lib/learn/curriculum";

const KIND_ICON = { lesson: BookOpen, workshop: Wrench, lab: FlaskConical } as const;

export function CourseRunner({ slug }: { slug: string }) {
  const course = getCourse(slug)!;
  const screens = React.useMemo(() => flatten(course), [course]);
  const { done, mark } = useLearnProgress();
  const [current, setCurrent] = React.useState(0);

  const key = (i: number) => `course:${course.slug}:${i}`;
  const completed = screens.filter((_, i) => done[key(i)]).length;
  const screen = screens[current];

  // Group screen indices by section for the sidebar.
  const groups = React.useMemo(() => {
    const map = new Map<number, { section: Section; items: number[] }>();
    screens.forEach((s, i) => {
      const g = map.get(s.sectionIndex) ?? { section: s.section, items: [] };
      g.items.push(i);
      map.set(s.sectionIndex, g);
    });
    return [...map.values()];
  }, [screens]);

  return (
    <main className="px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-4">
          <Link href="/learn" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="size-4" /> All courses
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-muted-foreground">{completed}/{screens.length} steps</span>
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(completed / screens.length) * 100}%` }} />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[260px,1fr]">
          {/* Sidebar */}
          <aside className="h-fit lg:sticky lg:top-6">
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <span className="text-xl" aria-hidden>{course.emoji}</span>
                <span className="font-display font-black">{course.name}</span>
              </div>
              <div className="mt-4 space-y-4">
                {groups.map((g) => {
                  const Icon = KIND_ICON[g.section.kind];
                  return (
                    <div key={g.section.id}>
                      <div className="flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-widest text-muted-foreground">
                        <Icon className="size-3" /> {g.section.title.replace(/^Lesson \d+ · |^Workshop · |^Lab · /, "")}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {g.items.map((i) => {
                          const sc = screens[i];
                          const label = sc.type === "quiz" ? "Q" : String((sc).stepIndex + 1);
                          const isDone = done[key(i)];
                          const active = i === current;
                          return (
                            <button
                              key={i}
                              onClick={() => setCurrent(i)}
                              className={cn(
                                "grid size-8 place-items-center rounded-lg border text-xs font-bold transition-colors cursor-pointer",
                                active ? "border-primary bg-primary text-primary-foreground" : isDone ? "border-success/40 bg-success/15 text-success" : "border-card-border bg-card/40 text-muted-foreground hover:border-primary/40"
                              )}
                              aria-label={`${g.section.title} ${label}`}
                            >
                              {isDone && !active ? <Check className="size-3.5" /> : label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Main */}
          <div>
            {screen.type === "step" ? (
              <Challenge
                key={current}
                step={screen.step}
                index={screen.stepIndex}
                total={screen.section.steps.length}
                title={screen.section.title}
                passed={!!done[key(current)]}
                onPass={() => mark(key(current))}
                onPrev={current > 0 ? () => setCurrent((c) => c - 1) : undefined}
                onNext={current < screens.length - 1 ? () => setCurrent((c) => c + 1) : undefined}
              />
            ) : (
              <div>
                <div className="mb-5">
                  <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{screen.section.title}</div>
                  <h2 className="mt-1 font-display text-2xl font-black">Quick check</h2>
                </div>
                <Quiz questions={screen.section.quiz!} onComplete={() => mark(key(current))} />
                <div className="mt-6 flex items-center justify-between">
                  <button onClick={() => setCurrent((c) => Math.max(0, c - 1))} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground cursor-pointer">
                    <ArrowLeft className="size-4" /> Back
                  </button>
                  {current < screens.length - 1 ? (
                    <button onClick={() => setCurrent((c) => c + 1)} disabled={!done[key(current)]} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 font-display font-bold text-primary-foreground hover:brightness-110 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed">
                      Next →
                    </button>
                  ) : (
                    <Link href="/self-host" className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 font-display font-bold text-accent-foreground hover:brightness-110">
                      Finish — download a bot →
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
