"use client";

/**
 * Discord-style playground: type `/` commands in a chat and the GuildLabs bot
 * responds inline — Construct builds a server blueprint, ChartIt drops a live
 * chart, Maven answers questions. On the GuildLabs theme (tokens), Discord-like
 * layout. Everything is reduced-motion safe.
 */

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Hash,
  Volume2,
  Send,
  Plus,
  Boxes,
  LineChart,
  MessageCircleQuestion,
  Wand2,
  Rocket,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Bot,
  Loader2,
  Trash2,
  Sparkles,
  ShieldCheck,
  Home,
} from "lucide-react";
import type { Blueprint } from "@/lib/blueprint";
import { GuildLabsLogo } from "@/components/logo";
import { cn } from "@/lib/utils";

// ── Slash command registry ────────────────────────────────────────────────────
type CmdName = "build" | "chart" | "ask" | "help" | "clear";
const COMMANDS: { name: CmdName; icon: React.ComponentType<{ className?: string }>; args: string; desc: string }[] = [
  { name: "build", icon: Wand2, args: "<description>", desc: "Construct — build a Discord server from a description" },
  { name: "chart", icon: LineChart, args: "<ticker>", desc: "ChartIt — post a live chart (e.g. AAPL, BTC-USD)" },
  { name: "ask", icon: MessageCircleQuestion, args: "<question>", desc: "Maven — ask anything about GuildLabs" },
  { name: "help", icon: Sparkles, args: "", desc: "List available commands" },
  { name: "clear", icon: Trash2, args: "", desc: "Clear the chat" },
];

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

type ChartPayload = {
  symbol: string;
  name: string;
  price: number | null;
  changePercent: number | null;
  currency: string;
  closes: number[];
};

type Msg = {
  id: string;
  role: "user" | "bot";
  kind: "text" | "typing" | "blueprint" | "chart" | "answer" | "error" | "help";
  content?: string;
  blueprint?: Blueprint;
  chart?: ChartPayload;
  source?: "ai" | "offline";
};

const CHANNELS = [
  { id: "build", label: "construct", prefill: "/build ", icon: Hash },
  { id: "chart", label: "charts", prefill: "/chart ", icon: Hash },
  { id: "ask", label: "ask-maven", prefill: "/ask ", icon: Hash },
  { id: "general", label: "general", prefill: "", icon: Hash },
] as const;

export function Playground() {
  const reduce = useReducedMotion();
  const [messages, setMessages] = React.useState<Msg[]>([
    {
      id: "welcome",
      role: "bot",
      kind: "help",
      content: "Welcome! I'm the GuildLabs bot.",
    },
  ]);
  const [draft, setDraft] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [activeChannel, setActiveChannel] = React.useState<string>("build");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // autocomplete
  const slashMatch = /^\/(\w*)$/.exec(draft);
  const showMenu = !!slashMatch && !busy;
  const filtered = showMenu
    ? COMMANDS.filter((c) => c.name.startsWith(slashMatch![1].toLowerCase()))
    : [];
  const [menuIdx, setMenuIdx] = React.useState(0);

  const push = React.useCallback((m: Omit<Msg, "id">) => {
    const id = uid();
    setMessages((prev) => [...prev, { ...m, id }]);
    return id;
  }, []);
  const replace = React.useCallback((id: string, m: Omit<Msg, "id">) => {
    setMessages((prev) => prev.map((x) => (x.id === id ? { ...m, id } : x)));
  }, []);

  // auto-scroll
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [messages, reduce]);

  // ── command handlers ──
  async function runBuild(prompt: string) {
    if (!prompt.trim()) return botText("Tell me what to build — e.g. `/build a crypto trading community`.");
    const typingId = push({ role: "bot", kind: "typing", content: "Designing your server…" });
    setBusy(true);
    try {
      const res = await fetch("/api/construct/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: prompt, answers: [] }),
      });
      const data = await res.json();
      if (data?.ok && data.blueprint) {
        replace(typingId, { role: "bot", kind: "blueprint", blueprint: data.blueprint, source: data.source });
      } else {
        replace(typingId, { role: "bot", kind: "error", content: data?.error || "Couldn't build that — try rephrasing." });
      }
    } catch {
      replace(typingId, { role: "bot", kind: "error", content: "Network error — try again." });
    } finally {
      setBusy(false);
    }
  }

  async function runChart(symbol: string) {
    const sym = symbol.trim().toUpperCase();
    if (!sym) return botText("Give me a ticker — e.g. `/chart AAPL` or `/chart BTC-USD`.");
    const typingId = push({ role: "bot", kind: "typing", content: `Fetching ${sym}…` });
    setBusy(true);
    try {
      const res = await fetch(`/api/chart/${encodeURIComponent(sym)}?range=1mo`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || data?.error) {
        replace(typingId, { role: "bot", kind: "error", content: data?.error || `Couldn't load ${sym}.` });
      } else {
        const closes = Array.isArray(data.candles) ? data.candles.map((c: { close: number }) => c.close).filter((n: number) => Number.isFinite(n)) : [];
        replace(typingId, {
          role: "bot",
          kind: "chart",
          chart: {
            symbol: data.symbol ?? sym,
            name: data.name ?? sym,
            price: data.price ?? null,
            changePercent: data.changePercent ?? null,
            currency: data.currency ?? "USD",
            closes,
          },
        });
      }
    } catch {
      replace(typingId, { role: "bot", kind: "error", content: "Network error — try again." });
    } finally {
      setBusy(false);
    }
  }

  async function runAsk(question: string) {
    if (!question.trim()) return botText("Ask me something — e.g. `/ask what can Construct do?`");
    const typingId = push({ role: "bot", kind: "typing", content: "Maven is thinking…" });
    setBusy(true);
    try {
      const res = await fetch("/api/playground/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (data?.answer) {
        replace(typingId, { role: "bot", kind: "answer", content: data.answer, source: data.source });
      } else {
        replace(typingId, { role: "bot", kind: "error", content: data?.error || "Couldn't answer that." });
      }
    } catch {
      replace(typingId, { role: "bot", kind: "error", content: "Network error — try again." });
    } finally {
      setBusy(false);
    }
  }

  function botText(content: string) {
    push({ role: "bot", kind: "text", content });
  }

  function submit(raw: string) {
    const text = raw.trim();
    if (!text || busy) return;
    setDraft("");

    if (text.startsWith("/")) {
      const [cmd, ...rest] = text.slice(1).split(" ");
      const arg = rest.join(" ");
      push({ role: "user", kind: "text", content: text });
      switch (cmd.toLowerCase()) {
        case "build": return void runBuild(arg);
        case "chart": return void runChart(arg);
        case "ask": return void runAsk(arg);
        case "help": return void push({ role: "bot", kind: "help", content: "Here's what I can do:" });
        case "clear":
          return setMessages([{ id: uid(), role: "bot", kind: "help", content: "Chat cleared. What next?" }]);
        default:
          return botText(`Unknown command \`/${cmd}\`. Try /help.`);
      }
    }
    // plain text → Maven
    push({ role: "user", kind: "text", content: text });
    void runAsk(text);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (showMenu && filtered.length) {
      if (e.key === "ArrowDown") { e.preventDefault(); setMenuIdx((i) => (i + 1) % filtered.length); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setMenuIdx((i) => (i - 1 + filtered.length) % filtered.length); return; }
      if (e.key === "Tab") { e.preventDefault(); pickCommand(filtered[menuIdx].name); return; }
      if (e.key === "Enter") {
        const c = filtered[menuIdx];
        if (c.args) { e.preventDefault(); pickCommand(c.name); return; }
      }
    }
    if (e.key === "Enter") { e.preventDefault(); submit(draft); }
  }

  function pickCommand(name: CmdName) {
    const c = COMMANDS.find((x) => x.name === name)!;
    setDraft(c.args ? `/${name} ` : `/${name}`);
    inputRef.current?.focus();
  }

  function pickChannel(ch: (typeof CHANNELS)[number]) {
    setActiveChannel(ch.id);
    setDraft(ch.prefill);
    inputRef.current?.focus();
  }

  const activeLabel = CHANNELS.find((c) => c.id === activeChannel)?.label ?? "general";

  return (
    <div className="dark flex h-dvh w-full overflow-hidden bg-background text-foreground">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-card-border bg-background-deep sm:flex">
        <div className="flex h-14 items-center gap-2 border-b border-card-border px-4">
          <GuildLabsLogo className="h-6 w-auto" />
          <span className="font-display text-sm font-black">Playground</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <ChannelGroup label="Bot commands">
            {CHANNELS.map((ch) => (
              <button
                key={ch.id}
                onClick={() => pickChannel(ch)}
                className={cn(
                  "flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  activeChannel === ch.id ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <Hash className="size-4 shrink-0 opacity-70" /> {ch.label}
              </button>
            ))}
          </ChannelGroup>
          <ChannelGroup label="Voice">
            <div className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground/70">
              <Volume2 className="size-4 shrink-0 opacity-70" /> Lounge
            </div>
          </ChannelGroup>
        </div>
        <div className="border-t border-card-border p-3">
          <Link href="/" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
            <Home className="size-4" /> Back to GuildLabs
          </Link>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* channel header */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-card-border px-4">
          <Hash className="size-5 text-muted-foreground" />
          <span className="font-display font-bold">{activeLabel}</span>
          <span className="ml-2 hidden text-sm text-muted-foreground sm:inline">· type <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">/</kbd> for commands</span>
        </header>

        {/* messages */}
        <div ref={scrollRef} className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
          <div className="mb-4">
            <div className="grid size-14 place-items-center rounded-full bg-primary/15 text-primary">
              <Bot className="size-7" />
            </div>
            <h1 className="mt-3 font-display text-2xl font-black">This is the GuildLabs bot playground</h1>
            <p className="mt-1 max-w-lg text-sm text-muted-foreground">
              Type a slash command and I&apos;ll do it right here — build a server, post a chart, or answer a question. Try <code className="font-mono text-foreground">/build a study group server</code>.
            </p>
          </div>

          {messages.map((m) => (
            <MessageRow key={m.id} msg={m} reduce={!!reduce} />
          ))}
        </div>

        {/* composer */}
        <div className="relative shrink-0 px-4 pb-5 pt-1">
          {/* slash menu */}
          <AnimatePresence>
            {showMenu && filtered.length > 0 && (
              <motion.div
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-full left-4 right-4 mb-2 overflow-hidden rounded-2xl border border-card-border bg-card shadow-xl"
              >
                <div className="px-3 py-2 text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground">
                  Commands
                </div>
                {filtered.map((c, i) => {
                  const Icon = c.icon;
                  return (
                    <button
                      key={c.name}
                      onMouseEnter={() => setMenuIdx(i)}
                      onClick={() => pickCommand(c.name)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors cursor-pointer",
                        i === menuIdx ? "bg-primary/10" : "hover:bg-muted/50"
                      )}
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-foreground">
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="font-mono text-sm font-semibold text-foreground">
                          /{c.name} <span className="text-muted-foreground">{c.args}</span>
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">{c.desc}</span>
                      </span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-2 rounded-2xl border border-card-border bg-muted/40 px-3">
            <Plus className="size-5 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setMenuIdx(0);
              }}
              onKeyDown={onKeyDown}
              disabled={busy}
              autoFocus
              aria-label={`Message #${activeLabel}`}
              placeholder={busy ? "Working…" : `Message #${activeLabel} — try /build, /chart, /ask`}
              className="h-12 w-full bg-transparent text-[0.95rem] outline-none placeholder:text-muted-foreground disabled:opacity-60"
            />
            <button
              onClick={() => submit(draft)}
              disabled={busy || !draft.trim()}
              aria-label="Send"
              className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:brightness-110 disabled:opacity-40 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChannelGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="px-2 pb-1 text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground/70">
        {label}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

// ── Message row ────────────────────────────────────────────────────────────────
function MessageRow({ msg, reduce }: { msg: Msg; reduce: boolean }) {
  const isBot = msg.role === "bot";
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/30"
    >
      <div className="mt-0.5 shrink-0">
        {isBot ? (
          <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground">
            <Bot className="size-5" />
          </span>
        ) : (
          <span className="grid size-9 place-items-center rounded-full bg-muted font-display text-sm font-bold text-foreground">
            You
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-sm font-bold">
            {isBot ? "GuildLabs" : "You"}
          </span>
          {isBot && (
            <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-primary">
              Bot
            </span>
          )}
        </div>
        <div className="mt-0.5 text-[0.95rem] leading-relaxed text-foreground/90">
          <MessageBody msg={msg} />
        </div>
      </div>
    </motion.div>
  );
}

function MessageBody({ msg }: { msg: Msg }) {
  switch (msg.kind) {
    case "typing":
      return (
        <span className="inline-flex items-center gap-2 text-muted-foreground">
          <span className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${i * 120}ms` }} />
            ))}
          </span>
          {msg.content}
        </span>
      );
    case "error":
      return <span className="text-destructive">{msg.content}</span>;
    case "help":
      return <HelpEmbed intro={msg.content} />;
    case "blueprint":
      return msg.blueprint ? <BlueprintEmbed bp={msg.blueprint} source={msg.source} /> : null;
    case "chart":
      return msg.chart ? <ChartEmbed c={msg.chart} /> : null;
    case "answer":
      return <AnswerEmbed text={msg.content ?? ""} source={msg.source} />;
    default:
      return <span className="whitespace-pre-wrap break-words">{msg.content}</span>;
  }
}

// ── Embeds ──────────────────────────────────────────────────────────────────────
function HelpEmbed({ intro }: { intro?: string }) {
  return (
    <div>
      {intro && <p className="mb-2">{intro}</p>}
      <div className="overflow-hidden rounded-xl border-l-4 border-primary bg-card">
        <ul className="divide-y divide-card-border">
          {COMMANDS.map((c) => {
            const Icon = c.icon;
            return (
              <li key={c.name} className="flex items-center gap-3 px-3 py-2">
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </span>
                <span className="font-mono text-sm font-semibold">
                  /{c.name} <span className="text-muted-foreground">{c.args}</span>
                </span>
                <span className="ml-auto hidden text-xs text-muted-foreground sm:inline">{c.desc}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

const channelGlyph = (t: string) => (t === "voice" || t === "stage" ? "🔊" : "#");

function BlueprintEmbed({ bp, source }: { bp: Blueprint; source?: "ai" | "offline" }) {
  return (
    <div className="max-w-xl overflow-hidden rounded-xl border-l-4 border-primary bg-card p-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-secondary">
        <Boxes className="size-4" /> CONSTRUCT BLUEPRINT
        {source === "offline" && <span className="rounded bg-coral/15 px-1.5 py-0.5 text-[0.6rem] text-coral">offline</span>}
      </div>
      <h3 className="mt-1 font-display text-xl font-black">{bp.name}</h3>
      <p className="mt-0.5 text-sm text-muted-foreground">{bp.summary}</p>

      <div className="mt-3 grid grid-cols-4 gap-2 text-center">
        {[["Cats", bp.stats.categories], ["Chans", bp.stats.channels], ["Voice", bp.stats.voice], ["Roles", bp.stats.roles]].map(([l, v]) => (
          <div key={l as string} className="rounded-lg bg-muted/50 py-1.5">
            <div className="font-display text-lg font-black tabular-nums">{v}</div>
            <div className="text-[0.6rem] uppercase tracking-widest text-muted-foreground">{l}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 max-h-64 space-y-3 overflow-y-auto pr-1 font-mono text-sm">
        {bp.categories.slice(0, 6).map((cat) => (
          <div key={cat.name}>
            <div className="text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground">
              {cat.emoji} {cat.name}
            </div>
            <ul className="mt-1 space-y-0.5">
              {cat.channels.slice(0, 6).map((ch) => (
                <li key={ch.name + ch.type} className="flex items-center gap-1.5 text-foreground/80">
                  <span className="text-muted-foreground">{channelGlyph(ch.type)}</span>
                  <span className="truncate">{ch.name}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {bp.roles.slice(0, 8).map((r) => (
          <span key={r.name} className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-xs" style={{ color: r.color }}>
            <ShieldCheck className="size-3" /> {r.name}
          </span>
        ))}
      </div>

      <Link href="/#builder" className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground hover:brightness-110">
        <Rocket className="size-4" /> Open in Construct <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}

function fmtPrice(n: number | null, currency: string) {
  if (n == null) return "—";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: Math.abs(n) < 1 ? 6 : 2 }).format(n);
  } catch {
    return `$${n}`;
  }
}

function ChartEmbed({ c }: { c: ChartPayload }) {
  const up = (c.changePercent ?? 0) >= 0;
  const color = up ? "var(--success)" : "var(--secondary)";
  return (
    <div className="max-w-xl overflow-hidden rounded-xl border-l-4 bg-card p-4" style={{ borderColor: color }}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <LineChart className="size-4" style={{ color }} />
            <span className="font-mono">{c.symbol}</span>
          </div>
          <h3 className="mt-0.5 truncate font-display text-lg font-black">{c.name}</h3>
        </div>
        <div className="text-right">
          <div className="font-display text-xl font-black tabular-nums">{fmtPrice(c.price, c.currency)}</div>
          {c.changePercent != null && (
            <div className="inline-flex items-center gap-1 font-mono text-sm font-bold tabular-nums" style={{ color }}>
              {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
              {up ? "+" : ""}{c.changePercent.toFixed(2)}%
            </div>
          )}
        </div>
      </div>
      <Sparkline values={c.closes} color={color} />
      <Link href={`/c/${encodeURIComponent(c.symbol)}`} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
        Open full chart <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) {
    return <div className="mt-3 h-24 rounded-lg bg-muted/40" />;
  }
  const w = 600, h = 96, pad = 4;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - 2 * pad);
    const y = pad + (1 - (v - min) / range) * (h - 2 * pad);
    return [x, y] as const;
  });
  const line = pts.map((p) => p.join(",")).join(" ");
  const area = `${pad},${h - pad} ${line} ${w - pad},${h - pad}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 h-24 w-full" preserveAspectRatio="none" aria-hidden>
      <polygon points={area} fill={color} opacity={0.12} />
      <polyline points={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function AnswerEmbed({ text, source }: { text: string; source?: "ai" | "offline" }) {
  return (
    <div className="max-w-xl overflow-hidden rounded-xl border-l-4 border-secondary bg-card p-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-secondary">
        <MessageCircleQuestion className="size-4" /> MAVEN
        {source === "offline" && <span className="rounded bg-coral/15 px-1.5 py-0.5 text-[0.6rem] text-coral">offline</span>}
      </div>
      <p className="mt-1.5 whitespace-pre-wrap break-words text-[0.95rem] leading-relaxed text-foreground/90">{text}</p>
    </div>
  );
}
