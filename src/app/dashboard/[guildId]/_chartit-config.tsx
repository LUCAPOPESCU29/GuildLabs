"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { LineChart, Bell, RefreshCw, Save, CheckCircle, PlugZap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfigCard, Toggle, SelectField, NumberField } from "@/components/dashboard/config-controls";

/**
 * ChartIt configuration surface for the guild dashboard.
 *
 * Reads/writes through the bot proxy. Expected ChartIt bot endpoints:
 *   GET  /config/chartit/:guildId  → ChartItConfig
 *   POST /config/chartit/:guildId  → persists ChartItConfig
 * (reached from the web as /api/bot/config/chartit/:guildId)
 *
 * These endpoints are a separate, documented dependency on the ChartIt bot. If
 * they're absent (bot offline / not wired), this section shows a friendly
 * "not connected" state instead of erroring — never blocking the rest of the
 * dashboard.
 */

type Channel = { id: string; name: string };

type ChartItConfig = {
  watchlistChannelId: string | null;
  watchlistIntervalMin: number;
  watchlistRange: string;
  watchlistMarketHoursOnly: boolean;
  alertChannelId: string | null;
};

const DEFAULTS: ChartItConfig = {
  watchlistChannelId: null,
  watchlistIntervalMin: 60,
  watchlistRange: "1d",
  watchlistMarketHoursOnly: true,
  alertChannelId: null,
};

const RANGE_OPTIONS = [
  { value: "1d", label: "1 Day" },
  { value: "5d", label: "5 Days" },
  { value: "1mo", label: "1 Month" },
  { value: "6mo", label: "6 Months" },
  { value: "1y", label: "1 Year" },
  { value: "ytd", label: "Year to Date" },
];

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export function ChartItConfig({ guildId, channels }: { guildId: string; channels: Channel[] }) {
  const [config, setConfig] = React.useState<ChartItConfig>(DEFAULTS);
  const [state, setState] = React.useState<"loading" | "ready" | "unavailable">("loading");
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/bot/config/chartit/${guildId}`);
        if (!res.ok) throw new Error();
        const data = (await res.json()) as Partial<ChartItConfig>;
        if (active) {
          setConfig({ ...DEFAULTS, ...data });
          setState("ready");
        }
      } catch {
        if (active) setState("unavailable");
      }
    })();
    return () => {
      active = false;
    };
  }, [guildId]);

  function patch<K extends keyof ChartItConfig>(key: K, value: ChartItConfig[K]) {
    setConfig((c) => ({ ...c, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      await fetch(`/api/bot/config/chartit/${guildId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  const channelOptions = channels.map((c) => ({ value: c.id, label: `#${c.name}` }));

  return (
    <section aria-labelledby="chartit-config-heading">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <LineChart className="size-5 text-primary" />
          <h2 id="chartit-config-heading" className="font-display text-xl font-black">
            ChartIt
          </h2>
        </div>
        {state === "ready" && (
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? <RefreshCw className="size-4 animate-spin" /> : saved ? <CheckCircle className="size-4" /> : <Save className="size-4" />}
            {saving ? "Saving…" : saved ? "Saved!" : "Save ChartIt"}
          </Button>
        )}
      </div>

      {state === "loading" && <div className="glass h-40 animate-pulse rounded-3xl" />}

      {state === "unavailable" && (
        <div className="glass flex items-start gap-3 rounded-3xl p-6">
          <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-muted text-muted-foreground">
            <PlugZap className="size-5" />
          </div>
          <div>
            <h3 className="font-display font-bold">ChartIt isn&apos;t connected here yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add ChartIt to this server and it&apos;ll show up here for configuration. For now you can set everything
              with slash commands like <code className="font-mono text-primary">/watchlist</code> and{" "}
              <code className="font-mono text-primary">/alert</code>.
            </p>
          </div>
        </div>
      )}

      {state === "ready" && (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}
          className="space-y-6"
        >
          {/* Watchlist auto-post */}
          <ConfigCard icon={LineChart} title="Auto-post watchlist" color="primary" variants={fadeUp}>
            <Toggle
              label="Auto-post charts to a channel"
              checked={!!config.watchlistChannelId}
              onChange={(v) => {
                if (!v) patch("watchlistChannelId", null);
              }}
            />
            {config.watchlistChannelId !== null && (
              <>
                <SelectField
                  label="Channel"
                  value={config.watchlistChannelId ?? ""}
                  onChange={(v) => patch("watchlistChannelId", v || null)}
                  options={channelOptions}
                />
                <SelectField
                  label="Chart range"
                  value={config.watchlistRange}
                  onChange={(v) => patch("watchlistRange", v)}
                  options={RANGE_OPTIONS}
                />
                <NumberField
                  label="Post every (minutes)"
                  value={config.watchlistIntervalMin}
                  onChange={(v) => patch("watchlistIntervalMin", v)}
                  min={5}
                  max={1440}
                />
                <Toggle
                  label="Only during US market hours"
                  checked={config.watchlistMarketHoursOnly}
                  onChange={(v) => patch("watchlistMarketHoursOnly", v)}
                />
                <p className="text-xs text-muted-foreground">
                  Add tickers with <code className="font-mono text-primary">/watchlist add</code> in Discord.
                </p>
              </>
            )}
          </ConfigCard>

          {/* Alert defaults */}
          <ConfigCard icon={Bell} title="Alert defaults" color="accent" variants={fadeUp}>
            <SelectField
              label="Default channel for price alerts"
              value={config.alertChannelId ?? ""}
              onChange={(v) => patch("alertChannelId", v || null)}
              options={channelOptions}
            />
            <p className="text-xs text-muted-foreground">
              Members can always create personal DM alerts with{" "}
              <code className="font-mono text-primary">/alert add … target: DM me</code>.
            </p>
          </ConfigCard>
        </motion.div>
      )}
    </section>
  );
}
