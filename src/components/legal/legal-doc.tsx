"use client";

/**
 * Shared premium layout for legal pages (Privacy, Terms).
 * - Site nav + structured section cards with reveal-on-scroll.
 * - Sticky table of contents with a scroll-spy active indicator that animates
 *   to the section currently in view (the page's scroll animation).
 * Themed entirely with existing tokens; reduced-motion safe.
 */

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUp, ArrowLeft } from "lucide-react";
import { SiteNav } from "@/components/site/site-nav";
import { Reveal } from "@/components/site/reveal";
import { cn } from "@/lib/utils";

export type LegalSection = { id: string; title: string; body: React.ReactNode };

const bodyProse =
  "space-y-3 text-[0.95rem] leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:opacity-80 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_li]:marker:text-primary/60";

export function LegalDoc({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: React.ReactNode;
  sections: LegalSection[];
}) {
  const reduce = useReducedMotion();
  const [active, setActive] = React.useState(sections[0]?.id ?? "");

  // Scroll-spy: highlight the section nearest the top of the viewport.
  React.useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-25% 0px -65% 0px", threshold: 0 }
    );
    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, [sections]);

  const jump = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-24 sm:pt-28">
        {/* Header */}
        <Reveal>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Home
          </Link>
          <h1 className="mt-6 font-display text-4xl font-black tracking-tight sm:text-6xl">
            {title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>Last updated {updated}</span>
            <span aria-hidden>·</span>
            <span>{sections.length} sections</span>
          </div>
          <div className={cn("mt-5 max-w-2xl", bodyProse)}>{intro}</div>
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)]">
          {/* Sticky table of contents with scroll-spy */}
          <aside className="hidden lg:block">
            <nav aria-label="On this page" className="sticky top-28">
              <p className="mb-3 px-3 text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground">
                On this page
              </p>
              <ul className="space-y-0.5">
                {sections.map((s) => {
                  const on = active === s.id;
                  return (
                    <li key={s.id} className="relative">
                      {on && (
                        <motion.span
                          layoutId="toc-active"
                          className="absolute inset-0 rounded-lg bg-primary/10"
                          transition={
                            reduce
                              ? { duration: 0 }
                              : { type: "spring", stiffness: 400, damping: 34 }
                          }
                        />
                      )}
                      <a
                        href={`#${s.id}`}
                        onClick={(e) => jump(e, s.id)}
                        aria-current={on ? "true" : undefined}
                        className={cn(
                          "relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors",
                          on ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 shrink-0 rounded-full transition-colors",
                            on ? "bg-primary" : "bg-muted-foreground/40"
                          )}
                        />
                        {s.title}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          {/* Sections */}
          <div className="space-y-6">
            {sections.map((s, i) => (
              <Reveal key={s.id} delay={Math.min(i, 4) * 0.04}>
                <section
                  id={s.id}
                  className="glass scroll-mt-28 rounded-3xl p-6 sm:p-8"
                >
                  <h2 className="font-display text-2xl font-black text-foreground">{s.title}</h2>
                  <div className={cn("mt-3", bodyProse)}>{s.body}</div>
                </section>
              </Reveal>
            ))}

            <div className="flex items-center justify-between pt-4 text-sm text-muted-foreground">
              <span>Last updated {updated}</span>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })}
                className="inline-flex items-center gap-1 rounded transition-colors hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Back to top <ArrowUp className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
