"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { LogOut, Plus, X, Settings, ArrowRight } from "lucide-react";
import { DiscordIcon } from "@/components/icons/discord";

type User = { id: string; username: string; avatar: string | null };
type Guild = { id: string; name: string; icon: string | null; memberCount: number };

// Tuned to feel like iOS — a touch bouncy without overshoot
const SOFT = { type: "spring" as const, stiffness: 360, damping: 28, mass: 0.8 };

export function DynamicIsland() {
  const pathname = usePathname();
  const [user, setUser] = React.useState<User | null | undefined>(undefined);
  const [guilds, setGuilds] = React.useState<Guild[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loadingGuilds, setLoadingGuilds] = React.useState(false);
  const [botStatus, setBotStatus] = React.useState<"checking" | "online" | "offline">("checking");
  const [botLatency, setBotLatency] = React.useState<number | null>(null);
  const reduce = useReducedMotion();
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  // ── Auth + real bot reachability ───────────────────────────────────────────
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      let u: User | null = null;
      try {
        u = await fetch("/api/auth/me", { cache: "no-store" }).then((r) => r.json());
      } catch {
        u = null;
      }
      if (cancelled) return;
      setUser(u);
      if (!u) return;

      setLoadingGuilds(true);
      const t0 = performance.now();
      try {
        const res = await fetch("/api/me/guilds", { cache: "no-store" });
        const ms = Math.round(performance.now() - t0);
        if (cancelled) return;
        if (res.ok) {
          const gs = await res.json();
          setGuilds(Array.isArray(gs) ? gs : []);
          setBotStatus("online");
          setBotLatency(ms);
        } else {
          setGuilds([]);
          setBotStatus("offline");
        }
      } catch {
        if (!cancelled) {
          setGuilds([]);
          setBotStatus("offline");
        }
      } finally {
        if (!cancelled) setLoadingGuilds(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Close on outside click + escape ───────────────────────────────────────
  React.useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function goLogin() {
    try {
      sessionStorage.setItem("guildlabs:return", window.location.pathname + window.location.search);
    } catch {}
    window.location.href = "/api/auth/login";
  }

  if (user === undefined) return null;

  return (
    // Anchored, in-flow trigger — lives INSIDE the navbar (no longer a
    // fixed, center-screen element), so it can never overlap nav content.
    <div ref={wrapperRef} className="relative z-[60]">
      <div className="overflow-hidden rounded-full bg-black text-white shadow-[0_12px_30px_-12px_rgba(0,0,0,0.6)] ring-1 ring-white/10">
        <CompactPill
          user={user}
          guildsCount={guilds.length}
          onPrimary={() => (user ? setOpen((o) => !o) : goLogin())}
        />
      </div>

      {/* Expanded card opens DOWNWARD as a right-aligned dropdown panel —
          never covering the bar, and clamped to the viewport on mobile. */}
      <AnimatePresence>
        {open && user && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            transition={reduce ? { duration: 0 } : { duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: "top right" }}
            className="absolute right-0 top-full z-[70] mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[28px] bg-black text-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)] ring-1 ring-white/10"
          >
            <ExpandedCard
              user={user!}
              guilds={guilds}
              loading={loadingGuilds}
              pathname={pathname}
              botStatus={botStatus}
              botLatency={botLatency}
              onClose={() => setOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// COMPACT PILL — split layout: [left chip] · [right info]
// ────────────────────────────────────────────────────────────────────────────
function CompactPill({
  user,
  guildsCount,
  onPrimary,
}: {
  user: User | null;
  guildsCount: number;
  onPrimary: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
      onClick={onPrimary}
      type="button"
      className="group flex items-center gap-2 px-2.5 py-2 text-[13px] font-medium cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:gap-3 sm:px-3"
      aria-label={user ? "Open server switcher" : "Sign in with Discord"}
    >
      {user ? (
        <>
          {/* LEFT CHIP — like the green plane on the iOS flight pill */}
          <div className="flex items-center gap-1.5 rounded-full bg-[#1cd47d]/15 px-2 py-1 text-[#1cd47d]">
            <PulseDot color="#1cd47d" />
            <span className="font-bold tabular-nums">Online</span>
          </div>

          {/* MIDDLE DOT + server count — hidden on phones so the navbar can't
              overflow; the count is in the expanded card a tap away. */}
          <span className="hidden size-1 shrink-0 rounded-full bg-white/30 sm:block" />
          <span className="hidden text-white/90 sm:inline">
            {guildsCount} {guildsCount === 1 ? "server" : "servers"}
          </span>
        </>
      ) : (
        <>
          {/* LEFT CHIP — Discord glyph in blurple bubble */}
          <span className="grid size-5 place-items-center rounded-full bg-[#5865F2]">
            <DiscordIcon className="size-3" color="white" />
          </span>

          {/* MIDDLE DOT separator */}
          <span className="size-1 shrink-0 rounded-full bg-white/30" />

          {/* RIGHT INFO */}
          <span className="flex items-center gap-1 text-white/90">
            Sign in
            <ArrowRight className="size-3 text-white/50 transition-transform group-hover:translate-x-0.5" />
          </span>
        </>
      )}
    </motion.button>
  );
}

// Reusable: pulsing dot, like the green plane "alive" feel
function PulseDot({ color }: { color: string }) {
  return (
    <span className="relative grid size-2 place-items-center">
      <motion.span
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: color, opacity: 0.6 }}
        animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
      />
      <span className="absolute inset-0 rounded-full" style={{ backgroundColor: color }} />
    </span>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// EXPANDED CARD — iOS-style rich content
// ────────────────────────────────────────────────────────────────────────────
function ExpandedCard({
  user,
  guilds,
  loading,
  pathname,
  botStatus,
  botLatency,
  onClose,
}: {
  user: User;
  guilds: Guild[];
  loading: boolean;
  pathname: string;
  botStatus: "checking" | "online" | "offline";
  botLatency: number | null;
  onClose: () => void;
}) {
  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID ?? "";
  const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot+applications.commands`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, delay: 0.05 }}
      className="w-[22rem] p-4"
    >
      {/* ── Header row ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {user.avatar ? (
          <img src={user.avatar} alt="" className="size-10 rounded-full ring-1 ring-white/15" />
        ) : (
          <div className="grid size-10 place-items-center rounded-full bg-white/10 font-bold">
            {user.username[0]?.toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold">{user.username}</div>
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-[#1cd47d]">
            <PulseDot color="#1cd47d" /> Signed in
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white cursor-pointer"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* ── Connection strip — real bot reachability ─────────────────────── */}
      <ConnectionStrip status={botStatus} latency={botLatency} />

      {/* ── Servers ──────────────────────────────────────────────────────── */}
      <div className="mt-3">
        <div className="px-1 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/40">
          Manage servers
        </div>

        {loading ? (
          <div className="space-y-1.5">
            {[0, 1].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : guilds.length === 0 ? (
          <EmptyServers inviteUrl={inviteUrl} />
        ) : (
          <ul className="max-h-56 space-y-0.5 overflow-y-auto pr-1">
            {guilds.map((g, i) => {
              const active = pathname === `/dashboard/${g.id}`;
              return (
                <motion.li
                  key={g.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...SOFT, delay: 0.05 + i * 0.04 }}
                >
                  <a
                    href={`/dashboard/${g.id}`}
                    onClick={onClose}
                    className={
                      "flex items-center gap-3 rounded-xl px-2 py-2 transition-colors cursor-pointer " +
                      (active ? "bg-white/12" : "hover:bg-white/8")
                    }
                  >
                    {g.icon ? (
                      <img src={g.icon} alt="" className="size-9 rounded-lg" />
                    ) : (
                      <div className="grid size-9 place-items-center rounded-lg bg-[#5865F2]/20 font-display text-sm font-bold text-[#a8b1ff]">
                        {g.name[0]}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{g.name}</div>
                      <div className="text-[11px] text-white/40">
                        {g.memberCount.toLocaleString()} members
                      </div>
                    </div>
                    <Settings className="size-3.5 text-white/30" />
                  </a>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-2 px-1">
        <a
          href={inviteUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs text-white/60 hover:bg-white/10 hover:text-white cursor-pointer"
        >
          <Plus className="size-3.5" /> Add to server
        </a>
        <a
          href="/api/auth/logout"
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs text-white/60 hover:bg-white/10 hover:text-white cursor-pointer"
        >
          <LogOut className="size-3.5" /> Sign out
        </a>
      </div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// CONNECTION STRIP — bot ↔ Discord with a dot traveling like the iOS plane
// ────────────────────────────────────────────────────────────────────────────
function ConnectionStrip({
  status,
  latency,
}: {
  status: "checking" | "online" | "offline";
  latency: number | null;
}) {
  const online = status === "online";
  const checking = status === "checking";
  const accent = online ? "#1cd47d" : checking ? "#9aa0a6" : "#f0a35e";
  const stateLabel = online ? "Live" : checking ? "Checking…" : "Offline";
  const left = online ? "connected" : checking ? "checking…" : "bot unreachable";
  const right = online ? "↑ stable" : checking ? "…" : "✕ offline";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ...SOFT, delay: 0.08 }}
      className="mt-4 rounded-2xl bg-white/5 p-3.5"
    >
      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-white/40">
        <span>GuildLabs Bot</span>
        <span style={{ color: accent }}>{stateLabel}</span>
        <span>Discord Gateway</span>
      </div>

      {/* Route */}
      <div className="relative mt-2.5 flex items-center gap-2">
        {/* Left endpoint */}
        <div
          className="grid size-7 shrink-0 place-items-center rounded-full"
          style={{ backgroundColor: `${accent}26`, boxShadow: `inset 0 0 0 1px ${accent}4d` }}
        >
          <BotMark color={accent} />
        </div>

        {/* Line (+ traveling dot only when truly online) */}
        <div className="relative h-px flex-1 bg-white/15">
          <span
            aria-hidden
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px"
            style={{
              backgroundImage: `repeating-linear-gradient(to right, ${accent}80 0 6px, transparent 6px 12px)`,
            }}
          />
          {online && (
            <motion.span
              className="absolute top-1/2 size-2 -translate-y-1/2 rounded-full"
              style={{ backgroundColor: accent, boxShadow: `0 0 12px ${accent}`, marginLeft: -4 }}
              initial={{ left: "0%" }}
              animate={{ left: ["0%", "100%"] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </div>

        {/* Right endpoint */}
        <div className="grid size-7 shrink-0 place-items-center rounded-full bg-[#5865F2]/20 ring-1 ring-[#5865F2]/40">
          <DiscordIcon className="size-3.5" color="#a8b1ff" />
        </div>
      </div>

      {/* Tiny status row — real values */}
      <div className="mt-2.5 flex items-center justify-between text-[11px]">
        <span className="font-mono text-white/50">
          {online && latency != null ? `${left} · ${latency}ms` : left}
        </span>
        <span className="font-mono" style={{ color: accent }}>
          {right}
        </span>
      </div>
    </motion.div>
  );
}

// Minimalist robot/bot glyph for the left endpoint
function BotMark({ color = "#1cd47d" }: { color?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-3.5" style={{ color }} aria-hidden="true">
      <path
        d="M9 12a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2z"
        fill="currentColor"
      />
      <path
        d="M12 3v2m-7 4h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2zm3 11h6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Empty state ───────────────────────────────────────────────────────────────
function EmptyServers({ inviteUrl }: { inviteUrl: string }) {
  return (
    <div className="rounded-xl bg-white/5 px-3 py-4 text-center">
      <p className="text-sm text-white/70">GuildLabs isn&apos;t in any of your servers yet.</p>
      <a
        href={inviteUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#5865F2] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#4752C4] cursor-pointer"
      >
        <DiscordIcon className="size-3.5" color="white" /> Invite the bot
      </a>
    </div>
  );
}
