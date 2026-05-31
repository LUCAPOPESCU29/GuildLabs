import { SlashCommandBuilder } from "discord.js";
import { getLeaderboard, levelFromXP } from "../features/leveling.js";
import { brandEmbed, BRAND, EPHEMERAL } from "../lib/embeds.js";
import { Config } from "../lib/config-store.js";

const MEDALS = ["🥇", "🥈", "🥉"];

export default {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Show the top XP earners in this server"),

  async execute(interaction) {
    const cfg = Config.get(interaction.guild.id);
    if (!cfg.leveling) {
      const embed = brandEmbed(BRAND.warning)
        .setTitle("Leveling is disabled")
        .setDescription("An admin needs to enable it with `/config leveling enabled:true`.");
      return interaction.reply({ embeds: [embed], ...EPHEMERAL });
    }

    await interaction.deferReply();

    const top = getLeaderboard(interaction.guild.id, 10);
    if (top.length === 0) {
      const embed = brandEmbed(BRAND.muted)
        .setTitle("No XP yet")
        .setDescription("Be the first — start chatting to earn XP!");
      return interaction.editReply({ embeds: [embed] });
    }

    // Resolve usernames in parallel (skip users no longer in the guild)
    const rows = await Promise.all(
      top.map(async ({ userId, total }, i) => {
        const member = await interaction.guild.members.fetch(userId).catch(() => null);
        const name = member?.displayName ?? `Unknown (${userId.slice(-4)})`;
        const { level } = levelFromXP(total);
        const prefix = MEDALS[i] ?? `\`#${String(i + 1).padStart(2, " ")}\``;
        return `${prefix} **${name}** — Level ${level} · ${total.toLocaleString()} XP`;
      })
    );

    const embed = brandEmbed(BRAND.primary)
      .setTitle(`🏆 ${interaction.guild.name} Leaderboard`)
      .setDescription(rows.join("\n"))
      .setThumbnail(interaction.guild.iconURL({ size: 256 }));

    return interaction.editReply({ embeds: [embed] });
  },
};
