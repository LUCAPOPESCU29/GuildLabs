"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronRight, Plus, X, ListPlus, Star } from "lucide-react";
import { EASE_EXPO } from "@/lib/motion";
import { DetailsTab } from "@/components/chart/details-tab";

type PanelTab = "watchlist" | "details";

type WatchGroup = { name: string; symbols: string[] };
type Quote = { symbol: string; last: number; chg: number; chgPct: number; currency: string };

const STORAGE_KEY = "chartit:watchlist:v1";

const DEFAULT_GROUPS: WatchGroup[] = [
  // ETF proxies for the major indices resolve via Nasdaq (raw "^" index symbols
  // don't from datacenter IPs), so the default watchlist is live out of the box.
  { name: "Markets", symbols: ["SPY", "QQQ", "DIA", "IWM"] },
  { name: "Stocks", symbols: ["AAPL", "TSLA", "NVDA", "MSFT", "AMZN"] },
  { name: "Crypto", symbols: ["BTC-USD", "ETH-USD", "SOL-USD", "XRP-USD"] },
];

function loadGroups(): WatchGroup[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_GROUPS;
}

function fmt(n: number) {
  const abs = Math.abs(n);
  if (abs !== 0 && abs < 1) return n.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function WatchlistPanel({ currentSymbol }: { currentSymbol: string }) {
  const reduce = useReducedMotion();
  const [open, setOpen] = React.useState(true);
  const [groups, setGroups] = React.useState<WatchGroup[]>(DEFAULT_GROUPS);
  const [quotes, setQuotes] = React.useState<Record<string, Quote>>({});
  const [adding, setAdding] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [tab, setTab] = React.useState<PanelTab>("watchlist");

  // Hydrate from localStorage (client-only) + default-collapse on small screens.
  React.useEffect(() => {
    setGroups(loadGroups());
    if (window.matchMedia("(max-width: 1024px)").matches) setOpen(false);
  }, []);

  const persist = React.useCallback((next: WatchGroup[]) => {
    setGroups(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const allSymbols = React.useMemo(
    () => [...new Set(groups.flatMap((g) => g.symbols))],
    [groups]
  );

  // Poll live quotes; pause when the tab is hidden.
  React.useEffect(() => {
    if (allSymbols.length === 0) return;
    let active = true;
    async function tick() {
      if (document.hidden) return;
      try {
        const res = await fetch(`/api/quote?symbols=${encodeURIComponent(allSymbols.join(","))}`);
        if (!res.ok) return;
        const { quotes: list } = (await res.json()) as { quotes: Quote[] };
        if (!active) return;
        setQuotes((prev) => {
          const next = { ...prev };
          for (const q of list) next[q.symbol.toUpperCase()] = q;
          return next;
        });
      } catch {
        /* ignore */
      }
    }
    tick();
    const id = setInterval(tick, 20_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [allSymbols]);

  function addSymbol() {
    const sym = draft.trim().toUpperCase();
    setDraft("");
    setAdding(false);
    if (!sym) return;
    // Add to a "Watchlist" group (created at the top if missing), no duplicates.
    const next = [...groups];
    const idx = next.findIndex((g) => g.name === "Watchlist");
    if (idx === -1) {
      next.unshift({ name: "Watchlist", symbols: [sym] });
    } else if (!next[idx].symbols.includes(sym)) {
      next[idx] = { ...next[idx], symbols: [sym, ...next[idx].symbols] };
    }
    persist(next);
  }

  function removeSymbol(groupName: string, sym: string) {
    persist(
      groups
        .map((g) => (g.name === groupName ? { ...g, symbols: g.symbols.filter((s) => s !== sym) } : g))
        .filter((g) => g.symbols.length > 0 || g.name !== "Watchlist")
    );
  }

  return (
    <>
      {/* Toggle tab — always reachable */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Hide watchlist" : "Show watchlist"}
        aria-expanded={open}
        className="fixed right-0 top-24 z-40 hidden items-center gap-1 rounded-l-xl border border-r-0 border-card-border bg-card px-2 py-3 text-xs font-semibold text-muted-foreground shadow-lg transition-colors hover:text-foreground lg:flex"
        style={{ writingMode: "vertical-rl" }}
      >
        <Star className="size-3.5 rotate-90" /> Watchlist
      </button>

      <AnimatePresence>
        {open && (
          <motion.aside
            initial={reduce ? { opacity: 0 } : { x: 320, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { x: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { x: 320, opacity: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.28, ease: EASE_EXPO }}
            className="fixed right-0 top-20 z-40 hidden h-[calc(100vh-6rem)] w-80 flex-col border-l border-card-border bg-card/95 backdrop-blur-md lg:flex"
            aria-label="Watchlist"
          >
            {/* Header — tab switcher */}
            <div className="flex items-center justify-between border-b border-card-border px-3 py-2">
              <div className="flex items-center gap-1" role="tablist" aria-label="Panel tabs">
                {(["watchlist", "details"] as PanelTab[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="tab"
                    aria-selected={tab === t}
                    onClick={() => setTab(t)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-colors ${
                      tab === t ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1">
                {tab === "watchlist" && (
                  <button
                    type="button"
                    onClick={() => setAdding((v) => !v)}
                    aria-label="Add symbol"
                    className="grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Plus className="size-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>

            {/* Details tab */}
            {tab === "details" && <DetailsTab symbol={currentSymbol} />}

            {/* Watchlist tab */}
            {tab === "watchlist" && (
            <>
            {/* Add input */}
            <AnimatePresence>
              {adding && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-card-border px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <ListPlus className="size-4 text-muted-foreground" />
                    <input
                      autoFocus
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addSymbol()}
                      placeholder="Add ticker — e.g. NFLX, DOGE-USD"
                      className="glass-input w-full rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Column header */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-card-border px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Symbol</span>
              <span className="text-right">Last</span>
              <span className="w-14 text-right">Chg%</span>
            </div>

            {/* Groups */}
            <div className="flex-1 overflow-y-auto">
              {groups.map((g) => (
                <div key={g.name}>
                  <div className="bg-muted/40 px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {g.name}
                  </div>
                  {g.symbols.map((sym) => {
                    const q = quotes[sym.toUpperCase()];
                    const up = (q?.chgPct ?? 0) >= 0;
                    const isCurrent = sym.toUpperCase() === currentSymbol.toUpperCase();
                    return (
                      <div
                        key={sym}
                        className={`group/row relative grid grid-cols-[1fr_auto_auto] items-center gap-3 px-4 py-2 transition-colors hover:bg-muted ${
                          isCurrent ? "bg-primary/10" : ""
                        }`}
                      >
                        <Link href={`/c/${encodeURIComponent(sym)}`} className="min-w-0 font-mono text-sm font-semibold">
                          <span className={isCurrent ? "text-primary" : ""}>{sym}</span>
                        </Link>
                        <span className="text-right font-mono text-sm">{q ? fmt(q.last) : "—"}</span>
                        <span
                          className={`w-14 text-right font-mono text-xs font-semibold ${
                            q ? (up ? "text-success" : "text-coral") : "text-muted-foreground"
                          }`}
                        >
                          {q ? `${up ? "+" : ""}${q.chgPct.toFixed(2)}%` : "—"}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSymbol(g.name, sym)}
                          aria-label={`Remove ${sym}`}
                          className="absolute right-1 top-1/2 hidden -translate-y-1/2 rounded-md bg-card p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-coral group-hover/row:opacity-100 lg:block"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="border-t border-card-border px-4 py-2 text-[10px] text-muted-foreground">
              Live · updates every 20s · informational only
            </div>
            </>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
