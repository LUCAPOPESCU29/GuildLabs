import { registerCommandsToGuild } from "../lib/register-commands.js";

export default {
  name: "guildCreate",
  async execute(guild, client) {
    console.log(`[GUILD] Joined "${guild.name}" (${guild.id})`);
    // Register commands immediately so they're usable without waiting.
    const count = await registerCommandsToGuild(client, guild.id);
    console.log(`[CMD] Registered ${count} commands to new guild "${guild.name}"`);
  },
};
