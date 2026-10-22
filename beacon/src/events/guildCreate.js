import { ChannelType, PermissionFlagsBits } from "discord.js";
import { guildVisuals } from "../lib/discord-data.js";
import { brandEmbed, BRAND } from "../lib/embeds.js";

export default {
  name: "guildCreate",
  async execute(guild, client) {
    const { store, config } = client.beacon;
    const { created } = store.upsertDraft({ guildId: guild.id, ...guildVisuals(guild) });
    console.log(`[GUILD] Joined ${guild.name} (${guild.id})${created ? "" : " — welcome back"}`);

    // One short hint, only on a first join, only where we can post.
    if (!created) return;
    const me = guild.members.me;
    const canPost = (c) =>
      c?.type === ChannelType.GuildText &&
      c.permissionsFor(me)?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks]);
    const channel =
      (canPost(guild.systemChannel) && guild.systemChannel) ||
      guild.channels.cache.filter(canPost).sort((a, b) => a.rawPosition - b.rawPosition).first();
    if (!channel) return;

    const embed = brandEmbed(BRAND.primary)
      .setTitle("Thanks for adding Beacon")
      .setDescription(
        "Beacon gives this server a live public page and lists it in a directory ranked by real activity — never bumps.\n\n" +
          "Someone with **Manage Server** can run **`/beacon setup`** to create the page. It takes about a minute.\n" +
          `Directory: ${config.publicUrl}`
      );
    await channel.send({ embeds: [embed] }).catch(() => {});
  },
};
