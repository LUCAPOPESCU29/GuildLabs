import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getXP, levelFromXP } from "../features/leveling.js";

export default {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Check your XP rank")
    .addUserOption((o) => o.setName("user").setDescription("User to check (defaults to you)").setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser("user") ?? interaction.user;
    const xpData = getXP(interaction.guild.id, target.id);
    const { level, currentXP, xpNeeded } = levelFromXP(xpData.total);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`📊 ${target.username}'s Rank`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: "Level", value: `**${level}**`, inline: true },
        { name: "XP", value: `${currentXP} / ${xpNeeded}`, inline: true },
        { name: "Total XP", value: `${xpData.total}`, inline: true }
      )
      .setFooter({ text: "Keep chatting to earn XP!" });

    return interaction.reply({ embeds: [embed] });
  },
};
