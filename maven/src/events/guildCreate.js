import { registerCommandsToGuild } from "../lib/register-commands.js";

export default {
  name: "guildCreate",
  async execute(guild, client) {
    console.log(`[GUILD] Joined ${guild.name} (${guild.id})`);
    const n = await registerCommandsToGuild(client, guild.id);
    console.log(`[CMD] Registered ${n} commands to "${guild.name}"`);

    const channel =
      guild.systemChannel ||
      guild.channels.cache.find(
        (c) => c.isTextBased?.() && c.permissionsFor(guild.members.me)?.has("SendMessages")
      );

    if (channel) {
      await channel
        .send(
          "📚 **Thanks for adding Maven!**\n\n" +
            "I quietly read questions in this server and link past answers when someone asks something that's been asked before — so wisdom doesn't get buried in scroll.\n\n" +
            "Run `/maven config` to pick which channels I watch."
        )
        .catch(() => {});
    }
  },
};
