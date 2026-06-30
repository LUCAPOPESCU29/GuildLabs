"use client";

import Link from "next/link";
import { Workshop } from "@/components/learn/workshop";
import { useLearnProgress } from "@/lib/learn/progress";

function Header({ n, title, sub }: { n: string; title: string; sub: string }) {
  return (
    <div className="mb-5">
      <span className="font-mono text-xs font-bold tracking-widest text-primary">{n}</span>
      <h2 className="mt-1 font-display text-2xl font-black tracking-tight sm:text-3xl">{title}</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}

export function BuildWorkshops() {
  const { mark } = useLearnProgress();
  return (
    <main className="px-5 py-16">
      <div className="mx-auto max-w-5xl">
        <Link href="/learn" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
          ← Learn
        </Link>
        <h1 className="mt-3 font-display text-4xl font-black tracking-tight sm:text-5xl">Build a bot — your way</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
          Pick what your bot does and watch the code and a live-feeling terminal build it. Start
          with a simple one-trick bot, then compose a bigger one.
        </p>

        <section className="mt-14">
          <Header n="01 · SIMPLE" title="One behavior, end to end" sub="Choose a single command. Switch between them to see the code and terminal change." />
          <Workshop tier="simple" onPick={() => mark("workshop:simple")} />
        </section>

        <section className="mt-20">
          <Header n="02 · MEDIUM" title="Compose a real bot" sub="Stack multiple commands, an embed, an API call, and a welcome event into one bot." />
          <Workshop tier="medium" onPick={() => mark("workshop:medium")} />
        </section>

        <div className="mt-16 rounded-3xl bg-muted/50 p-6 text-center">
          <p className="text-muted-foreground">
            Happy with it? This is real, runnable code.{" "}
            <Link href="/self-host" className="font-semibold text-primary hover:underline">
              Download a starter bot
            </Link>{" "}
            and paste your commands in.
          </p>
        </div>
      </div>
    </main>
  );
}
