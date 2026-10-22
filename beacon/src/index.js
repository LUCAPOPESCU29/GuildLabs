import "dotenv/config";
import { Client, GatewayIntentBits, Collection } from "discord.js";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { loadConfig } from "./lib/config.js";
import { openDatabase } from "./lib/db.js";
import { createStore } from "./lib/store.js";
import { createDirectory } from "./lib/directory.js";
import { loadCommands, loadEvents } from "./lib/loader.js";
import { createApp } from "./web/server.js";

// ── Config: fail fast with a readable message ───────────────────────────────
let config;
try {
  config = loadConfig();
} catch (err) {
  console.error(`\n${err.message}\n`);
  process.exit(1);
}

// ── Storage ─────────────────────────────────────────────────────────────────
mkdirSync(join(config.dataDir, "uploads"), { recursive: true });
const db = openDatabase(join(config.dataDir, "beacon.sqlite"));
const store = createStore(db);
const directory = createDirectory(store);

// ── Discord client — no privileged intents, ever ────────────────────────────
export const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildScheduledEvents],
});
client.commands = new Collection();
client.beacon = { config, store, directory, jobs: null };

// Transient socket errors (ECONNRESET etc.) must not crash the process —
// discord.js reconnects the gateway on its own.
client.ws.on("error", () => {});

await loadCommands(client);
await loadEvents(client);

// ── Web: public pages + directory + /health, same process ───────────────────
const app = createApp({ store, directory, config, client });
const server = app.listen(config.port, () => {
  console.log(`[WEB] web listening on :${config.port}  (public URL: ${config.publicUrl})`);
});

// ── Graceful shutdown ───────────────────────────────────────────────────────
let stopping = false;
async function shutdown(signal) {
  if (stopping) return;
  stopping = true;
  console.log(`\n[SYS] ${signal} received — shutting down`);
  client.beacon.jobs?.stop();
  server.close();
  await client.destroy();
  store.close();
  process.exit(0);
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

try {
  await client.login(config.token);
} catch (err) {
  console.error(`[SYS] Discord login failed: ${err.message}`);
  console.error("      Check DISCORD_TOKEN in your .env (Bot tab → Reset Token).");
  process.exit(1);
}
