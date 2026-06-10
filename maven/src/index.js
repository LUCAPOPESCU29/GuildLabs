import "dotenv/config";
import { Client, GatewayIntentBits, Collection, Partials } from "discord.js";
import { loadCommands, loadEvents } from "./lib/loader.js";
import { startApiServer } from "./lib/api-server.js";
import { warmupEmbedder } from "./features/embedder.js";

// ── Process-level guardrails ────────────────────────────────────────────────
// Stray promise rejections shouldn't take the whole bot down — log loudly
// and let the gateway keep running.
process.on("unhandledRejection", (reason) => {
  console.error("[PROC] Unhandled rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[PROC] Uncaught exception:", err);
});

// ── Discord client ──────────────────────────────────────────────────────────
export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,  // privileged — enable in Dev Portal
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

client.commands = new Collection();

// ── Boot sequence ───────────────────────────────────────────────────────────
console.log("🐝 Maven booting…");

await loadCommands(client);
await loadEvents(client);

// Kick off background warmup of the embedding model.
// First inference is ~5s while the ONNX runtime materializes the weights —
// doing it at boot means real questions land fast.
warmupEmbedder().catch((err) => {
  console.error("[EMBED] warmup failed (continuing anyway):", err.message);
});

startApiServer(client, Number(process.env.BOT_API_PORT) || 3009);
await client.login(process.env.DISCORD_TOKEN);
