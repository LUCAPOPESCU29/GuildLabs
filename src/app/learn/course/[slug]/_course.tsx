"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Check, BookOpen, Wrench, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Challenge } from "@/components/learn/challenge";
import { Quiz } from "@/components/learn/quiz";
import { CourseComplete } from "@/components/learn/course-complete";
import { useLearnProgress } from "@/lib/learn/progress";
import { trackLearn } from "@/lib/learn/track";
import { COURSES, flatten, getCourse, type Section } from "@/lib/learn/curriculum";

const KIND_ICON = { lesson: BookOpen, workshop: Wrench, lab: FlaskConical } as const;

export function CourseRunner({ slug }: { slug: string }) {
  const course = getCourse(slug)!;
  const screens = React.useMemo(() => flatten(course), [course]);
  const { done, mark } = useLearnProgress();
  const [current, setCurrent] = React.useState(0);
  const [reviewing, setReviewing] = React.useState(false);

  const key = (i: number) => `course:${course.slug}:${i}`;
  const completed = screens.filter((_, i) => done[key(i)]).length;
  const screen = screens[current];
  const allDone = screens.length > 0 && completed === screens.length;

  // Fire course_start once on mount.
  const startedRef = React.useRef(false);
  React.useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    trackLearn("course_start", { course: course.slug });
  }, [course.slug]);

  // Resume: once progress hydrates from localStorage, jump to the first
  // incomplete screen (runs once, and never overrides manual navigation).
  const resumedRef = React.useRef(false);
  React.useEffect(() => {
    if (resumedRef.current) return;
    if (Object.keys(done).length === 0) return; // not hydrated / no progress yet
    resumedRef.current = true;
    const firstIncomplete = screens.findIndex((_, i) => !done[key(i)]);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time resume after hydration
    if (firstIncomplete > 0) setCurrent(firstIncomplete);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, screens]);

  // Persist a completed flag + fire course_complete once, when everything's done.
  const completedRef = React.useRef(false);
  React.useEffect(() => {
    if (allDone && !completedRef.current) {
      completedRef.current = true;
      if (!done[`course:${course.slug}:completed`]) mark(`course:${course.slug}:completed`);
      trackLearn("course_complete", { course: course.slug, steps: screens.length });
    }
  }, [allDone, course.slug, done, mark, screens.length]);

  // Pick a course to suggest next: the following not-yet-finished course.
  const pickNextCourse = () => {
    const idx = COURSES.findIndex((c) => c.slug === course.slug);
    for (let n = 1; n < COURSES.length; n++) {
      const cand = COURSES[(idx + n) % COURSES.length];
      if (cand.slug === course.slug) continue;
      const candScreens = flatten(cand);
      const candDone = candScreens.every((_, i) => done[`course:${cand.slug}:${i}`]);
      if (!candDone) return { slug: cand.slug, name: cand.name, emoji: cand.emoji };
    }
    return null;
  };
  const nextCourse = pickNextCourse();

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
          <aside className="h-fit">
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
            {allDone && !reviewing ? (
              <CourseComplete
                name={course.name}
                emoji={course.emoji}
                lessons={course.sections.filter((s) => s.kind === "lesson").length}
                steps={screens.length}
                next={nextCourse}
                onReview={() => setReviewing(true)}
              />
            ) : screen.type === "step" ? (
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
                <Quiz
                  questions={screen.section.quiz!}
                  onComplete={(score) => {
                    mark(key(current));
                    trackLearn("quiz_complete", { lesson: screen.section.title, score, total: screen.section.quiz!.length });
                  }}
                />
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
