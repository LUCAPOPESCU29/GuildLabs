import { SlashCommandBuilder } from "discord.js";
import { getXP, levelFromXP, getRank } from "../features/leveling.js";
import { brandEmbed, BRAND, EPHEMERAL, progressBar } from "../lib/embeds.js";
import { Config } from "../lib/config-store.js";

export default {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Check your XP, level, and progress to the next level")
    .addUserOption((o) =>
      o.setName("user")
        .setDescription("Whose rank to look up (defaults to you)")
        .setRequired(false)
    ),

  async execute(interaction) {
    const cfg = Config.get(interaction.guild.id);
    if (!cfg.leveling) {
      const embed = brandEmbed(BRAND.warning)
        .setTitle("Leveling is disabled")
        .setDescription("An admin needs to enable it with `/config leveling enabled:true`.");
      return interaction.reply({ embeds: [embed], ...EPHEMERAL });
    }

    const target = interaction.options.getUser("user") ?? interaction.user;
    const xpData = getXP(interaction.guild.id, target.id);
    const { level, currentXP, xpNeeded, totalXP } = levelFromXP(xpData.total);
    const rank = getRank(interaction.guild.id, target.id);

    const bar = progressBar(currentXP, xpNeeded, 14);

    const embed = brandEmbed(BRAND.primary)
      .setAuthor({
        name: `${target.username}'s rank`,
        iconURL: target.displayAvatarURL({ size: 128 }),
      })
      .setThumbnail(target.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "Level", value: `**${level}**`, inline: true },
        { name: "Rank", value: rank ? `**#${rank}**` : "—", inline: true },
        { name: "Total XP", value: `**${totalXP.toLocaleString()}**`, inline: true },
        {
          name: `Progress to level ${level + 1}`,
          value: `\`${bar}\`\n${currentXP.toLocaleString()} / ${xpNeeded.toLocaleString()} XP`,
          inline: false,
        }
      );

    return interaction.reply({ embeds: [embed] });
  },
};
