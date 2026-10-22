import { REST, Routes } from "discord.js";

/**
 * Registers slash commands. Global by default (what a hosted or self-hosted
 * instance wants — one registration, every guild). With DEV_GUILD_ID set,
 * registers to that single guild instead, which updates instantly while you
 * iterate on command definitions.
 */
export async function registerCommands(client, config) {
  const body = client.commands.map((cmd) => cmd.data.toJSON());
  const rest = new REST().setToken(config.token);

  if (config.devGuildId) {
    await rest.put(Routes.applicationGuildCommands(config.clientId, config.devGuildId), { body });
    console.log(`[CMD] Registered ${body.length} commands to dev guild ${config.devGuildId}`);
    return body.length;
  }

  await rest.put(Routes.applicationCommands(config.clientId), { body });
  console.log(`[CMD] Registered ${body.length} global commands (can take up to an hour to appear everywhere)`);
  return body.length;
}
