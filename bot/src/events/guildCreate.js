import { registerCommandsToGuild } from "../lib/register-commands.js";

export default {
  name: "guildCreate",
  async execute(guild, client) {
    console.log(`[GUILD] Joined new guild: ${guild.name} (${guild.id})`);
    const count = await registerCommandsToGuild(client, guild.id);
    console.log(`[CMD] Registered ${count} commands to new guild "${guild.name}"`);

    // Try to greet in the system channel or first available text channel
    const channel =
      guild.systemChannel ||
      guild.channels.cache.find(
        (c) => c.isTextBased?.() && c.permissionsFor(guild.members.me)?.has("SendMessages")
      );

    if (channel) {
      await channel
        .send(
          "👋 **Thanks for adding GuildLabs!**\n\n" +
            "Run `/setup` with a blueprint to build your server, or `/config` to set up welcome messages, verification, leveling, anti-raid, and tickets.\n\n" +
            "Make sure my role is near the top of your role list so I have permission to manage roles and channels."
        )
        .catch(() => {});
    }
  },
};
