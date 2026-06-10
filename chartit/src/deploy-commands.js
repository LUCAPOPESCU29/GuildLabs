import "dotenv/config";
import { REST, Routes } from "discord.js";
import { readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const commands = [];
const commandsPath = join(__dirname, "commands");
const files = readdirSync(commandsPath).filter((f) => f.endsWith(".js"));

for (const file of files) {
  const { default: command } = await import(`./commands/${file}`);
  if (command?.data) commands.push(command.data.toJSON());
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// Use DEV_GUILD_ID for instant updates during dev, global otherwise
const route = process.env.DEV_GUILD_ID
  ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.DEV_GUILD_ID)
  : Routes.applicationCommands(process.env.CLIENT_ID);

console.log(`Registering ${commands.length} slash commands…`);
const data = await rest.put(route, { body: commands });
console.log(`✅ Registered ${data.length} commands.`);
