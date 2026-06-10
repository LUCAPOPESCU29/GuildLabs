"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Rocket,
  Loader2,
  Check,
  AlertCircle,
  ExternalLink,
  Plus,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DiscordLoginButton } from "@/components/discord-login-button";
import { Skeleton } from "@/components/ui/skeleton";

type AuthState = "loading" | "anonymous" | "authed";
type Stage = "picker" | "deploying" | "success" | "error";

type Guild = { id: string; name: string; icon: string | null; memberCount: number };
type User = { id: string; username: string; avatar: string | null };

type DeployResult = {
  ok?: boolean;
  guild?: { id: string; name: string };
  summary?: { roles: number; categories: number; channels: number; created: number; skipped: number };
  log?: string[];
  error?: string;
};

async function fetchMe(): Promise<User | null> {
  const r = await fetch("/api/auth/me");
  if (!r.ok) return null;
  return r.json();
}

type GuildsResult =
  | { ok: true; guilds: Guild[] }
  | { ok: false; code: "reauth" | "bot_offline" | "discord_down" | "unknown"; error: string };

async function fetchGuilds(): Promise<GuildsResult> {
  const r = await fetch("/api/me/guilds", { cache: "no-store" });
  const d = await r.json().catch(() => null);
  if (r.ok && Array.isArray(d)) return { ok: true, guilds: d };
  const code = (d && typeof d === "object" && d.code) || "unknown";
  const error = (d && typeof d === "object" && d.error) || "Couldn't load your servers.";
  return { ok: false, code, error };
}

async function deployBlueprint(guild: Guild, blueprint: unknown): Promise<DeployResult> {
  const res = await fetch(`/api/bot/deploy/${guild.id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blueprint }),
  });
  const data = (await res.json().catch(() => ({}))) as DeployResult;
  if (!res.ok) throw new Error(data.error || "Bot is offline or returned an error.");
  return data;
}

const INVITE_URL = (clientId: string) =>
  `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot+applications.commands`;

export function DeployDialog({
  open,
  onClose,
  blueprint,
  onDeployed,
}: {
  open: boolean;
  onClose: () => void;
  blueprint: unknown;
  /** Fired once when a deploy succeeds (e.g. to celebrate with confetti). */
  onDeployed?: () => void;
}) {
  // Auth + guilds load only while the dialog is open; cached + deduped.
  const meQuery = useQuery({ queryKey: ["auth", "me"], queryFn: fetchMe, enabled: open });
  const guildsQuery = useQuery({
    queryKey: ["bot", "guilds"],
    queryFn: fetchGuilds,
    enabled: open && !!meQuery.data,
  });

  const deployMutation = useMutation({
    mutationFn: (guild: Guild) => deployBlueprint(guild, blueprint),
    onSuccess: (data, guild) => {
      onDeployed?.();
      const s = data.summary;
      toast.success(`Deployed to ${guild.name}`, {
        description: s
          ? `${s.created} created · ${s.roles} roles · ${s.channels} channels`
          : undefined,
      });
    },
    onError: (err) => {
      toast.error("Deployment failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    },
  });

  // ── Lock background scroll while open ────────────────────────────────────
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ── Derived view state ───────────────────────────────────────────────────
  const auth: AuthState = meQuery.isLoading ? "loading" : meQuery.data ? "authed" : "anonymous";
  const user = meQuery.data ?? null;
  const guildsResult = guildsQuery.data ?? null;
  const guildsLoading = guildsQuery.isLoading && !!meQuery.data;
  const chosen = deployMutation.variables ?? null;
  const result = deployMutation.data ?? null;
  const stage: Stage = deployMutation.isPending
    ? "deploying"
    : deployMutation.isSuccess
      ? "success"
      : deployMutation.isError
        ? "error"
        : "picker";

  function handleClose() {
    deployMutation.reset();
    onClose();
  }

  function loginAndReturn() {
    const here = window.location.pathname + window.location.search + window.location.hash;
    sessionStorage.setItem("guildlabs:return", here);
    window.location.href = "/api/auth/login";
  }

  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID ?? "";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Card */}
          <motion.div
            className="glass-strong relative w-full max-w-lg rounded-3xl p-6 shadow-2xl"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          >
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 grid size-8 place-items-center rounded-full bg-muted/60 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>

            {/* ── Stage: picker (or auth) ──────────────────────────────── */}
            {stage === "picker" && (
              <PickerStage
                auth={auth}
                user={user}
                guildsResult={guildsResult}
                guildsLoading={guildsLoading}
                onPick={(g) => deployMutation.mutate(g)}
                onLogin={loginAndReturn}
                onRefetch={() => guildsQuery.refetch()}
                inviteUrl={INVITE_URL(clientId)}
              />
            )}

            {/* ── Stage: deploying ─────────────────────────────────────── */}
            {stage === "deploying" && chosen && <DeployingStage guild={chosen} />}

            {/* ── Stage: success ───────────────────────────────────────── */}
            {stage === "success" && result?.summary && chosen && (
              <SuccessStage result={result} guild={chosen} onClose={handleClose} />
            )}

            {/* ── Stage: error ─────────────────────────────────────────── */}
            {stage === "error" && (
              <ErrorStage
                error={deployMutation.error instanceof Error ? deployMutation.error.message : "Something went wrong."}
                onRetry={() => deployMutation.reset()}
                onClose={handleClose}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Sub-stages ──────────────────────────────────────────────────────────────

function PickerStage({
  auth,
  user,
  guildsResult,
  guildsLoading,
  onPick,
  onLogin,
  onRefetch,
  inviteUrl,
}: {
  auth: AuthState;
  user: User | null;
  guildsResult: GuildsResult | null;
  guildsLoading: boolean;
  onPick: (g: Guild) => void;
  onLogin: () => void;
  onRefetch: () => void;
  inviteUrl: string;
}) {
  if (auth === "loading" || (auth === "authed" && (guildsLoading || !guildsResult))) {
    return (
      <div className="py-2" aria-busy="true" aria-label="Loading your servers">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-2 h-4 w-32" />
        <div className="mt-5 space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[4.25rem] w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (auth === "anonymous") {
    return (
      <div className="py-4">
        <h2 className="font-display text-2xl font-black">Sign in to deploy</h2>
        <p className="mt-2 text-muted-foreground">
          We need to know which of your servers to install this blueprint into.
        </p>
        <DiscordLoginButton onClick={onLogin} className="mt-6" />
        <p className="mt-3 text-center text-xs text-muted-foreground">
          We only read your username, avatar, and servers you can manage.
        </p>
      </div>
    );
  }

  if (!guildsResult) return null; // covered by the loading guard above

  // Session needs refreshing — token expired or predates the `guilds` scope.
  if (!guildsResult.ok && guildsResult.code === "reauth") {
    return (
      <div className="py-4">
        <h2 className="font-display text-2xl font-black">Reconnect your Discord</h2>
        <p className="mt-2 text-muted-foreground">
          Your sign-in needs refreshing so we can see which servers you manage. This takes a second.
        </p>
        <DiscordLoginButton onClick={onLogin} className="mt-6" />
      </div>
    );
  }

  // Bot or Discord temporarily unreachable — NOT a "please invite the bot" case.
  if (!guildsResult.ok) {
    return (
      <div className="py-4">
        <h2 className="font-display text-2xl font-black">Couldn&apos;t load your servers</h2>
        <p className="mt-2 text-muted-foreground">{guildsResult.error}</p>
        <Button size="lg" onClick={onRefetch} className="mt-6 w-full">
          Try again
        </Button>
      </div>
    );
  }

  const guilds = guildsResult.guilds;

  if (guilds.length === 0) {
    return (
      <div className="py-4">
        <h2 className="font-display text-2xl font-black">Add GuildLabs first</h2>
        <p className="mt-2 text-muted-foreground">
          The bot isn&apos;t in any server you manage yet. Invite it (Administrator permission) and come back.
        </p>
        <a
          href={inviteUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-6 block"
        >
          <Button size="lg" className="w-full">
            <Plus className="size-5" /> Invite GuildLabs <ExternalLink className="size-4 opacity-70" />
          </Button>
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        {user?.avatar && <img src={user.avatar} alt="" className="size-10 rounded-full" />}
        <div>
          <h2 className="font-display text-2xl font-black leading-tight">Deploy to which server?</h2>
          <p className="text-sm text-muted-foreground">Signed in as {user?.username}</p>
        </div>
      </div>

      <p className="mt-4 rounded-2xl bg-muted/50 p-3 text-sm text-muted-foreground">
        GuildLabs will create new categories, channels, and roles. Existing items with the same name are skipped — nothing is deleted.
      </p>

      <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
        {guilds.map((g) => (
          <li key={g.id}>
            <button
              onClick={() => onPick(g)}
              className="glass flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all hover:-translate-y-0.5 hover:bg-primary/5 cursor-pointer"
            >
              {g.icon ? (
                <img src={g.icon} alt="" className="size-11 rounded-xl" />
              ) : (
                <div className="grid size-11 place-items-center rounded-xl bg-primary/15 font-display text-lg font-bold text-primary">
                  {g.name[0]}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate font-display font-bold">{g.name}</div>
                <div className="text-xs text-muted-foreground">
                  {g.memberCount.toLocaleString()} members
                </div>
              </div>
              <Rocket className="size-4 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-4 text-center">
        <a
          href={inviteUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-muted-foreground hover:text-primary"
        >
          Don&apos;t see your server? Invite GuildLabs to it →
        </a>
      </div>
    </div>
  );
}

function DeployingStage({ guild }: { guild: Guild }) {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <Loader2 className="size-10 animate-spin text-primary" />
      <div>
        <h2 className="font-display text-2xl font-black">Building your server…</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Creating roles, categories, and channels in <strong>{guild.name}</strong>. This usually takes 10–30 seconds.
        </p>
      </div>
    </div>
  );
}

function SuccessStage({
  result,
  guild,
  onClose,
}: {
  result: DeployResult;
  guild: Guild;
  onClose: () => void;
}) {
  const s = result.summary!;
  return (
    <div className="text-center">
      <motion.div
        className="mx-auto grid size-16 place-items-center rounded-full bg-success/15 text-success"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
      >
        <Check className="size-8" strokeWidth={2.5} />
      </motion.div>
      <h2 className="mt-4 font-display text-2xl font-black">Deployed!</h2>
      <p className="mt-1 text-muted-foreground">
        <strong>{guild.name}</strong> is ready.
      </p>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <Stat value={s.roles} label="Roles" />
        <Stat value={s.categories} label="Categories" />
        <Stat value={s.channels} label="Channels" />
      </div>

      {s.skipped > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          {s.skipped} item{s.skipped === 1 ? "" : "s"} already existed and {s.skipped === 1 ? "was" : "were"} skipped.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <a href={`/dashboard/${guild.id}`} className="flex-1">
          <Button variant="primary" size="lg" className="w-full">
            Configure features →
          </Button>
        </a>
        <Button variant="outline" size="lg" onClick={onClose} className="flex-1">
          Done
        </Button>
      </div>
    </div>
  );
}

function ErrorStage({
  error,
  onRetry,
  onClose,
}: {
  error: string;
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto grid size-16 place-items-center rounded-full bg-destructive/15 text-destructive">
        <AlertCircle className="size-8" />
      </div>
      <h2 className="mt-4 font-display text-2xl font-black">Deployment failed</h2>
      <p className="mt-2 rounded-2xl bg-destructive/10 p-3 text-left font-mono text-xs text-destructive">
        {error}
      </p>
      <div className="mt-6 flex gap-2">
        <Button variant="outline" size="lg" onClick={onClose} className="flex-1">
          Close
        </Button>
        <Button size="lg" onClick={onRetry} className="flex-1">
          Try again
        </Button>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="glass rounded-2xl py-3">
      <div className="font-display text-2xl font-black text-foreground">{value}</div>
      <div className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}
