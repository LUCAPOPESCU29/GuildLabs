"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Download, BookOpen, Wrench, HelpCircle, FlaskConical, Sparkles, Lightbulb, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/site/reveal";
import { CodeBlock } from "@/components/ui/code-block";
import { GooeyText } from "@/components/ui/gooey-text-morphing";
import { BackgroundPaths } from "@/components/fx/background-paths";
import { Quiz } from "@/components/learn/quiz";
import { Lab } from "@/components/learn/lab";
import { useLearnProgress } from "@/lib/learn/progress";
import { LESSONS, type LearnBlock } from "@/lib/learn-data";
import { BASICS_QUIZ } from "@/lib/learn/quizzes";
import { LABS } from "@/lib/learn/labs";

const HERO_WORDS = ["From zero.", "In 15 minutes.", "No experience.", "All open-source."];

const TRACKS = [
  { icon: BookOpen, title: "Course", body: "Six short lessons from nothing to a running bot.", href: "#lessons", key: "course" },
  { icon: Wrench, title: "Build a bot", body: "Choose what your bot does — live code + terminal.", href: "/learn/build", key: "workshop:simple" },
  { icon: HelpCircle, title: "Quiz", body: "Check what stuck with a 5-question quiz.", href: "#quiz", key: "quiz:basics" },
  { icon: FlaskConical, title: "Labs", body: "Three open-ended challenges to try yourself.", href: "#labs", key: "labs" },
];

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" },
    transition: { duration: 0.5, delay },
  };
}

function Block({ block }: { block: LearnBlock }) {
  switch (block.type) {
    case "p":
      return <p className="text-[15px] leading-relaxed text-muted-foreground">{block.text}</p>;
    case "steps":
      return (
        <ol className="space-y-2.5">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-muted-foreground">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/15 text-[0.7rem] font-bold text-primary">
                {i + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      );
    case "code":
      return <CodeBlock code={block.code} filename={block.filename} language={block.language} />;
    case "callout":
      return (
        <div className="flex gap-3 rounded-2xl border border-accent/20 bg-accent/[0.06] p-4">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-accent-foreground" />
          <p className="text-sm leading-relaxed text-foreground/80">{block.text}</p>
        </div>
      );
  }
}

export function Learn() {
  const { done, mark } = useLearnProgress();
  const labsDone = LABS.filter((l) => done[`lab:${l.id}`]).length;
  return (
    <main className="relative">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[78vh] flex-col items-start justify-center overflow-hidden px-5 pb-20 pt-32 text-[oklch(0.97_0.02_280)]">
        <div aria-hidden className="grain absolute inset-0" style={{ background: "linear-gradient(160deg, #241a4d 0%, #1a1238 52%, #0f0a22 100%)" }} />
        <div aria-hidden className="absolute inset-0 opacity-60" style={{ maskImage: "radial-gradient(120% 100% at 30% 30%, black, transparent 80%)", WebkitMaskImage: "radial-gradient(120% 100% at 30% 30%, black, transparent 80%)" }}>
          <BackgroundPaths />
        </div>
        <div aria-hidden className="pointer-events-none absolute -right-10 top-6 hidden size-[26rem] rounded-full opacity-25 blur-3xl sm:block" style={{ background: "var(--secondary)" }} />

        <div className="relative mx-auto w-full max-w-5xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-[oklch(0.78_0.16_165)] px-4 py-1.5 text-sm font-bold text-[oklch(0.22_0.07_165)] shadow-lg">
            <Sparkles className="size-4" /> Free beginner course
          </span>
          <h1 className="sr-only">Build a Discord bot from zero — a free beginner tutorial with copy-paste code</h1>
          <p aria-hidden className="mt-6 font-display text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
            Build a Discord bot.
          </p>
          <div aria-hidden className="mt-1 h-[68px] sm:h-[96px]">
            <GooeyText texts={HERO_WORDS} align="left" className="h-full" textClassName="font-display font-black tracking-tight text-accent !text-4xl sm:!text-6xl" />
          </div>
          <p className="mt-5 max-w-xl text-lg text-white/75">
            No experience needed. You&apos;ll write a real, working bot in about fifteen minutes — then graduate
            to GuildLabs&apos; open-source ones. Every snippet is copy-paste, every step explained.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href="#lessons">
              <Button size="lg" magnetic className="w-full sm:w-auto">
                Start lesson 1 <ArrowRight className="size-5" />
              </Button>
            </a>
            <Link href="/self-host">
              <Button size="lg" variant="glass" className="w-full !border-white/30 !bg-white/10 !text-white hover:!bg-white/20 sm:w-auto">
                <Download className="size-5" /> Download a finished bot
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Tracks ────────────────────────────────────────────────────────── */}
      <section className="px-5 py-20">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <h2 className="font-display text-3xl font-black tracking-tight sm:text-4xl">Four ways to learn</h2>
            <p className="mt-3 max-w-lg text-muted-foreground">Read the course, build a bot you design, test yourself, then tackle the labs.</p>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TRACKS.map((t, i) => {
              const complete = t.key === "labs" ? labsDone === LABS.length : done[t.key];
              return (
                <motion.div key={t.title} {...fadeUp(i * 0.06)}>
                  <Link href={t.href} className="glass group flex h-full flex-col rounded-3xl p-6 transition-all hover:-translate-y-1 hover:bg-primary/5">
                    <div className="flex items-center justify-between">
                      <span className="grid size-11 place-items-center rounded-2xl bg-primary/15 text-primary">
                        <t.icon className="size-5" />
                      </span>
                      {complete && <Check className="size-5 text-success" />}
                    </div>
                    <h3 className="mt-4 font-display text-lg font-black">{t.title}</h3>
                    <p className="mt-1.5 flex-1 text-sm text-muted-foreground">{t.body}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                      Open <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Lessons ───────────────────────────────────────────────────────── */}
      <section id="lessons" className="scroll-mt-24 px-5 pb-24">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">The course</span>
            <h2 className="mt-2 font-display text-3xl font-black tracking-tight sm:text-4xl">From nothing to a running bot</h2>
          </Reveal>

          <div className="mt-12 space-y-14">
            {LESSONS.map((lesson) => (
              <motion.article key={lesson.id} id={lesson.id} {...fadeUp()} className="scroll-mt-24">
                <div className="flex items-center gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary font-display text-xl font-black text-primary-foreground shadow-lg shadow-primary/25">
                    {lesson.n}
                  </span>
                  <div>
                    <h3 className="font-display text-2xl font-black tracking-tight">{lesson.title}</h3>
                    <p className="text-sm text-muted-foreground">{lesson.tagline} · {lesson.minutes} min</p>
                  </div>
                </div>
                <div className="mt-5 space-y-4 sm:pl-16">
                  {lesson.blocks.map((block, i) => (
                    <Block key={i} block={block} />
                  ))}
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quiz ──────────────────────────────────────────────────────────── */}
      <section id="quiz" className="scroll-mt-24 px-5 pb-24">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Quiz</span>
            <h2 className="mt-2 font-display text-3xl font-black tracking-tight sm:text-4xl">Did it stick?</h2>
            <p className="mt-3 text-muted-foreground">Five quick questions. Pick an answer to see if you&apos;re right and why.</p>
          </Reveal>
          <div className="mt-8">
            <Quiz questions={BASICS_QUIZ} onComplete={() => mark("quiz:basics")} />
          </div>
        </div>
      </section>

      {/* ── Labs ──────────────────────────────────────────────────────────── */}
      <section id="labs" className="scroll-mt-24 px-5 pb-24">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Labs</span>
            <h2 className="mt-2 font-display text-3xl font-black tracking-tight sm:text-4xl">Now try it yourself</h2>
            <p className="mt-3 text-muted-foreground">Open-ended challenges — work through the checkpoints, peek at a hint if you&apos;re stuck, then check your answer.</p>
          </Reveal>
          <div className="mt-8 space-y-5">
            {LABS.map((lab) => (
              <Lab key={lab.id} lab={lab} onComplete={() => mark(`lab:${lab.id}`)} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Graduate CTA ──────────────────────────────────────────────────── */}
      <section className="px-5 pb-28">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem]">
          <div aria-hidden className="grain absolute inset-0" style={{ background: "linear-gradient(160deg, #1d1440 0%, #120c28 100%)" }} />
          <div aria-hidden className="pointer-events-none absolute -left-16 -bottom-24 size-80 rounded-full opacity-25 blur-3xl" style={{ background: "var(--accent)" }} />
          <div className="relative grid items-center gap-8 px-6 py-14 text-white sm:px-10 lg:grid-cols-[1fr,0.9fr]">
            <div>
              <h2 className="font-display text-3xl font-black tracking-tight sm:text-4xl">
                You can build a bot now. <span className="text-accent">Go read a real one.</span>
              </h2>
              <p className="mt-3 max-w-md text-white/70">
                GuildLabs&apos; bots are open-source and built on exactly what you just learned. Download one,
                run it the same way, and start editing.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/self-host">
                  <Button size="lg" variant="accent" magnetic className="w-full sm:w-auto">
                    <Download className="size-5" /> Download a bot
                  </Button>
                </Link>
                <Link href="/bots">
                  <Button size="lg" variant="glass" className="w-full !border-white/30 !bg-white/10 !text-white hover:!bg-white/20 sm:w-auto">
                    Explore the studio <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <CodeBlock filename="terminal" language="bash" code={"$ npm install\n$ npm start\n\n✔ Online as YourBot#1234\n✔ Registered 7 commands\nReady."} />
          </div>
        </div>
      </section>
    </main>
  );
}
