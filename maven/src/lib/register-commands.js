import { REST, Routes } from "discord.js";

/**
 * Register slash commands to a single guild — instantaneous, vs global
 * registrations which take up to an hour to propagate.
 */
export async function registerCommandsToGuild(client, guildId) {
  const commands = client.commands.map((cmd) => cmd.data.toJSON());
  const rest = new REST().setToken(process.env.DISCORD_TOKEN);
  try {
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, guildId),
      { body: commands }
    );
    return commands.length;
  } catch (err) {
    console.error(`[CMD] Failed to register commands to guild ${guildId}:`, err.message);
    return 0;
  }
}

export async function registerCommandsEverywhere(client) {
  const guilds = [...client.guilds.cache.values()];
  for (const guild of guilds) {
    const count = await registerCommandsToGuild(client, guild.id);
    console.log(`[CMD] Registered ${count} commands to "${guild.name}" (${guild.id})`);
  }
}
