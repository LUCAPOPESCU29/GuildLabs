"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Couldn't sign in.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't sign in.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-5 rounded-3xl border border-card-border bg-card p-10 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Lock className="size-6" />
      </span>
      <div>
        <h2 className="font-display text-xl font-black">Admin access</h2>
        <p className="mt-1 text-sm text-muted-foreground">Enter the password to view server analytics.</p>
      </div>

      <form onSubmit={submit} className="w-full space-y-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          autoComplete="current-password"
          aria-label="Admin password"
          className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-center font-mono text-sm outline-none transition-colors focus:border-primary/60"
        />
        {error && (
          <p className="flex items-center justify-center gap-1.5 text-sm text-coral" role="alert">
            <ShieldAlert className="size-4" /> {error}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={busy || !password}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null} Unlock
        </Button>
      </form>
    </div>
  );
}
