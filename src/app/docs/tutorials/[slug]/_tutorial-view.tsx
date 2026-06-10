"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Clock, Copy, Check, ChevronRight, Wand2 } from "lucide-react";
import type { Tutorial, TutorialLevel } from "@/lib/tutorials";
import { Reveal } from "@/components/site/reveal";
import { Button } from "@/components/ui/button";
import { TutIcon } from "../_icons";
import { cn } from "@/lib/utils";

const LEVEL_DOT: Record<TutorialLevel, string> = {
  Beginner: "bg-success",
  Intermediate: "bg-secondary",
  Advanced: "bg-coral",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          toast.success("Copied to clipboard");
          setTimeout(() => setCopied(false), 1600);
        } catch {
          toast.error("Couldn't copy");
        }
      }}
      aria-label="Copy"
      className="glass absolute right-3 top-3 grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:text-primary cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
    </button>
  );
}

export function TutorialView({
  tutorial,
  related,
}: {
  tutorial: Tutorial;
  related: Tutorial[];
}) {
  const reduce = useReducedMotion();
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(Number((vis[0].target as HTMLElement).dataset.idx));
      },
      { rootMargin: "-25% 0px -60% 0px" }
    );
    tutorial.steps.forEach((_, i) => {
      const el = document.getElementById(`step-${i}`);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [tutorial]);

  const jump = (e: React.MouseEvent, i: number) => {
    e.preventDefault();
    document
      .getElementById(`step-${i}`)
      ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  return (
    <main className="mx-auto max-w-6xl px-4 pb-28 pt-24 sm:pt-28">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <li><Link href="/docs" className="transition-colors hover:text-foreground">Docs</Link></li>
          <li aria-hidden><ChevronRight className="size-3.5" /></li>
          <li><Link href="/docs/tutorials" className="transition-colors hover:text-foreground">Tutorials</Link></li>
          <li aria-hidden><ChevronRight className="size-3.5" /></li>
          <li className="text-foreground" aria-current="page">{tutorial.title}</li>
        </ol>
      </nav>

      {/* Header */}
      <Reveal>
        <div className="mt-8 flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-3xl bg-primary/10 text-primary">
            <TutIcon name={tutorial.icon} className="size-7" />
          </span>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-muted/60 px-2.5 py-1 font-medium text-muted-foreground">{tutorial.category}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-card-border px-2.5 py-1 font-medium text-foreground/80">
              <span className={cn("size-1.5 rounded-full", LEVEL_DOT[tutorial.level])} /> {tutorial.level}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-card-border px-2.5 py-1 font-medium text-muted-foreground tabular-nums">
              <Clock className="size-3.5" /> {tutorial.minutes} min
            </span>
          </div>
        </div>
        <h1 className="mt-5 max-w-3xl font-display text-4xl font-black leading-tight tracking-tight sm:text-6xl text-balance">
          {tutorial.title}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground text-pretty">{tutorial.summary}</p>
      </Reveal>

      <div className="mt-12 grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)]">
        {/* Sticky step TOC with scroll-spy */}
        <aside className="hidden lg:block">
          <nav aria-label="Steps" className="sticky top-28">
            <p className="mb-3 px-3 text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground">
              {tutorial.steps.length} steps
            </p>
            <ol className="space-y-0.5">
              {tutorial.steps.map((s, i) => {
                const on = active === i;
                return (
                  <li key={i} className="relative">
                    {on && (
                      <motion.span
                        layoutId="tut-step-active"
                        className="absolute inset-0 rounded-lg bg-primary/10"
                        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 34 }}
                      />
                    )}
                    <a
                      href={`#step-${i}`}
                      onClick={(e) => jump(e, i)}
                      aria-current={on ? "true" : undefined}
                      className={cn(
                        "relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                        on ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-5 shrink-0 place-items-center rounded-full text-[0.7rem] font-bold tabular-nums transition-colors",
                          on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {i + 1}
                      </span>
                      <span className="line-clamp-1">{s.title}</span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>
        </aside>

        {/* Steps */}
        <div className="space-y-6">
          {tutorial.steps.map((s, i) => (
            <div key={i} id={`step-${i}`} data-idx={i} className="scroll-mt-28">
              <Reveal>
                <section className="glass rounded-3xl p-6 sm:p-8">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 font-display text-base font-black tabular-nums text-primary">
                      {i + 1}
                    </span>
                    <h2 className="font-display text-xl font-black sm:text-2xl text-balance">{s.title}</h2>
                  </div>
                  <p className="mt-4 leading-relaxed text-muted-foreground">{s.body}</p>
                  {s.code && (
                    <div className="relative mt-4">
                      <pre className="overflow-x-auto rounded-2xl bg-background-deep/80 p-4 pr-12 font-mono text-xs leading-relaxed text-foreground/90">
                        {s.code}
                      </pre>
                      <CopyButton text={s.code} />
                    </div>
                  )}
                </section>
              </Reveal>
            </div>
          ))}

          {/* Related */}
          {related.length > 0 && (
            <div className="pt-6">
              <h2 className="font-display text-2xl font-black">Keep going</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/docs/tutorials/${r.slug}`}
                    className="card-hover group glass flex items-center gap-3 rounded-2xl p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                      <TutIcon name={r.icon} className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display font-bold">{r.title}</span>
                      <span className="block text-xs text-muted-foreground">{r.category} · {r.minutes} min</span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Footer nav + CTA */}
          <div className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/docs/tutorials"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" /> All tutorials
            </Link>
            <Link href="/#builder">
              <Button size="lg" magnetic>
                <Wand2 className="size-5" /> Try it now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
