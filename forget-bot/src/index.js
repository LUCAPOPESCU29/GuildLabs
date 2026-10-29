import "dotenv/config";
import { Client, GatewayIntentBits, Collection } from "discord.js";
import { loadCommands, loadEvents } from "./lib/loader.js";

if (!process.env.DISCORD_TOKEN) {
  console.error("❌ DISCORD_TOKEN is missing. Copy .env.example to .env and fill it in.");
  process.exit(1);
}

// Forget only posts embeds — it needs no privileged intents at all.
export const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

await loadCommands(client);
await loadEvents(client);
await client.login(process.env.DISCORD_TOKEN);
