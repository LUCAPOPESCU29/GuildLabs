import { Config } from "../lib/config-store.js";
import { EmbedBuilder } from "discord.js";
import { handleAntiRaid } from "../features/anti-raid.js";

export default {
  name: "guildMemberAdd",
  async execute(member, client) {
    const guildId = member.guild.id;
    const cfg = Config.get(guildId);

    // ── Anti-raid check first ────────────────────────────────────────────────
    if (cfg.antiRaid) {
      const banned = await handleAntiRaid(member, cfg);
      if (banned) return; // Member was kicked/banned, skip welcome
    }

    // ── Welcome message ──────────────────────────────────────────────────────
    if (cfg.welcomeChannelId) {
      const channel = member.guild.channels.cache.get(cfg.welcomeChannelId);
      if (!channel) return;

      const msg = (cfg.welcomeMessage ?? "Welcome to **{server}**, {user}! 🎉")
        .replace("{user}", member.toString())
        .replace("{server}", member.guild.name)
        .replace("{username}", member.user.username);

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setDescription(msg)
        .setThumbnail(member.user.displayAvatarURL({ size: 128 }))
        .setFooter({ text: `Member #${member.guild.memberCount}` })
        .setTimestamp();

      await channel.send({ embeds: [embed] }).catch(() => {});
    }
  },
};
