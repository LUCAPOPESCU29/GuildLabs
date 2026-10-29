import type { Metadata } from "next";
import Link from "next/link";
import { Home, ShieldCheck } from "lucide-react";
import { isAdmin } from "@/lib/admin-auth";
import { GuildLabsLogo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { AdminLogin } from "./_admin-login";
import { AdminDashboard } from "./_admin-dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const unlocked = await isAdmin();

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
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="size-6" />
          </span>
          <div>
            <h1 className="font-display text-3xl font-black">Admin · server analytics</h1>
            <p className="mt-0.5 text-muted-foreground">
              Every server the bot was added to, and how it&apos;s doing.
            </p>
          </div>
        </div>

        {unlocked ? <AdminDashboard /> : <AdminLogin />}
      </main>
    </div>
  );
}
