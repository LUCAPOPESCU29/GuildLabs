"use client";

/**
 * Self-host page: download the bot bundle and run it locally, entirely from the
 * site — no GitHub account, no cloud. A guided, copy-paste flow.
 */

import * as React from "react";
import Link from "next/link";
import { Download, Check, Copy, ExternalLink, Terminal, Bot, Rocket, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const INVITE_HINT = "https://discord.com/oauth2/authorize?client_id=CLIENT_ID&permissions=8&scope=bot+applications.commands";

function Cmd({ children }: { children: string }) {
  const [copied, setCopied] = React.useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      toast.success("Copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy — select it manually.");
    }
  }
  return (
    <div className="group relative mt-3 overflow-hidden rounded-xl bg-[#0b0c10] ring-1 ring-white/10">
      <pre className="overflow-x-auto p-3.5 pr-12 font-mono text-[0.8rem] leading-relaxed text-emerald-200/90">{children}</pre>
      <button
        onClick={copy}
        className="absolute right-2 top-2 grid size-8 place-items-center rounded-lg bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
        aria-label="Copy command"
      >
        {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
      </button>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="relative pl-12">
      <span className="absolute left-0 top-0 grid size-9 place-items-center rounded-full bg-primary/15 font-display text-base font-black text-primary ring-1 ring-primary/25">
        {n}
      </span>
      <h3 className="font-display text-xl font-black">{title}</h3>
      <div className="mt-2 text-muted-foreground">{children}</div>
    </div>
  );
}

export function SelfHost() {
  return (
    <main className="relative min-h-screen px-5 py-16">
      <div className="mx-auto max-w-3xl">
        {/* Hero */}
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-accent-foreground">
            <ShieldCheck className="size-3.5" /> Free · open-source · yours
          </span>
          <h1 className="mt-4 font-display text-4xl font-black tracking-tight sm:text-5xl">
            Run your own GuildLabs bot
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-lg text-muted-foreground">
            GuildLabs bots run on your machine, not ours — so there are no bills and your
            community&apos;s data never leaves your computer. Download it and you&apos;re going in
            about ten minutes.
          </p>
          <a href="/guildlabs-bot.zip" download className="mt-7 inline-block">
            <Button size="lg" variant="primary" magnetic>
              <Download className="size-5" /> Download the bot (.zip)
            </Button>
          </a>
          <p className="mt-2 text-xs text-muted-foreground">~50&nbsp;KB · needs Node.js 20+ · macOS, Windows, or Linux</p>
        </div>

        {/* Steps */}
        <div className="mt-14 space-y-10">
          <Step n={1} title="Download & unzip">
            <p>Grab the bundle above, then open a terminal in the folder you unzipped it to.</p>
            <Cmd>{`cd guildlabs-bot\nnpm install`}</Cmd>
          </Step>

          <Step n={2} title="Create your Discord bot">
            <p>
              Every bot needs its own Discord identity. In the{" "}
              <a href="https://discord.com/developers/applications" target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">
                Discord Developer Portal <ExternalLink className="inline size-3" />
              </a>
              :
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              <li><strong>New Application</strong> → name it.</li>
              <li><strong>Bot</strong> → enable <em>Server Members</em> and <em>Message Content</em> intents.</li>
              <li>Copy the <strong>Bot Token</strong> (keep it secret) and, under <strong>OAuth2 → General</strong>, the <strong>Client ID</strong>.</li>
            </ul>
          </Step>

          <Step n={3} title="Add your token">
            <p>Copy the example config, then paste your token and client ID into the new <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">.env</code> file.</p>
            <Cmd>{`cp .env.example .env`}</Cmd>
            <Cmd>{`DISCORD_TOKEN=your_bot_token\nCLIENT_ID=your_client_id`}</Cmd>
          </Step>

          <Step n={4} title="Start it">
            <p>Register the slash commands once, then run the bot. When you see <span className="font-mono text-sm">online as …</span>, it&apos;s live in Discord — for as long as this terminal stays open.</p>
            <Cmd>{`npm run deploy\nnpm start`}</Cmd>
          </Step>

          <Step n={5} title="Invite it & build a server">
            <p>Invite your bot with Administrator permission (it needs that to create roles and channels) — swap in your Client ID:</p>
            <Cmd>{INVITE_HINT}</Cmd>
            <p className="mt-3">
              Then design a server in the{" "}
              <Link href="/#builder" className="font-semibold text-primary hover:underline">builder</Link>, click{" "}
              <strong>Deploy to Discord</strong>, and run <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">/deploy</code> with the code in your
              server — your bot builds everything in one pass.
            </p>
          </Step>
        </div>

        {/* Footer cards */}
        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          <InfoCard icon={Terminal} title="Full written guide" href="/guides/how-to-self-host-guildlabs-bots" body="Every step in detail, including connecting it to the builder." />
          <InfoCard icon={Bot} title="What each command does" href="/docs" body="The command reference for /setup, /config, /deploy and more." />
          <InfoCard icon={Rocket} title="Try before you host" href="/playground" body="Play with the bots in the browser — no install needed." />
        </div>

        <p className="mt-10 rounded-2xl bg-muted/50 p-4 text-center text-sm text-muted-foreground">
          Want always-on hosting (so it runs when your computer&apos;s off)? The bundle includes
          Docker, Fly, and Railway config — drop it on any host that runs Node. It&apos;s your bot,
          run it wherever you like.
        </p>
      </div>
    </main>
  );
}

function InfoCard({ icon: Icon, title, body, href }: { icon: React.ComponentType<{ className?: string }>; title: string; body: string; href: string }) {
  return (
    <Link href={href} className="glass group flex flex-col rounded-2xl p-5 transition-all hover:-translate-y-1 hover:bg-primary/5">
      <Icon className="size-5 text-primary" />
      <h3 className="mt-3 font-display font-bold">{title}</h3>
      <p className="mt-1 flex-1 text-sm text-muted-foreground">{body}</p>
    </Link>
  );
}
