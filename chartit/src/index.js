import "dotenv/config";
import { Client, GatewayIntentBits, Collection } from "discord.js";
import { loadCommands, loadEvents } from "./lib/loader.js";
import { startHealthServer } from "./lib/health-server.js";
import { closeBrowser } from "./lib/chart.js";

// ChartIt only needs the Guilds intent — it reads slash commands and sends
// messages/embeds. No MessageContent or GuildMembers required (privacy-minimal).
export const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();

await loadCommands(client);
await loadEvents(client);

startHealthServer(client, Number(process.env.BOT_API_PORT) || 8080);
await client.login(process.env.DISCORD_TOKEN);

// Tidy up the headless Chromium used for chart rendering on shutdown so Fly
// deploys/restarts don't leave an orphaned browser process behind.
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, async () => {
    try {
      await closeBrowser();
      await client.destroy();
    } finally {
      process.exit(0);
    }
  });
}
