"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import type { BotStatus } from "@/app/api/status/route";

type BotCheck = { slug: string; name: string; status: BotStatus; latencyMs: number | null };
type StatusPayload = { checkedAt: string; bots: BotCheck[] };

const META: Record<BotStatus, { label: string; dot: string; text: string }> = {
  operational: { label: "Operational", dot: "bg-success", text: "text-success" },
  degraded: { label: "Degraded", dot: "bg-coral", text: "text-coral" },
  down: { label: "Down", dot: "bg-destructive", text: "text-destructive" },
  unknown: { label: "Unknown", dot: "bg-muted-foreground", text: "text-muted-foreground" },
};

export function StatusBoard() {
  const [data, setData] = React.useState<StatusPayload | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const res = await fetch("/api/status", { cache: "no-store" });
      if (!res.ok) throw new Error();
      setData(await res.json());
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // Defer the initial fetch off the synchronous effect path, then poll.
    queueMicrotask(load);
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  const bots = data?.bots ?? [];
  const overall: BotStatus = bots.some((b) => b.status === "down")
    ? "down"
    : bots.some((b) => b.status === "degraded")
      ? "degraded"
      : bots.length && bots.every((b) => b.status === "operational")
        ? "operational"
        : "unknown";

  const overallLabel =
    overall === "operational"
      ? "All systems operational"
      : overall === "degraded"
        ? "Some systems degraded"
        : overall === "down"
          ? "Some systems down"
          : "Status unavailable";

  return (
    <div>
      {/* Overall banner */}
      <div className="glass flex items-center justify-between gap-4 rounded-3xl p-6">
        <div className="flex items-center gap-3">
          <span className={`size-3 rounded-full ${META[overall].dot}`} aria-hidden />
          <span className="font-display text-lg font-black">{overallLabel}</span>
        </div>
        <button
          type="button"
          onClick={load}
          aria-label="Refresh status"
          className="grid size-9 place-items-center rounded-xl border border-card-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Per-bot rows */}
      <div className="mt-4 space-y-3">
        {loading && !data
          ? [0, 1, 2].map((i) => <div key={i} className="glass h-16 animate-pulse rounded-2xl" />)
          : bots.map((b) => {
              const m = META[b.status];
              return (
                <div key={b.slug} className="glass flex items-center justify-between gap-4 rounded-2xl px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className={`size-2.5 rounded-full ${m.dot}`} aria-hidden />
                    <span className="font-display font-bold">{b.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {b.latencyMs != null && (
                      <span className="font-mono text-xs text-muted-foreground">{b.latencyMs} ms</span>
                    )}
                    <span className={`text-sm font-semibold ${m.text}`}>{m.label}</span>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Footer note */}
      <p className="mt-5 text-xs text-muted-foreground">
        {error
          ? "Couldn't reach the status service — retrying automatically."
          : data
            ? `Last checked ${new Date(data.checkedAt).toLocaleTimeString()} · auto-refreshes every 30s`
            : "Checking…"}
      </p>
    </div>
  );
}
