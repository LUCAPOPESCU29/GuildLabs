"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Download, Sparkles, Code2, CheckCircle2, Terminal as TerminalIcon, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/site/reveal";
import { GooeyText } from "@/components/ui/gooey-text-morphing";
import { BackgroundPaths } from "@/components/fx/background-paths";
import { useLearnProgress } from "@/lib/learn/progress";
import { COURSES, flatten } from "@/lib/learn/curriculum";

const HERO_WORDS = ["Write real code.", "Get it checked.", "Build a bot.", "No setup."];

const HOW = [
  { icon: Code2, title: "Write real code", body: "An editor right in your browser — no install, no Node, no token." },
  { icon: TerminalIcon, title: "Run & see output", body: "Your code runs in a sandbox and prints to a live console." },
  { icon: CheckCircle2, title: "Check & advance", body: "Tests verify your work, then you move to the next step." },
];

export function Learn() {
  const { done } = useLearnProgress();

  return (
    <main className="relative">
      {/* Hero */}
      <section className="relative flex min-h-[72vh] flex-col items-start justify-center overflow-hidden px-5 pb-20 pt-32 text-[oklch(0.97_0.02_280)]">
        <div aria-hidden className="grain absolute inset-0" style={{ background: "linear-gradient(160deg, #241a4d 0%, #1a1238 52%, #0f0a22 100%)" }} />
        <div aria-hidden className="absolute inset-0 opacity-60" style={{ maskImage: "radial-gradient(120% 100% at 30% 30%, black, transparent 80%)", WebkitMaskImage: "radial-gradient(120% 100% at 30% 30%, black, transparent 80%)" }}>
          <BackgroundPaths />
        </div>
        <div aria-hidden className="pointer-events-none absolute -right-10 top-6 hidden size-[26rem] rounded-full opacity-25 blur-3xl sm:block" style={{ background: "var(--secondary)" }} />

        <div className="relative mx-auto w-full max-w-5xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-[oklch(0.78_0.16_165)] px-4 py-1.5 text-sm font-bold text-[oklch(0.22_0.07_165)] shadow-lg">
            <Sparkles className="size-4" /> Free interactive course
          </span>
          <h1 className="sr-only">Learn to build a Discord bot by writing real code — a free, interactive, in-browser course</h1>
          <p aria-hidden className="mt-6 font-display text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">Learn to build a bot.</p>
          <div aria-hidden className="mt-1 h-[68px] sm:h-[96px]">
            <GooeyText texts={HERO_WORDS} align="left" className="h-full" textClassName="font-display font-black tracking-tight text-accent !text-4xl sm:!text-6xl" />
          </div>
          <p className="mt-5 max-w-xl text-lg text-white/75">
            Not a video, not a wall of text — you write actual code in your browser, run it, and get it
            checked, step by step. Lessons, quizzes, guided workshops, and labs.
          </p>
          <div className="mt-9">
            <Link href={`/learn/course/${COURSES[0].slug}`}>
              <Button size="lg" magnetic>
                Start coding <ArrowRight className="size-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-5 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-4 sm:grid-cols-3">
            {HOW.map((h, i) => (
              <motion.div key={h.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5, delay: i * 0.08 }} className="glass rounded-3xl p-6">
                <span className="grid size-11 place-items-center rounded-2xl bg-primary/15 text-primary"><h.icon className="size-5" /></span>
                <h3 className="mt-4 font-display text-lg font-black">{h.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{h.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Courses */}
      <section className="px-5 pb-24">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <h2 className="font-display text-3xl font-black tracking-tight sm:text-4xl">Courses</h2>
            <p className="mt-3 max-w-lg text-muted-foreground">Each one builds a real bot: lessons with a quiz after each, a guided workshop, then a lab you tackle yourself.</p>
          </Reveal>

          {/* Regular courses — top grid */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {COURSES.filter((c) => c.level !== "Advanced").map((course) => {
              const screens = flatten(course);
              const completed = screens.filter((_, i) => done[`course:${course.slug}:${i}`]).length;
              const lessons = course.sections.filter((s) => s.kind === "lesson").length;
              const pct = screens.length ? (completed / screens.length) * 100 : 0;
              return (
                <Link key={course.slug} href={`/learn/course/${course.slug}`} className="glass group flex flex-col rounded-3xl p-6 transition-all hover:-translate-y-1 hover:bg-primary/5">
                  <div className="flex items-start justify-between">
                    <span className="text-3xl" aria-hidden>{course.emoji}</span>
                    <span className={cn(
                      "rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-widest",
                      course.level === "Beginner"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-amber-500/10 text-amber-500"
                    )}>{course.level}</span>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-black">{course.name}</h3>
                  <p className="mt-1.5 flex-1 text-sm text-muted-foreground">{course.tagline}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {course.topics.map((t) => (
                      <span key={t} className="rounded-md bg-muted/70 px-2 py-0.5 font-mono text-[0.65rem] text-muted-foreground">{t}</span>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Clock className="size-3" />{course.hours}</span>
                    <span>·</span>
                    <span>{lessons} lessons</span>
                    <span>·</span>
                    <span>1 lab</span>
                  </div>
                  <div className="mt-3">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{completed}/{screens.length} steps</span>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">{completed > 0 ? "Continue" : "Start"} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Featured advanced course */}
          {COURSES.filter((c) => c.level === "Advanced").map((course) => {
            const screens = flatten(course);
            const completed = screens.filter((_, i) => done[`course:${course.slug}:${i}`]).length;
            const lessons = course.sections.filter((s) => s.kind === "lesson").length;
            const pct = screens.length ? (completed / screens.length) * 100 : 0;
            return (
              <Link key={course.slug} href={`/learn/course/${course.slug}`} className="group relative mt-4 flex flex-col overflow-hidden rounded-3xl p-px transition-all hover:-translate-y-1">
                {/* gradient border */}
                <div aria-hidden className="pointer-events-none absolute inset-0 rounded-3xl" style={{ background: "linear-gradient(135deg, oklch(0.75 0.18 280 / 0.6), oklch(0.72 0.22 165 / 0.4), oklch(0.75 0.18 280 / 0.15))" }} />
                <div className="relative flex flex-col gap-6 overflow-hidden rounded-[calc(1.5rem-1px)] p-7 sm:flex-row sm:items-center" style={{ background: "linear-gradient(135deg, oklch(0.14 0.04 280), oklch(0.12 0.03 260))" }}>
                  {/* glow */}
                  <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full opacity-20 blur-3xl" style={{ background: "var(--primary)" }} />
                  <div aria-hidden className="pointer-events-none absolute -bottom-10 left-1/3 size-48 rounded-full opacity-10 blur-3xl" style={{ background: "var(--accent)" }} />

                  {/* left: meta */}
                  <div className="relative flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-4xl" aria-hidden>{course.emoji}</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-primary">
                        <Zap className="size-3" /> Advanced · {course.hours}
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-2xl font-black text-white sm:text-3xl">{course.name}</h3>
                    <p className="mt-2 max-w-lg text-sm text-white/60">{course.tagline}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {course.topics.map((t) => (
                        <span key={t} className="rounded-md border border-white/10 bg-white/[0.06] px-2.5 py-1 font-mono text-[0.7rem] text-white/50">{t}</span>
                      ))}
                    </div>
                    <div className="mt-5 flex items-center gap-4 text-xs text-white/40">
                      <span>{lessons} lessons</span><span>·</span><span>1 guided workshop</span><span>·</span><span>1 lab</span><span>·</span><span>{screens.length} total steps</span>
                    </div>
                  </div>

                  {/* right: progress + CTA */}
                  <div className="relative flex w-full flex-col gap-4 sm:w-56">
                    <div>
                      <div className="flex items-center justify-between text-xs text-white/40">
                        <span>Progress</span>
                        <span>{completed}/{screens.length} steps</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 font-display text-sm font-bold text-primary-foreground shadow-[0_8px_24px_-6px_color-mix(in_oklab,var(--primary)_55%,transparent)] transition-[filter] group-hover:brightness-110">
                      {completed > 0 ? "Continue" : "Start building"} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}

          {/* coming soon teaser */}
          <div className="mt-4 rounded-3xl border border-dashed border-card-border p-6">
            <span className="text-3xl" aria-hidden>📈</span>
            <h3 className="mt-4 font-display text-xl font-black text-muted-foreground">More courses coming</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">A charting bot, an economy bot, and a Python track are on the way.</p>
          </div>
        </div>
      </section>

      {/* Graduate CTA */}
      <section className="px-5 pb-28">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem]">
          <div aria-hidden className="grain absolute inset-0" style={{ background: "linear-gradient(160deg, #1d1440 0%, #120c28 100%)" }} />
          <div aria-hidden className="pointer-events-none absolute -left-16 -bottom-24 size-80 rounded-full opacity-25 blur-3xl" style={{ background: "var(--accent)" }} />
          <div className="relative px-6 py-14 text-center text-white sm:px-10">
            <h2 className="font-display text-3xl font-black tracking-tight sm:text-4xl">Ready for the real thing?</h2>
            <p className="mx-auto mt-3 max-w-md text-white/70">Once you&apos;ve built one here, download an open-source GuildLabs bot and run it for real.</p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href={`/learn/course/${COURSES[0].slug}`}><Button size="lg" variant="accent" magnetic className="w-full sm:w-auto">Start the course <ArrowRight className="size-4" /></Button></Link>
              <Link href="/self-host"><Button size="lg" variant="glass" className="w-full !border-white/30 !bg-white/10 !text-white hover:!bg-white/20 sm:w-auto"><Download className="size-5" /> Download a bot</Button></Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
