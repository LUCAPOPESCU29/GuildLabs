import type { Metadata } from "next";
import Link from "next/link";
import { Home, ShieldCheck, Lock } from "lucide-react";
import { getSession } from "@/lib/session";
import { GuildLabsLogo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { AdminGuilds } from "./_admin-guilds";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const session = await getSession();
  const owner = process.env.OWNER_DISCORD_ID;
  const authorized = !!session && !!owner && session.id === owner;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-card-border px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
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
          {session && <span className="text-sm text-muted-foreground">{session.username}</span>}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="size-6" />
          </span>
          <div>
            <h1 className="font-display text-3xl font-black">Admin · all servers</h1>
            <p className="mt-0.5 text-muted-foreground">Every server the bot was added to. Owner only.</p>
          </div>
        </div>

        {!session ? (
          <div className="mx-auto flex max-w-md flex-col items-center gap-5 rounded-3xl border border-card-border bg-card p-10 text-center">
            <Lock className="size-8 text-muted-foreground" />
            <h2 className="font-display text-xl font-black">Sign in required</h2>
            <p className="text-sm text-muted-foreground">This page is restricted to the GuildLabs owner.</p>
            <Link href="/api/auth/login">
              <Button size="lg">Sign in with Discord</Button>
            </Link>
          </div>
        ) : !authorized ? (
          <div className="rounded-3xl border border-coral/30 bg-coral/10 p-8">
            <div className="flex items-start gap-3">
              <Lock className="mt-0.5 size-6 shrink-0 text-coral" />
              <div>
                <h2 className="font-display text-xl font-black">Owner only</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  You&apos;re signed in as <strong className="text-foreground">{session.username}</strong>, but this page
                  is locked to the GuildLabs owner.
                </p>
                {!owner && (
                  <div className="mt-4 rounded-2xl border border-card-border bg-card p-4 text-sm">
                    <p className="text-muted-foreground">
                      To claim ownership, set the <code className="font-mono text-foreground">OWNER_DISCORD_ID</code>{" "}
                      environment variable to your Discord ID:
                    </p>
                    <code className="mt-2 block rounded-lg bg-background-deep/60 px-3 py-2 font-mono text-foreground">
                      {session.id}
                    </code>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <AdminGuilds />
        )}
      </main>
    </div>
  );
}
