import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { unlink } from "node:fs/promises";
import { join } from "node:path";
import { brandEmbed, BRAND } from "../lib/embeds.js";

/** `/beacon remove` asks for confirmation; these handle the two buttons. */
export const IDS = {
  confirm: "beacon:remove:confirm",
  cancel: "beacon:remove:cancel",
};

export function buildRemovePrompt(row) {
  const embed = brandEmbed(BRAND.warning)
    .setTitle("Remove this server's Beacon page?")
    .setDescription(
      `This deletes the page for **${row.name}**, its stats history, and any uploaded banner. ` +
        "The Discord invite Beacon created is left in place — delete it in Server Settings if you want it gone too.\n\n" +
        "You can run **`/beacon setup`** again later to start fresh."
    );
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(IDS.confirm).setLabel("Yes, remove it").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(IDS.cancel).setLabel("Keep it").setStyle(ButtonStyle.Secondary)
  );
  return { embeds: [embed], components: [row1], flags: 64 };
}

export async function handleRemoveConfirm(interaction) {
  const { store, config, directory } = interaction.client.beacon;
  const row = store.getGuild(interaction.guild.id);
  if (row?.banner_path) {
    await unlink(join(config.dataDir, "uploads", row.banner_path)).catch(() => {});
  }
  if (row) store.hardDelete(row.guild_id);
  directory.invalidate();
  return interaction.update({
    embeds: [brandEmbed(BRAND.muted).setTitle("Page removed").setDescription("Beacon no longer has a page or stats for this server.")],
    components: [],
  });
}

export async function handleRemoveCancel(interaction) {
  return interaction.update({
    embeds: [brandEmbed(BRAND.muted).setTitle("Kept").setDescription("Nothing was changed.")],
    components: [],
  });
}
