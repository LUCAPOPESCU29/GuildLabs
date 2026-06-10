"use client";

import * as React from "react";
import { RefreshCw, ShieldAlert, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

type Guild = { id: string; name: string; icon: string | null; memberCount: number };

export function AdminGuilds() {
  const [guilds, setGuilds] = React.useState<Guild[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/guilds", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Couldn't load servers.");
      setGuilds(Array.isArray(json) ? json : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load servers.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    void load();
  }, [load]);

  const total = guilds?.length ?? 0;
  const members = guilds?.reduce((n, g) => n + (g.memberCount || 0), 0) ?? 0;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex gap-3">
          <Stat label="Servers" value={loading ? "—" : String(total)} />
          <Stat label="Total members" value={loading ? "—" : members.toLocaleString()} />
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-coral/30 bg-coral/10 p-4 text-sm">
          <ShieldAlert className="size-5 shrink-0 text-coral" />
          <span className="text-foreground/90">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="overflow-hidden rounded-3xl border border-card-border bg-card">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 border-b border-card-border p-4 last:border-0">
              <Skeleton className="size-10 rounded-2xl" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="ml-auto h-4 w-16" />
            </div>
          ))}
        </div>
      ) : total === 0 && !error ? (
        <EmptyState icon={Server} title="No servers" body="The bot hasn't been added to any servers yet." />
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-card-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border text-left">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Server</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-widest text-muted-foreground">Members</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-widest text-muted-foreground">ID</th>
              </tr>
            </thead>
            <tbody>
              {guilds!.map((g) => (
                <tr key={g.id} className="border-b border-card-border last:border-0 hover:bg-muted/40">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {g.icon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={g.icon} alt="" className="size-10 rounded-2xl" />
                      ) : (
                        <div className="grid size-10 place-items-center rounded-2xl bg-primary/15 font-display text-lg font-bold text-primary">
                          {g.name[0]}
                        </div>
                      )}
                      <span className="font-display font-bold">{g.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">
                    {g.memberCount.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-xs text-muted-foreground">{g.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-2xl px-4 py-2.5">
      <div className="font-display text-xl font-black tabular-nums">{value}</div>
      <div className="text-[0.6rem] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}
