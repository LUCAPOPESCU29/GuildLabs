"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Rocket, Loader2, AlertCircle, ExternalLink, Copy, Check } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Stage = "intro" | "creating" | "code" | "error";

type ClaimResult = {
  ok?: boolean;
  code?: string;
  codeDisplay?: string;
  expiresInSec?: number;
  error?: string;
};

async function createClaim(blueprint: unknown): Promise<ClaimResult> {
  const res = await fetch("/api/construct/claim", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blueprint }),
  });
  const data = (await res.json().catch(() => ({}))) as ClaimResult;
  if (!res.ok || !data.ok || !data.codeDisplay) {
    throw new Error(data.error || "Couldn't generate a deploy code. Try again.");
  }
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
  /** Fired once when a deploy code is successfully generated. */
  onDeployed?: () => void;
}) {
  const claim = useMutation({
    mutationFn: () => createClaim(blueprint),
    onSuccess: () => onDeployed?.(),
  });

  // Lock background scroll while open.
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Reset to the intro stage each time the dialog opens.
  React.useEffect(() => {
    if (open) claim.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const stage: Stage = claim.isPending
    ? "creating"
    : claim.isSuccess
      ? "code"
      : claim.isError
        ? "error"
        : "intro";

  function handleClose() {
    claim.reset();
    onClose();
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
          <motion.div
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

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

            {stage === "intro" && (
              <IntroStage onGenerate={() => claim.mutate()} inviteUrl={INVITE_URL(clientId)} />
            )}
            {stage === "creating" && <CreatingStage />}
            {stage === "code" && claim.data?.codeDisplay && (
              <CodeStage
                code={claim.data.codeDisplay}
                expiresInSec={claim.data.expiresInSec ?? 600}
                inviteUrl={INVITE_URL(clientId)}
                onClose={handleClose}
              />
            )}
            {stage === "error" && (
              <ErrorStage
                error={claim.error instanceof Error ? claim.error.message : "Something went wrong."}
                onRetry={() => claim.mutate()}
                onClose={handleClose}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Stages ───────────────────────────────────────────────────────────────────

function IntroStage({ onGenerate, inviteUrl }: { onGenerate: () => void; inviteUrl: string }) {
  return (
    <div>
      <div className="grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary">
        <Rocket className="size-6" />
      </div>
      <h2 className="mt-4 font-display text-2xl font-black leading-tight">Deploy to Discord</h2>
      <p className="mt-2 text-muted-foreground">
        We&apos;ll give you a one-time code. Run <strong>/deploy</strong> with it in your server and
        GuildLabs builds every category, channel, and role for you.
      </p>

      <ol className="mt-5 space-y-3">
        <Step n={1}>
          <span>
            Make sure <strong>GuildLabs</strong> is in your server.{" "}
            <a href={inviteUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
              Invite it →
            </a>
          </span>
        </Step>
        <Step n={2}>Generate your deploy code below.</Step>
        <Step n={3}>
          In your server, type <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">/deploy</code> and paste the code.
        </Step>
      </ol>

      <Button size="lg" variant="primary" onClick={onGenerate} className="mt-6 w-full">
        Generate deploy code
      </Button>
    </div>
  );
}

function CreatingStage() {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <Loader2 className="size-10 animate-spin text-primary" />
      <h2 className="font-display text-2xl font-black">Preparing your blueprint…</h2>
    </div>
  );
}

function CodeStage({
  code,
  expiresInSec,
  inviteUrl,
  onClose,
}: {
  code: string;
  expiresInSec: number;
  inviteUrl: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = React.useState(false);
  const [remaining, setRemaining] = React.useState(expiresInSec);

  React.useEffect(() => {
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Code copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy — select it manually.");
    }
  }

  const mins = Math.floor(remaining / 60);
  const secs = String(remaining % 60).padStart(2, "0");
  const expired = remaining <= 0;

  return (
    <div className="text-center">
      <h2 className="font-display text-2xl font-black">Your deploy code</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Run <code className="rounded bg-muted px-1.5 py-0.5 font-mono">/deploy</code> in your server and paste this.
      </p>

      <button
        onClick={copy}
        disabled={expired}
        className="group mt-5 flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 py-5 font-mono text-3xl font-black tracking-[0.2em] text-primary transition-colors hover:bg-primary/10 disabled:opacity-50 cursor-pointer"
        aria-label="Copy deploy code"
      >
        {expired ? "EXPIRED" : code}
        {!expired &&
          (copied ? <Check className="size-6" /> : <Copy className="size-6 opacity-60 group-hover:opacity-100" />)}
      </button>

      <p className="mt-3 text-xs text-muted-foreground">
        {expired ? (
          "This code expired — close and generate a new one."
        ) : (
          <>
            Single use · expires in{" "}
            <span className="font-mono font-semibold text-foreground">
              {mins}:{secs}
            </span>
          </>
        )}
      </p>

      <div className="mt-5 rounded-2xl bg-muted/50 p-3 text-left text-sm text-muted-foreground">
        Bot not in your server yet?{" "}
        <a href={inviteUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
          Invite GuildLabs <ExternalLink className="inline size-3" />
        </a>
        , then run <code className="rounded bg-background px-1 py-0.5 font-mono">/deploy</code>.
      </div>

      <Button variant="outline" size="lg" onClick={onClose} className="mt-5 w-full">
        Done
      </Button>
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
      <h2 className="mt-4 font-display text-2xl font-black">Couldn&apos;t generate a code</h2>
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

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/15 font-display text-xs font-bold text-primary">
        {n}
      </span>
      <span className="text-sm text-muted-foreground">{children}</span>
    </li>
  );
}

// Kept exported for any callers importing the invite helper.
export { INVITE_URL };
