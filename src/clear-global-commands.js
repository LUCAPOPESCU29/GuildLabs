import "dotenv/config";
import { REST, Routes } from "discord.js";

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

console.log("Clearing all GLOBAL slash commands…");
await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] });
console.log("✅ Cleared. Only per-guild commands (registered on bot startup) will show now.");
console.log("   Restart Discord (Cmd+R) to refresh the command list immediately.");
