import "dotenv/config";
import { REST, Routes } from "discord.js";
import { readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error("❌ DISCORD_TOKEN and CLIENT_ID are required in .env");
  process.exit(1);
}

const commands = [];
for (const file of readdirSync(join(__dirname, "commands")).filter((f) => f.endsWith(".js"))) {
  const { default: cmd } = await import(`./commands/${file}`);
  if (cmd?.data) commands.push(cmd.data.toJSON());
}

// Forget is dedicated to one server: guild-scoped registration is instant and
// keeps the command out of every other server the app might be added to.
const rest = new REST().setToken(DISCORD_TOKEN);
const route = GUILD_ID
  ? Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID)
  : Routes.applicationCommands(CLIENT_ID);

console.log(`Registering ${commands.length} command(s) ${GUILD_ID ? `to guild ${GUILD_ID}` : "globally (~1h to appear)"}…`);
const data = await rest.put(route, { body: commands });
console.log(`✅ Registered ${data.length} command(s).`);
