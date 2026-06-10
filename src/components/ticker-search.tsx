"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { TICKERS } from "@/lib/seo-data/tickers";

/**
 * Reusable ticker search — typeahead over the curated ticker list with free-text
 * fallback. On submit/select it routes to the live chart at /c/[symbol].
 * Used on the homepage, the /stocks hub, and the chart top bar.
 */
export function TickerSearch({
  placeholder = "Search any ticker — AAPL, BTC-USD, TSLA…",
  autoFocus = false,
  className = "",
}: {
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);

  const q = query.trim().toUpperCase();
  const matches = React.useMemo(() => {
    if (!q) return [];
    return TICKERS.filter(
      (t) => t.symbol.includes(q) || t.name.toUpperCase().includes(q)
    ).slice(0, 8);
  }, [q]);

  // Close the dropdown on outside click.
  React.useEffect(() => {
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function go(symbol: string) {
    const clean = symbol.trim().toUpperCase();
    if (!clean) return;
    setOpen(false);
    router.push(`/c/${encodeURIComponent(clean)}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || matches.length === 0) {
      if (e.key === "Enter" && q) go(q);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(matches[active]?.symbol ?? q);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => query && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label="Search ticker"
          role="combobox"
          aria-expanded={open && matches.length > 0}
          aria-controls="ticker-search-list"
          className="glass-input w-full rounded-2xl py-3.5 pl-12 pr-4 text-base outline-none transition-shadow focus:ring-2 focus:ring-ring"
        />
      </div>

      {open && matches.length > 0 && (
        <ul
          id="ticker-search-list"
          role="listbox"
          className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-card-border bg-card p-1.5 shadow-lg"
        >
          {matches.map((t, i) => (
            <li key={t.symbol} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => go(t.symbol)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  i === active ? "bg-muted" : "hover:bg-muted"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold">{t.symbol}</span>
                  <span className="truncate text-sm text-muted-foreground">{t.name}</span>
                </span>
                <span className="text-xs text-muted-foreground">View chart →</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
