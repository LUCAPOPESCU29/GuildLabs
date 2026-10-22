import { z } from "zod";

/**
 * Environment → typed config. Fails fast with a readable message so a
 * self-hoster with a half-filled .env sees exactly what's missing instead of
 * a stack trace from somewhere deep in discord.js.
 */

const schema = z.object({
  DISCORD_TOKEN: z
    .string({ required_error: "missing — Bot tab → Reset Token" })
    .min(1, "missing — Bot tab → Reset Token"),
  CLIENT_ID: z
    .string({ required_error: "missing — General Information → Application ID" })
    .min(1, "missing — General Information → Application ID"),
  PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  DATA_DIR: z.string().min(1).default("./data"),
  BEACON_PUBLIC_URL: z
    .string()
    .url("BEACON_PUBLIC_URL must be a full URL, e.g. https://beacon.example.com")
    .default("http://localhost:8080"),
  BEACON_SITE_NAME: z.string().min(1).default("Beacon"),
  BEACON_FOOTER_TEXT: z.string().default(""),
  BEACON_REPORT_EMAIL: z.string().default(""),
  BEACON_ADMIN_USER_IDS: z.string().default(""),
  DIGEST_HOUR_UTC: z.coerce.number().int().min(0).max(23).default(9),
  DEV_GUILD_ID: z.string().default(""),
});

export function loadConfig(env = process.env) {
  // Empty strings in .env.example should behave like "unset" for optional keys.
  const cleaned = Object.fromEntries(
    Object.entries(env).map(([k, v]) => [k, typeof v === "string" && v.trim() === "" ? undefined : v])
  );
  const parsed = schema.safeParse(cleaned);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  • ${i.path.join(".") || "env"}: ${i.message}`);
    throw new Error(`Beacon can't start — fix your .env:\n${lines.join("\n")}`);
  }
  const c = parsed.data;
  return {
    token: c.DISCORD_TOKEN,
    clientId: c.CLIENT_ID,
    port: c.PORT,
    dataDir: c.DATA_DIR,
    publicUrl: c.BEACON_PUBLIC_URL.replace(/\/+$/, ""),
    siteName: c.BEACON_SITE_NAME,
    footerText: c.BEACON_FOOTER_TEXT,
    reportEmail: c.BEACON_REPORT_EMAIL,
    adminUserIds: c.BEACON_ADMIN_USER_IDS.split(",").map((s) => s.trim()).filter(Boolean),
    digestHourUtc: c.DIGEST_HOUR_UTC,
    devGuildId: c.DEV_GUILD_ID,
  };
}
