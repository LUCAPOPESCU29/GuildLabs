import "dotenv/config";
import { Client, GatewayIntentBits, Partials, Collection } from "discord.js";
import { loadCommands, loadEvents } from "./lib/loader.js";
import { startApiServer } from "./lib/api-server.js";

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.Message, Partials.Reaction, Partials.User],
});

// Attach commands collection to client
client.commands = new Collection();

await loadCommands(client);
await loadEvents(client);

startApiServer(client, Number(process.env.BOT_API_PORT) || 3008);
await client.login(process.env.DISCORD_TOKEN);
