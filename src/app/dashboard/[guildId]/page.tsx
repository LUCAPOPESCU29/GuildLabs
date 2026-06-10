"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, Home, Save, RefreshCw, MessageCircle, ShieldCheck,
  Sword, TrendingUp, Ticket, CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ConfigCard, Toggle, SelectField, TextField, NumberField,
} from "@/components/dashboard/config-controls";
import { ChartItConfig } from "./_chartit-config";

type Channel = { id: string; name: string; type: number };
type Role = { id: string; name: string; color: string };
type GuildInfo = { id: string; name: string; icon: string | null; memberCount: number; channels: Channel[]; roles: Role[] };
type Config = Record<string, any>;

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function GuildConfigPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const [guild, setGuild] = React.useState<GuildInfo | null>(null);
  const [config, setConfig] = React.useState<Config>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const [gRes, cRes] = await Promise.all([
        fetch(`/api/bot/guilds/${guildId}`),
        fetch(`/api/bot/config/${guildId}`),
      ]);
      if (gRes.ok) setGuild(await gRes.json());
      if (cRes.ok) setConfig(await cRes.json());
      setLoading(false);
    })();
  }, [guildId]);

  function patch(key: string, value: any) {
    setConfig((c) => ({ ...c, [key]: value }));
  }

  async function save() {
    setSaving(true);
    await fetch(`/api/bot/config/${guildId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const textChannels = guild?.channels.filter((c) => c.type === 0) ?? [];
  const categories = guild?.channels.filter((c) => c.type === 4) ?? [];
  const roles = guild?.roles ?? [];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <RefreshCw className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!guild) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Server not found — is the bot running?</p>
        <Link href="/dashboard"><Button variant="outline"><ArrowLeft className="size-4" /> Back</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-card-border px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Home">
              <Button size="sm" variant="ghost">
                <Home className="size-4" /> Home
              </Button>
            </Link>
            <span aria-hidden className="h-5 w-px bg-foreground/15" />
            <Link
              href="/dashboard"
              aria-label="Back to all servers"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-5" />
            </Link>
            {guild.icon && <img src={guild.icon} alt="" className="size-9 rounded-xl" />}
            <div>
              <div className="font-display font-bold">{guild.name}</div>
              <div className="text-xs text-muted-foreground">{guild.memberCount.toLocaleString()} members</div>
            </div>
          </div>
          <Button onClick={save} disabled={saving}>
            {saving ? <RefreshCw className="size-4 animate-spin" /> : saved ? <CheckCircle className="size-4" /> : <Save className="size-4" />}
            {saving ? "Saving…" : saved ? "Saved!" : "Save changes"}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-6 py-10">
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07 } } }} className="space-y-6">

          {/* Welcome */}
          <ConfigCard icon={MessageCircle} title="Welcome Messages" color="primary" variants={fadeUp}>
            <Toggle label="Enable welcome messages" checked={!!config.welcomeChannelId} onChange={(v) => { if (!v) patch("welcomeChannelId", null); }} />
            {config.welcomeChannelId !== null && (
              <>
                <SelectField label="Welcome channel" value={config.welcomeChannelId ?? ""} onChange={(v) => patch("welcomeChannelId", v)} options={textChannels.map((c) => ({ value: c.id, label: `#${c.name}` }))} />
                <TextField label="Message (use {user} and {server})" value={config.welcomeMessage ?? "Welcome to **{server}**, {user}! 🎉"} onChange={(v) => patch("welcomeMessage", v)} />
              </>
            )}
          </ConfigCard>

          {/* Verification */}
          <ConfigCard icon={ShieldCheck} title="Verification Gate" color="accent" variants={fadeUp}>
            <Toggle label="Enable verification" checked={!!(config.verifyChannelId && config.verifyRoleId)} onChange={(v) => { if (!v) { patch("verifyChannelId", null); patch("verifyRoleId", null); } }} />
            {config.verifyChannelId !== null && (
              <>
                <SelectField label="Verify channel" value={config.verifyChannelId ?? ""} onChange={(v) => patch("verifyChannelId", v)} options={textChannels.map((c) => ({ value: c.id, label: `#${c.name}` }))} />
                <SelectField label="Role granted after verify" value={config.verifyRoleId ?? ""} onChange={(v) => patch("verifyRoleId", v)} options={roles.map((r) => ({ value: r.id, label: r.name }))} />
                <p className="text-xs text-muted-foreground">After saving, run <code className="font-mono text-primary">/verify-panel</code> in Discord to post the verify button.</p>
              </>
            )}
          </ConfigCard>

          {/* Anti-Raid */}
          <ConfigCard icon={Sword} title="Anti-Raid Protection" color="coral" variants={fadeUp}>
            <Toggle label="Enable anti-raid" checked={!!config.antiRaid} onChange={(v) => patch("antiRaid", v)} />
            {config.antiRaid && (
              <NumberField label="Max joins per 10 seconds before lockdown" value={config.antiRaidThreshold ?? 10} onChange={(v) => patch("antiRaidThreshold", v)} min={3} max={50} />
            )}
          </ConfigCard>

          {/* Leveling */}
          <ConfigCard icon={TrendingUp} title="XP Leveling" color="secondary" variants={fadeUp}>
            <Toggle label="Enable leveling system" checked={!!config.leveling} onChange={(v) => patch("leveling", v)} />
            {config.leveling && (
              <SelectField label="Level-up announcement channel" value={config.levelAnnounceId ?? ""} onChange={(v) => patch("levelAnnounceId", v)} options={[{ value: "", label: "Same channel as message" }, ...textChannels.map((c) => ({ value: c.id, label: `#${c.name}` }))]} />
            )}
          </ConfigCard>

          {/* Tickets */}
          <ConfigCard icon={Ticket} title="Support Tickets" color="primary" variants={fadeUp}>
            <Toggle label="Enable ticket system" checked={!!(config.ticketCategoryId && config.ticketRoleId)} onChange={(v) => { if (!v) { patch("ticketCategoryId", null); patch("ticketRoleId", null); } }} />
            {config.ticketCategoryId !== null && (
              <>
                <SelectField label="Ticket category" value={config.ticketCategoryId ?? ""} onChange={(v) => patch("ticketCategoryId", v)} options={categories.map((c) => ({ value: c.id, label: c.name }))} />
                <SelectField label="Support role (can see tickets)" value={config.ticketRoleId ?? ""} onChange={(v) => patch("ticketRoleId", v)} options={roles.map((r) => ({ value: r.id, label: r.name }))} />
                <p className="text-xs text-muted-foreground">Users open tickets with <code className="font-mono text-primary">/ticket</code>.</p>
              </>
            )}
          </ConfigCard>

        </motion.div>

        {/* ChartIt — self-contained section with its own config endpoint + save */}
        <div className="mt-10 border-t border-card-border pt-10">
          <ChartItConfig guildId={guildId} channels={textChannels} />
        </div>
      </main>
    </div>
  );
}

