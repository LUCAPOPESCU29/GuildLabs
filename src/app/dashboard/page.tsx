"use client";

import * as React from "react";
import Link from "next/link";
import {
  Home,
  LogOut,
  RefreshCw,
  Search,
  ArrowRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ServerCog,
  Boxes,
} from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { GuildLabsLogo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { DiscordLoginButton } from "@/components/discord-login-button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

type User = { id: string; username: string; avatar: string | null };
type Guild = { id: string; name: string; icon: string | null; memberCount: number };

const INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID}&permissions=8&scope=bot+applications.commands`;

export default function DashboardPage() {
  const [user, setUser] = React.useState<User | null | undefined>(undefined);
  const [guilds, setGuilds] = React.useState<Guild[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchGuilds = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bot/guilds");
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Bot is offline.");
      setGuilds(Array.isArray(json) ? json : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't reach the bot.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((u: User | null) => {
        setUser(u);
        if (u) {
          try {
            const ret = sessionStorage.getItem("guildlabs:return");
            if (ret) {
              sessionStorage.removeItem("guildlabs:return");
              window.location.replace(ret);
              return;
            }
          } catch {
            /* sessionStorage unavailable */
          }
          void fetchGuilds();
        }
      })
      .catch(() => setUser(null));
  }, [fetchGuilds]);

  if (user === undefined) {
    return (
      <div className="grid min-h-screen place-items-center">
        <RefreshCw className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-card-border px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link href="/" aria-label="GuildLabs home">
              <GuildLabsLogo className="h-9 w-auto" />
            </Link>
            <Link href="/">
              <Button size="sm" variant="ghost">
                <Home className="size-4" /> Home
              </Button>
            </Link>
          </div>
          {user && (
            <div className="flex items-center gap-3">
              {user.avatar && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt="" className="size-8 rounded-full" />
              )}
              <span className="text-sm font-medium">{user.username}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => (window.location.href = "/api/auth/logout")}
              >
                <LogOut className="size-4" /> Sign out
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        {!user ? (
          <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-24 text-center">
            <GuildLabsLogo className="h-16 w-auto" />
            <h1 className="font-display text-4xl font-black">Bot Dashboard</h1>
            <p className="text-muted-foreground">
              Sign in with Discord to manage your servers — configure welcome messages,
              anti-raid, leveling, tickets, and more.
            </p>
            <DiscordLoginButton
              onClick={() => (window.location.href = "/api/auth/login")}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground">
              We only read your username, avatar, and the list of servers you can manage.
            </p>
          </div>
        ) : (
          <ServersView guilds={guilds} loading={loading} error={error} onRefresh={fetchGuilds} />
        )}
      </main>
    </div>
  );
}

// ── Servers table ─────────────────────────────────────────────────────────────
const col = createColumnHelper<Guild>();

function ServerCell({ guild }: { guild: Guild }) {
  return (
    <div className="flex items-center gap-3">
      {guild.icon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={guild.icon} alt="" className="size-10 rounded-2xl" />
      ) : (
        <div className="grid size-10 place-items-center rounded-2xl bg-primary/15 font-display text-lg font-bold text-primary">
          {guild.name[0]}
        </div>
      )}
      <Link
        href={`/dashboard/${guild.id}`}
        className="truncate font-display font-bold transition-colors hover:text-primary focus-visible:outline-none focus-visible:underline"
      >
        {guild.name}
      </Link>
    </div>
  );
}

function ServersView({
  guilds,
  loading,
  error,
  onRefresh,
}: {
  guilds: Guild[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [filter, setFilter] = React.useState("");

  const columns = React.useMemo(
    () => [
      col.accessor("name", {
        header: "Server",
        cell: (info) => <ServerCell guild={info.row.original} />,
      }),
      col.accessor("memberCount", {
        header: "Members",
        cell: (info) => (
          <span className="tabular-nums text-muted-foreground">
            {info.getValue().toLocaleString()}
          </span>
        ),
      }),
      col.display({
        id: "action",
        header: () => <span className="sr-only">Actions</span>,
        cell: (info) => (
          <Link
            href={`/dashboard/${info.row.original.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-1"
          >
            Configure <ArrowRight className="size-4" />
          </Link>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: guilds,
    columns,
    state: { sorting, globalFilter: filter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const rows = table.getRowModel().rows;

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-black">Your servers</h1>
          <p className="mt-1 text-muted-foreground">Pick a server to configure GuildLabs.</p>
        </div>
        <div className="flex items-center gap-2">
          {guilds.length > 0 && (
            <div className="glass flex items-center gap-2 rounded-full px-3 py-1.5">
              <Search className="size-4 text-muted-foreground" />
              <label htmlFor="server-search" className="sr-only">
                Search servers
              </label>
              <input
                id="server-search"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search…"
                className="w-32 bg-transparent text-sm outline-none placeholder:text-muted-foreground sm:w-40"
              />
            </div>
          )}
          <Button size="sm" variant="outline" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-coral/30 bg-coral/10 p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-coral/15 text-coral">
              <ServerCog className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-display font-bold text-foreground">Can&apos;t reach the Construct bot</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                The dashboard connects to the self-hosted, open-source Construct bot API, which
                isn&apos;t reachable right now. If you&apos;re running it yourself, start it with{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                  cd bot &amp;&amp; npm start
                </code>{" "}
                and retry.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Button size="sm" variant="outline" onClick={onRefresh}>
                  <RefreshCw className="size-4" /> Retry
                </Button>
                <a
                  href="https://github.com/LUCAPOPESCU29/GuildLabs"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  Self-hosting guide →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && guilds.length === 0 ? (
        <div className="overflow-hidden rounded-3xl border border-card-border bg-card">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 border-b border-card-border p-4 last:border-0"
            >
              <Skeleton className="size-10 rounded-2xl" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="ml-auto h-4 w-16" />
            </div>
          ))}
        </div>
      ) : guilds.length === 0 ? (
        error ? null : (
          <EmptyState
            icon={Boxes}
            title="No servers yet"
            body="The bot isn't in any servers you manage. Invite it (with Administrator) and refresh."
            action={
              <a href={INVITE_URL} target="_blank" rel="noreferrer">
                <Button>
                  <ServerCog className="size-4" /> Invite the bot
                </Button>
              </a>
            }
          />
        )
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matches"
          body="No servers match your search."
          action={
            <Button variant="outline" onClick={() => setFilter("")}>
              Clear search
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-card-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border">
                {table.getHeaderGroups()[0].headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  const canSort = header.column.getCanSort();
                  const isMembers = header.column.id === "memberCount";
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none"}
                      className={`px-5 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground ${isMembers ? "text-right" : "text-left"}`}
                    >
                      {canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className={`inline-flex items-center gap-1.5 transition-colors hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded ${isMembers ? "flex-row-reverse" : ""}`}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted === "asc" ? (
                            <ArrowUp className="size-3.5" />
                          ) : sorted === "desc" ? (
                            <ArrowDown className="size-3.5" />
                          ) : (
                            <ArrowUpDown className="size-3.5 opacity-40" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-card-border transition-colors last:border-0 hover:bg-muted/40"
                >
                  {row.getVisibleCells().map((cell) => {
                    const isMembers = cell.column.id === "memberCount";
                    const isAction = cell.column.id === "action";
                    return (
                      <td
                        key={cell.id}
                        className={`px-5 py-3 ${isMembers ? "text-right" : ""} ${isAction ? "text-right" : ""}`}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
