"use client";

import * as React from "react";
import Image from "next/image";
import {
  RefreshCw, ShieldAlert, Server, Users, Activity, Crown,
  Search, LogOut, ExternalLink, BadgeCheck, Sparkles, Link2, Copy, Check, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Guild = {
  id: string; name: string; iconUrl: string | null; owner: boolean;
  memberCount: number; onlineCount: number; createdAt: string; ageDays: number;
  isCommunity: boolean; isVerified: boolean; isPartnered: boolean; hasAdmin: boolean;
};

type Analytics = {
  ok: true;
  bot: { id: string; username: string; avatarUrl: string | null };
  totals: {
    servers: number; members: number; online: number; largest: number; median: number;
    community: number; verified: number; partnered: number; adminGrants: number;
  };
  distribution: { label: string; count: number }[];
  byMonth: { month: string; count: number }[];
  guilds: Guild[];
  fetchedAt: string;
};

type Invite = {
  guildId: string; code: string | null; url: string | null;
  kind: "vanity" | "existing" | null; uses: number | null;
  neverExpires: boolean; totalInvites: number; error?: string;
};

const nf = new Intl.NumberFormat("en-US");

/** Copy-to-clipboard cell for an invite link. */
function InviteCell({ invite }: { invite: Invite | undefined }) {
  const [copied, setCopied] = React.useState(false);
  if (!invite) return <span className="text-xs text-muted-foreground">—</span>;
  if (!invite.url) {
    return (
      <span className="text-xs text-muted-foreground" title={invite.error ?? ""}>
        {invite.error === "No invites exist in this server" ? "none" : "unavailable"}
      </span>
    );
  }
  return (
    <div className="flex items-center justify-end gap-1">
      <a
        href={invite.url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-xs text-primary hover:underline"
        title={`${invite.kind === "vanity" ? "Vanity URL" : `${invite.totalInvites} invite(s)`}${invite.neverExpires ? " · never expires" : " · expires"}`}
      >
        /{invite.code}
      </a>
      <button
        onClick={() => {
          void navigator.clipboard.writeText(invite.url!).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
        }}
        className="grid size-6 shrink-0 place-items-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Copy invite link"
      >
        {copied ? <Check className="size-3 text-primary" /> : <Copy className="size-3" />}
      </button>
    </div>
  );
}

/* ── Stat tile — a headline number is not a chart ─────────────────────────── */
function Stat({
  label, value, sub, icon: Icon,
}: { label: string; value: string; sub?: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-2xl border border-card-border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-2 font-display text-3xl font-black tabular-nums">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

/**
 * Single-series magnitude → horizontal bars, one hue, no legend (the title names
 * the series), counts direct-labeled. Bars carry a 2px surface gap and rounded
 * data-ends anchored to the baseline.
 */
function BarRow({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="group grid grid-cols-[5.5rem_1fr_2.5rem] items-center gap-3 py-1">
      <span className="text-right font-mono text-xs text-muted-foreground">{label}</span>
      <div className="h-5 rounded-md bg-muted/40">
        <div
          className="h-full rounded-md bg-primary transition-[width] duration-500 group-hover:brightness-110"
          style={{ width: `${Math.max(pct, count > 0 ? 2 : 0)}%` }}
          title={`${count} server${count === 1 ? "" : "s"}`}
        />
      </div>
      <span className="font-mono text-xs tabular-nums text-foreground">{count}</span>
    </div>
  );
}

export function AdminDashboard() {
  const [data, setData] = React.useState<Analytics | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");
  const [sort, setSort] = React.useState<"members" | "name" | "age">("members");
  const [invites, setInvites] = React.useState<Record<string, Invite>>({});
  const [invLoading, setInvLoading] = React.useState(false);
  const [invError, setInvError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/analytics", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error ?? "Couldn't load analytics.");
      setData(json as Analytics);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    void load();
  }, [load]);

  async function loadInvites() {
    if (!data) return;
    setInvLoading(true);
    setInvError(null);
    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildIds: data.guilds.map((g) => g.id) }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error ?? "Couldn't load invites.");
      const map: Record<string, Invite> = {};
      (json.invites as Invite[]).forEach((i) => { map[i.guildId] = i; });
      setInvites(map);
    } catch (e) {
      setInvError(e instanceof Error ? e.message : "Couldn't load invites.");
    } finally {
      setInvLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }

  const guilds = React.useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    const rows = needle
      ? data.guilds.filter((g) => g.name.toLowerCase().includes(needle) || g.id.includes(needle))
      : data.guilds;
    const sorted = [...rows];
    if (sort === "members") sorted.sort((a, b) => b.memberCount - a.memberCount);
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "age") sorted.sort((a, b) => b.ageDays - a.ageDays);
    return sorted;
  }, [data, q, sort]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-3xl border border-card-border bg-card p-10 text-muted-foreground">
        <RefreshCw className="size-5 animate-spin" /> Loading analytics from Discord…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-coral/30 bg-coral/10 p-6">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-coral" />
          <div>
            <p className="font-semibold">{error}</p>
            <Button size="sm" variant="outline" className="mt-4" onClick={load}>
              <RefreshCw className="size-4" /> Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;
  const t = data.totals;
  const maxBucket = Math.max(...data.distribution.map((d) => d.count), 1);
  const maxMonth = Math.max(...data.byMonth.map((m) => m.count), 1);

  return (
    <div className="space-y-8">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {data.bot.avatarUrl && (
            <Image
              src={data.bot.avatarUrl}
              alt=""
              width={40}
              height={40}
              className="size-10 rounded-full"
              unoptimized
            />
          )}
          <div>
            <div className="font-display font-black">{data.bot.username}</div>
            <div className="text-xs text-muted-foreground">
              Updated {new Date(data.fetchedAt).toLocaleTimeString()}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={loadInvites} disabled={invLoading}>
            {invLoading ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
            {Object.keys(invites).length ? "Reload invites" : "Fetch invites"}
          </Button>
          <Button size="sm" variant="outline" onClick={load}>
            <RefreshCw className="size-4" /> Refresh
          </Button>
          <Button size="sm" variant="ghost" onClick={logout}>
            <LogOut className="size-4" /> Lock
          </Button>
        </div>
      </div>

      {/* Headline numbers */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Servers" value={nf.format(t.servers)} icon={Server}
          sub={`${t.adminGrants} granted admin`} />
        <Stat label="Members reached" value={nf.format(t.members)} icon={Users}
          sub={`median ${nf.format(t.median)} per server`} />
        <Stat label="Online now" value={nf.format(t.online)} icon={Activity}
          sub={t.members ? `${Math.round((t.online / t.members) * 100)}% of members` : undefined} />
        <Stat label="Largest server" value={nf.format(t.largest)} icon={Crown}
          sub={data.guilds[0]?.name} />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-card-border bg-card p-6">
          <h3 className="font-display text-lg font-black">Server size</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">How many servers fall in each member range.</p>
          <div className="mt-4">
            {data.distribution.map((d) => (
              <BarRow key={d.label} label={d.label} count={d.count} max={maxBucket} />
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-card-border bg-card p-6">
          <h3 className="font-display text-lg font-black">Server age</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            When these servers were created — a proxy for install cohorts, not the install date itself.
          </p>
          <div className="mt-4 flex h-32 items-end gap-1">
            {data.byMonth.slice(-18).map((m) => (
              <div key={m.month} className="group flex flex-1 flex-col items-center justify-end gap-1">
                <div
                  className="w-full rounded-t-md bg-primary transition-[height] duration-500 group-hover:brightness-110"
                  style={{ height: `${Math.max((m.count / maxMonth) * 100, 3)}%` }}
                  title={`${m.month}: ${m.count} server${m.count === 1 ? "" : "s"}`}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between font-mono text-[0.65rem] text-muted-foreground">
            <span>{data.byMonth.slice(-18)[0]?.month}</span>
            <span>{data.byMonth[data.byMonth.length - 1]?.month}</span>
          </div>
        </section>
      </div>

      {/* Feature counts */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Community servers", n: t.community, icon: Sparkles as React.ComponentType<{ className?: string }> },
          { label: "Verified", n: t.verified, icon: BadgeCheck },
          { label: "Partnered", n: t.partnered, icon: BadgeCheck },
        ].map((f) => (
          <span key={f.label} className="inline-flex items-center gap-2 rounded-full border border-card-border bg-card px-3.5 py-1.5 text-sm">
            <f.icon className="size-4 text-primary" />
            <span className="text-muted-foreground">{f.label}</span>
            <strong className="tabular-nums">{f.n}</strong>
          </span>
        ))}
      </div>

      {/* Server table */}
      <section className="overflow-hidden rounded-3xl border border-card-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-card-border p-4">
          <div>
            <h3 className="font-display text-lg font-black">
              All servers <span className="text-muted-foreground">({guilds.length})</span>
            </h3>
            {invError && <p className="mt-0.5 text-xs text-coral">{invError}</p>}
            {!invError && Object.keys(invites).length > 0 && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {Object.values(invites).filter((i) => i.url).length} of {Object.keys(invites).length} servers have an existing invite
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name or ID"
                aria-label="Search servers"
                className="w-56 rounded-xl border border-card-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/60"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              aria-label="Sort servers"
              className="rounded-xl border border-card-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
            >
              <option value="members">Most members</option>
              <option value="name">Name A–Z</option>
              <option value="age">Oldest first</option>
            </select>
          </div>
        </div>

        <div className="max-h-[32rem] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-card-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2 font-semibold">Server</th>
                <th className="px-4 py-2 text-right font-semibold">Members</th>
                <th className="px-4 py-2 text-right font-semibold">Online</th>
                <th className="px-4 py-2 text-right font-semibold">Invite</th>
                <th className="px-4 py-2 text-right font-semibold">Created</th>
              </tr>
            </thead>
            <tbody>
              {guilds.map((g) => (
                <tr key={g.id} className="border-b border-card-border/50 last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      {g.iconUrl ? (
                        <Image src={g.iconUrl} alt="" width={28} height={28} className="size-7 shrink-0 rounded-full" unoptimized />
                      ) : (
                        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-[0.6rem] font-bold text-muted-foreground">
                          {g.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate font-medium">{g.name}</span>
                          {g.isVerified && <BadgeCheck className="size-3.5 shrink-0 text-primary" aria-label="Verified" />}
                          {g.hasAdmin && (
                            <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase text-primary">
                              admin
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[0.65rem] text-muted-foreground">{g.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">{nf.format(g.memberCount)}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums text-muted-foreground">
                    {nf.format(g.onlineCount)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <InviteCell invite={invites[g.id]} />
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                    {new Date(g.createdAt).toLocaleDateString()}
                    <div className="text-[0.65rem]">{nf.format(g.ageDays)}d ago</div>
                  </td>
                </tr>
              ))}
              {guilds.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    No servers match “{q}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-center text-xs text-muted-foreground">
        Live from Discord&apos;s API · counts are Discord&apos;s approximations
        <a
          href={`https://discord.com/developers/applications/${data.bot.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 inline-flex items-center gap-1 text-primary hover:underline"
        >
          Developer portal <ExternalLink className="size-3" />
        </a>
      </p>
    </div>
  );
}
