"use client";

/**
 * Global ⌘K command palette (cmdk). Themed to the existing tokens. Opens on
 * ⌘K / Ctrl+K anywhere, or via the `guildlabs:command` window event (the nav
 * search pill dispatches it). Jumps to pages, opens a chart for any ticker, and
 * toggles the theme. Mounted once in providers.tsx so it's on every route.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Command } from "cmdk";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Search,
  LineChart,
  Boxes,
  BookOpen,
  LayoutDashboard,
  Sparkles,
  Sun,
  Moon,
  Monitor,
  FileText,
  GitCompare,
  Activity,
  Heart,
  Wand2,
  TrendingUp,
} from "lucide-react";

type Item = { label: string; href: string; icon: React.ComponentType<{ className?: string }>; hint?: string };

const PAGES: Item[] = [
  { label: "ChartIt — live charts", href: "/bots/chartit", icon: LineChart },
  { label: "Construct — server builder", href: "/bots/construct", icon: Boxes },
  { label: "Maven — community", href: "/bots/maven", icon: BookOpen },
  { label: "All bots", href: "/bots", icon: Boxes },
  { label: "Templates", href: "/templates", icon: FileText },
  { label: "Browse charts", href: "/stocks", icon: LineChart },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Docs", href: "/docs", icon: FileText },
  { label: "Guides", href: "/guides", icon: BookOpen },
  { label: "Compare with alternatives", href: "/vs", icon: GitCompare },
  { label: "Changelog", href: "/changelog", icon: Sparkles },
  { label: "Status", href: "/status", icon: Activity },
  { label: "Wall of love", href: "/wall", icon: Heart },
];

const POPULAR = ["AAPL", "NVDA", "TSLA", "BTC-USD", "ETH-USD", "SPY"];

const itemClass =
  "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground/90 transition-colors data-[selected=true]:bg-primary/10 data-[selected=true]:text-foreground";

export function CommandPalette() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const reduce = useReducedMotion();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onEvt = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("guildlabs:command", onEvt);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("guildlabs:command", onEvt);
    };
  }, []);

  const go = React.useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router]
  );

  const tickerGuess = query.trim().toUpperCase().replace(/\s+/g, "");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command menu"
            className="glass-strong relative w-full max-w-xl overflow-hidden rounded-2xl shadow-2xl"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            <Command label="Command menu" className="font-sans">
              <div className="flex items-center gap-2 border-b border-card-border px-4">
                <Search className="size-4 shrink-0 text-muted-foreground" />
                <Command.Input
                  autoFocus
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Search pages, tickers, actions…"
                  className="w-full bg-transparent py-4 text-sm outline-none placeholder:text-muted-foreground"
                />
                <kbd className="hidden shrink-0 rounded-md border border-card-border bg-muted/60 px-1.5 py-0.5 text-[0.65rem] text-muted-foreground sm:block">
                  esc
                </kbd>
              </div>

              <Command.List className="max-h-[22rem] overflow-y-auto p-2">
                <Command.Empty className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No results — try a ticker like “AAPL”.
                </Command.Empty>

                {tickerGuess.length >= 1 && (
                  <Command.Group heading="Chart" className="px-1 text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
                    <Command.Item value={`open chart ${tickerGuess}`} onSelect={() => go(`/c/${tickerGuess}`)} className={itemClass}>
                      <TrendingUp className="size-4 shrink-0 text-accent" />
                      Open chart for <span className="font-mono font-semibold">{tickerGuess}</span>
                    </Command.Item>
                  </Command.Group>
                )}

                <Command.Group heading="Actions" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[0.7rem] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-muted-foreground">
                  <Command.Item value="build a server construct ai" onSelect={() => go("/#builder")} className={itemClass}>
                    <Wand2 className="size-4 shrink-0 text-secondary" /> Build a server with AI
                  </Command.Item>
                  <Command.Item value="theme dark" onSelect={() => { setTheme("dark"); setOpen(false); }} className={itemClass}>
                    <Moon className="size-4 shrink-0 text-muted-foreground" /> Dark theme
                  </Command.Item>
                  <Command.Item value="theme light" onSelect={() => { setTheme("light"); setOpen(false); }} className={itemClass}>
                    <Sun className="size-4 shrink-0 text-muted-foreground" /> Light theme
                  </Command.Item>
                  <Command.Item value="theme system" onSelect={() => { setTheme("system"); setOpen(false); }} className={itemClass}>
                    <Monitor className="size-4 shrink-0 text-muted-foreground" /> System theme
                  </Command.Item>
                </Command.Group>

                <Command.Group heading="Popular charts" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[0.7rem] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-muted-foreground">
                  {POPULAR.map((t) => (
                    <Command.Item key={t} value={`chart ${t}`} onSelect={() => go(`/c/${t}`)} className={itemClass}>
                      <LineChart className="size-4 shrink-0 text-muted-foreground" />
                      <span className="font-mono">{t}</span>
                    </Command.Item>
                  ))}
                </Command.Group>

                <Command.Group heading="Go to" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[0.7rem] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-muted-foreground">
                  {PAGES.map((p) => {
                    const Icon = p.icon;
                    return (
                      <Command.Item key={p.href} value={p.label} onSelect={() => go(p.href)} className={itemClass}>
                        <Icon className="size-4 shrink-0 text-muted-foreground" /> {p.label}
                      </Command.Item>
                    );
                  })}
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
