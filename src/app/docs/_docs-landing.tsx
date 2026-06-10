"use client";

/**
 * Apple-style docs landing on the GuildLabs theme: a scroll-scrubbed hero, a
 * pinned big-statement section, a sticky scroll-synced quickstart stepper, and
 * staggered reveals — all token-themed and reduced-motion safe.
 */

import * as React from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { toast } from "sonner";
import {
  ArrowRight,
  BookOpen,
  Boxes,
  ShieldCheck,
  KeyRound,
  Rocket,
  GitBranch,
  Sparkles,
  Wand2,
  Pencil,
  Plug,
  Copy,
  Check,
  GraduationCap,
  Clock,
} from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import { Button } from "@/components/ui/button";
import { TUTORIALS } from "@/lib/tutorials";
import { TutIcon } from "./tutorials/_icons";
import { cn } from "@/lib/utils";

type Bot = {
  slug: string;
  name: string;
  tagline: string;
  documented: boolean;
  productPath: string;
};

const CONCEPTS = [
  { icon: Boxes, title: "Blueprints", body: "A server as data — categories, channels, roles and permissions in one JSON object you can review, edit, and re-use." },
  { icon: Rocket, title: "Deploy", body: "The Construct bot builds your blueprint in a live server in seconds. It only creates — existing items with the same name are skipped, never deleted." },
  { icon: ShieldCheck, title: "Permissions", body: "Roles use clear presets (admin, mod, trusted, member, view) that map to realistic Discord permission sets — no overwrite spaghetti." },
  { icon: KeyRound, title: "Discord OAuth", body: "Sign in with Discord. We only see your profile and the servers you can manage — and only deploy to the one you pick." },
  { icon: GitBranch, title: "Open source", body: "Every bot is MIT-licensed. Read the source, self-host it, or fork it — no black boxes." },
  { icon: Sparkles, title: "Free", body: "No subscription, no premium tier, no API keys to buy. The whole studio is free." },
] as const;

const STEPS = [
  { icon: Wand2, title: "Describe or pick", body: "Use “Describe it ✨” to write your server in a sentence, or step through the wizard. The AI turns it into a blueprint.", code: "“A crypto trading community with market chat, voice AMAs, and holder roles.”" },
  { icon: Pencil, title: "Review & edit", body: "See the full structure before anything touches your server. Drag to reorder, rename, change channel types, tweak roles.", code: "drag · rename · retype · re-role" },
  { icon: Plug, title: "Connect Discord", body: "Sign in with Discord and choose which server to build into. The bot needs Administrator to create roles and channels.", code: "/api/auth/login → pick a server" },
  { icon: Rocket, title: "Deploy", body: "Construct creates the categories, channels, and roles in seconds. Duplicates are skipped — nothing is removed.", code: "POST /api/bot/deploy/:guildId" },
] as const;

const FAQS = [
  { q: "Is it really free?", a: "Yes — every GuildLabs tool is free and open-source. No subscription, no premium tier, no API keys to buy." },
  { q: "Will deploying overwrite my server?", a: "No. Construct only creates new categories, channels, and roles. Anything with a matching name is skipped, and nothing is ever deleted." },
  { q: "Can I edit what the AI generates?", a: "Always. You review the full blueprint and can drag to reorder, rename, change channel types, and adjust roles before you deploy." },
  { q: "What does the AI do with my description?", a: "Construct sends it to our AI provider (Groq) to generate the blueprint, then shows it to you to review. See the Privacy Policy for details." },
  { q: "What permissions does the bot need?", a: "Administrator — it has to create roles and channels and set their permissions. You invite it to the one server you choose." },
  { q: "Do I have to host anything?", a: "No for the web builder and ChartIt. Maven is self-hosted so your community’s data stays on your own machine." },
] as const;

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

export function DocsLanding({ bots }: { bots: Bot[] }) {
  const reduce = useReducedMotion();
  const heroRef = React.useRef<HTMLDivElement>(null);
  const stmtRef = React.useRef<HTMLDivElement>(null);

  // Scrub the hero out as you scroll past it (Apple-style).
  const { scrollYProgress: heroP } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(heroP, [0, 1], [0, -90]);
  const heroOpacity = useTransform(heroP, [0, 0.8], [1, 0]);

  // Scrub the pinned statement in/out across a tall section.
  const { scrollYProgress: stmtP } = useScroll({ target: stmtRef, offset: ["start end", "end start"] });
  const stmtOpacity = useTransform(stmtP, [0, 0.35, 0.65, 1], [0.15, 1, 1, 0.15]);
  const stmtScale = useTransform(stmtP, [0, 0.5, 1], [0.92, 1, 1.05]);
  const stmtBlur = useTransform(stmtP, [0, 0.35, 0.65, 1], ["blur(8px)", "blur(0px)", "blur(0px)", "blur(8px)"]);

  // Sticky stepper scroll-spy.
  const [activeStep, setActiveStep] = React.useState(0);
  const stepRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  React.useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActiveStep(Number((e.target as HTMLElement).dataset.idx));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    stepRefs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative mx-auto flex min-h-[88vh] max-w-5xl flex-col justify-center px-4 py-24">
        <motion.div style={reduce ? undefined : { y: heroY, opacity: heroOpacity }}>
          <div className="flex items-center gap-2 text-sm font-medium text-secondary">
            <BookOpen className="size-4" /> DOCUMENTATION
          </div>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-black leading-[0.98] tracking-tight sm:text-7xl lg:text-8xl text-balance">
            Build, deploy, and run your server.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl text-pretty">
            Everything you need to go from an idea to a finished Discord server — and the full
            command reference for every GuildLabs bot.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="#quickstart">
              <Button size="lg" magnetic>
                <Rocket className="size-5" /> Quickstart
              </Button>
            </Link>
            <Link href="#reference">
              <Button size="lg" variant="glass">
                <BookOpen className="size-5" /> Command reference
              </Button>
            </Link>
          </div>
        </motion.div>
        {!reduce && (
          <motion.div
            aria-hidden
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          >
            <div className="h-9 w-5 rounded-full border border-current/40 p-1">
              <span className="block size-1.5 rounded-full bg-current/70" />
            </div>
          </motion.div>
        )}
      </section>

      {/* ── Pinned statement ─────────────────────────────────── */}
      <section ref={stmtRef} className="relative h-[180vh]">
        <div className="sticky top-0 flex h-screen items-center justify-center px-4">
          <motion.h2
            style={reduce ? undefined : { opacity: stmtOpacity, scale: stmtScale, filter: stmtBlur }}
            className="mx-auto max-w-4xl text-center font-display text-4xl font-black leading-tight tracking-tight sm:text-6xl lg:text-7xl text-balance"
          >
            One blueprint.
            <br />
            <span className="text-primary">A whole server.</span> In seconds.
          </motion.h2>
        </div>
      </section>

      {/* ── Core concepts ────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:py-32">
        <Reveal>
          <h2 className="font-display text-3xl font-black tracking-tight sm:text-5xl text-balance">
            The core ideas
          </h2>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            A few simple concepts power everything GuildLabs does.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CONCEPTS.map((c, i) => {
            const Icon = c.icon;
            return (
              <Reveal key={c.title} delay={Math.min(i, 3) * 0.06}>
                <div className="card-hover glass h-full rounded-3xl p-6">
                  <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-display text-xl font-black">{c.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ── Quickstart (sticky scroll-synced stepper) ────────── */}
      <section id="quickstart" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:py-32">
        <Reveal>
          <div className="flex items-center gap-2 text-sm font-medium text-secondary">
            <Rocket className="size-4" /> QUICKSTART
          </div>
          <h2 className="mt-3 font-display text-3xl font-black tracking-tight sm:text-5xl text-balance">
            Four steps to a real server
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-[22rem_minmax(0,1fr)]">
          {/* Sticky progress panel */}
          <aside className="hidden lg:block">
            <div className="glass-strong sticky top-28 overflow-hidden rounded-3xl p-8">
              <div className="font-display text-[7rem] font-black leading-none tabular-nums text-primary/90">
                <motion.span
                  key={activeStep}
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 320, damping: 26 }}
                  className="inline-block"
                >
                  {String(activeStep + 1).padStart(2, "0")}
                </motion.span>
              </div>
              <div className="mt-2 font-display text-2xl font-black">{STEPS[activeStep].title}</div>
              <p className="mt-2 text-sm text-muted-foreground">{STEPS[activeStep].body}</p>
              <div className="mt-6 flex gap-2">
                {STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-colors duration-300",
                      i <= activeStep ? "bg-primary" : "bg-muted"
                    )}
                  />
                ))}
              </div>
            </div>
          </aside>

          {/* Scrolling steps */}
          <div className="space-y-6">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.title}
                  data-idx={i}
                  ref={(el) => { stepRefs.current[i] = el; }}
                >
                  <Reveal>
                    <div className="glass rounded-3xl p-6 sm:p-8">
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-2xl bg-primary/10 font-display text-base font-black text-primary tabular-nums">
                          {i + 1}
                        </span>
                        <span className="grid size-10 place-items-center rounded-2xl bg-muted text-foreground">
                          <Icon className="size-5" />
                        </span>
                        <h3 className="font-display text-xl font-black sm:text-2xl">{s.title}</h3>
                      </div>
                      <p className="mt-4 text-muted-foreground">{s.body}</p>
                      <div className="relative mt-4">
                        <pre className="overflow-x-auto rounded-2xl bg-background-deep/80 p-4 pr-12 font-mono text-xs leading-relaxed text-foreground/90">
                          {s.code}
                        </pre>
                        <CopyButton text={s.code} />
                      </div>
                    </div>
                  </Reveal>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Tutorials ────────────────────────────────────────── */}
      <section id="tutorials" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:py-32">
        <Reveal>
          <div className="flex items-center gap-2 text-sm font-medium text-secondary">
            <GraduationCap className="size-4" /> TUTORIALS
          </div>
          <h2 className="mt-3 font-display text-3xl font-black tracking-tight sm:text-5xl text-balance">
            Guided, step by step
          </h2>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            {TUTORIALS.length} short walkthroughs, from your first AI-built server to charts and
            self-hosting.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TUTORIALS.slice(0, 6).map((t, i) => (
            <Reveal key={t.slug} delay={Math.min(i, 3) * 0.06}>
              <Link
                href={`/docs/tutorials/${t.slug}`}
                className="card-hover group glass flex h-full flex-col rounded-3xl p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <TutIcon name={t.icon} className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-black leading-snug text-balance">{t.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{t.summary}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                  <Clock className="size-3.5" /> {t.minutes} min · {t.category}
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <div className="mt-8">
            <Link href="/docs/tutorials">
              <Button variant="outline" size="lg">
                <GraduationCap className="size-5" /> Browse all {TUTORIALS.length} tutorials
                <ArrowRight className="size-4 opacity-70" />
              </Button>
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ── Command reference ────────────────────────────────── */}
      <section id="reference" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:py-32">
        <Reveal>
          <div className="flex items-center gap-2 text-sm font-medium text-secondary">
            <BookOpen className="size-4" /> REFERENCE
          </div>
          <h2 className="mt-3 font-display text-3xl font-black tracking-tight sm:text-5xl text-balance">
            Every bot, every command
          </h2>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            Full slash-command references with usage, options, and examples.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bots.map((bot, i) => (
            <Reveal key={bot.slug} delay={Math.min(i, 3) * 0.06}>
              {bot.documented ? (
                <Link href={`/docs/${bot.slug}`} className="card-hover group glass flex h-full flex-col rounded-3xl p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl font-black">{bot.name}</h3>
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{bot.tagline}</p>
                  <span className="mt-4 font-mono text-xs text-primary">View command reference →</span>
                </Link>
              ) : (
                <div className="glass flex h-full flex-col rounded-3xl p-6 opacity-80">
                  <h3 className="font-display text-xl font-black">{bot.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{bot.tagline}</p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full border border-card-border px-2 py-0.5 font-mono">Docs coming soon</span>
                    <Link href={bot.productPath} className="text-primary hover:underline">Learn more</Link>
                  </div>
                </div>
              )}
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Self-host ────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:py-32">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <div className="flex items-center gap-2 text-sm font-medium text-secondary">
              <GitBranch className="size-4" /> SELF-HOST
            </div>
            <h2 className="mt-3 font-display text-3xl font-black tracking-tight sm:text-5xl text-balance">
              Run it yourself
            </h2>
            <p className="mt-4 max-w-md text-lg text-muted-foreground">
              Every bot is MIT-licensed and on GitHub. Clone it, add your tokens, and run — no
              hidden services.
            </p>
            <a href="https://github.com/LUCAPOPESCU29/GuildLabs" target="_blank" rel="noreferrer" className="mt-6 inline-block">
              <Button variant="outline" size="lg">
                <GitBranch className="size-5" /> View on GitHub <ArrowRight className="size-4 opacity-70" />
              </Button>
            </a>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="relative">
              <pre className="overflow-x-auto rounded-3xl bg-background-deep/80 p-6 pr-12 font-mono text-sm leading-relaxed text-foreground/90">
{`git clone https://github.com/LUCAPOPESCU29/GuildLabs
cd GuildLabs
npm install
cp .env.example .env.local   # add your tokens
npm run dev`}
              </pre>
              <CopyButton text={"git clone https://github.com/LUCAPOPESCU29/GuildLabs\ncd GuildLabs\nnpm install\ncp .env.example .env.local\nnpm run dev"} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 py-24 sm:py-32">
        <Reveal>
          <h2 className="text-center font-display text-3xl font-black tracking-tight sm:text-5xl text-balance">
            Questions
          </h2>
        </Reveal>
        <div className="mt-12 space-y-3">
          {FAQS.map((f, i) => (
            <Reveal key={f.q} delay={Math.min(i, 4) * 0.04}>
              <details className="group glass rounded-2xl p-5 [&_summary]:cursor-pointer">
                <summary className="flex items-center justify-between gap-4 font-display text-lg font-bold marker:content-none">
                  {f.q}
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-90 group-open:text-primary" />
                </summary>
                <p className="mt-3 text-muted-foreground">{f.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 pb-32 text-center">
        <Reveal>
          <h2 className="font-display text-3xl font-black tracking-tight sm:text-5xl text-balance">
            Ready to build?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Describe your server and let the AI design it — review everything before you deploy.
          </p>
          <Link href="/#builder" className="mt-8 inline-block">
            <Button size="lg" magnetic>
              <Wand2 className="size-5" /> Start building — free
            </Button>
          </Link>
        </Reveal>
      </section>
    </main>
  );
}
