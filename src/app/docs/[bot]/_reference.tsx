"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Copy, Check } from "lucide-react";
import type { BotDocs, Command } from "@/lib/seo-data/docs";

export function BotReference({ doc }: { doc: BotDocs }) {
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();

  // Filter commands by name/description/usage; drop groups that end up empty.
  const groups = doc.groups
    .map((g) => ({
      ...g,
      commands: q
        ? g.commands.filter(
            (c) =>
              c.name.toLowerCase().includes(q) ||
              c.usage.toLowerCase().includes(q) ||
              c.description.toLowerCase().includes(q)
          )
        : g.commands,
    }))
    .filter((g) => g.commands.length > 0);

  const total = groups.reduce((n, g) => n + g.commands.length, 0);

  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      {/* Hero */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/docs" className="transition-colors hover:text-foreground">Docs</Link>
        <span>/</span>
        <span className="text-foreground">{doc.name}</span>
      </nav>
      <h1 className="mt-4 font-display text-4xl font-black tracking-tight sm:text-5xl">
        {doc.name} <span className="text-primary">docs</span>
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{doc.description}</p>

      <div className="mt-12 grid gap-10 lg:grid-cols-[220px_1fr]">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search commands…"
              aria-label="Search commands"
              className="glass-input w-full rounded-xl py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <nav className="mt-5 space-y-5" aria-label="Commands">
            {groups.map((g) => (
              <div key={g.name}>
                <div className="px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">{g.name}</div>
                <ul className="mt-2 space-y-0.5">
                  {g.commands.map((c) => (
                    <li key={c.id}>
                      <a
                        href={`#${c.id}`}
                        className="block rounded-lg px-2 py-1.5 font-mono text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        /{c.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {total === 0 && <p className="px-1 text-sm text-muted-foreground">No commands match “{query}”.</p>}
          </nav>
        </aside>

        {/* Content */}
        <div className="min-w-0">
          {groups.map((g) => (
            <section key={g.name} className="mb-12">
              <h2 className="font-display text-2xl font-black tracking-tight">{g.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{g.summary}</p>
              <div className="mt-5 space-y-4">
                {g.commands.map((c) => (
                  <CommandCard key={c.id} cmd={c} />
                ))}
              </div>
            </section>
          ))}

          {/* FAQ */}
          <section className="mt-4">
            <h2 className="font-display text-2xl font-black tracking-tight">FAQ</h2>
            <div className="mt-5 space-y-3">
              {doc.faqs.map((f) => (
                <div key={f.q} className="glass rounded-2xl p-5">
                  <h3 className="font-display font-bold">{f.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function CommandCard({ cmd }: { cmd: Command }) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(cmd.usage);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — no-op */
    }
  }

  return (
    <article id={cmd.id} className="glass scroll-mt-24 rounded-3xl p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="font-display text-lg font-black">/{cmd.name}</h3>
        {cmd.permissions && (
          <span className="rounded-full border border-card-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {cmd.permissions}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <code className="glass-input flex-1 overflow-x-auto rounded-xl px-3 py-2 font-mono text-sm text-primary">
          {cmd.usage}
        </code>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy usage for /${cmd.name}`}
          className="grid size-9 shrink-0 place-items-center rounded-xl border border-card-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
        </button>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{cmd.description}</p>

      {cmd.options && cmd.options.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Options</div>
          <ul className="mt-2 space-y-1.5">
            {cmd.options.map((o) => (
              <li key={o.name} className="text-sm">
                <code className="font-mono text-foreground">{o.name}</code>
                {o.required && <span className="ml-1.5 text-xs font-semibold text-coral">required</span>}
                <span className="text-muted-foreground"> — {o.description}</span>
                {o.choices && (
                  <span className="text-muted-foreground"> ({o.choices.join(", ")})</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {cmd.examples.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Examples</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {cmd.examples.map((ex) => (
              <code key={ex} className="rounded-lg bg-muted px-2.5 py-1 font-mono text-xs text-foreground">
                {ex}
              </code>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
