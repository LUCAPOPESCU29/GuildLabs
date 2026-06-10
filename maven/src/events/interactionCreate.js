import { Index } from "../features/index-store.js";
import { errorEmbed, brandEmbed, BRAND } from "../lib/embeds.js";

/**
 * Two responsibilities:
 *
 *   1. Slash commands — dispatch to the registered Command's execute().
 *      Errors are caught and replied with the actual message so admins
 *      know what's wrong (rather than a useless "Something went wrong").
 *
 *   2. Buttons — Maven's auto-surface reply ships with two buttons:
 *        "This helped"  → mvn_fb_yes_<entryId>
 *        "Wrong match"  → mvn_fb_no_<entryId>
 *      They feed back into the entry's helpful / notHelpful counters so
 *      good matches float higher in future ties.
 */
export default {
  name: "interactionCreate",
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) return runSlashCommand(interaction, client);
    if (interaction.isButton()) return runButton(interaction);
  },
};

// ── Slash commands ─────────────────────────────────────────────────────────

async function runSlashCommand(interaction, client) {
  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.warn(`[CMD] Unknown command: /${interaction.commandName}`);
    return;
  }
  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`[CMD] Error in /${interaction.commandName}:`, err);
    const embed = errorEmbed(
      `Something went wrong running \`/${interaction.commandName}\``,
      `\`\`\`${String(err?.message || "Unknown error").slice(0, 800)}\`\`\``
    );
    const payload = { embeds: [embed], flags: 64 };
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(payload);
      } else {
        await interaction.reply(payload);
      }
    } catch (replyErr) {
      console.error(`[CMD] Could not deliver error:`, replyErr.message);
    }
  }
}

// ── Buttons ────────────────────────────────────────────────────────────────

const FB_RE = /^mvn_fb_(yes|no)_(\d+)$/;

async function runButton(interaction) {
  const m = FB_RE.exec(interaction.customId);
  if (!m) return; // not one of ours
  const [, verdict, entryId] = m;

  // Only the original asker (or admins) should be able to vote on the
  // match Maven surfaced — random passers-by shouldn't poison the signal.
  const originalAuthorId = interaction.message?.mentions?.repliedUser?.id
    ?? interaction.message?.interactionMetadata?.user?.id
    ?? null;
  // Discord doesn't expose the replied-to author cleanly without a fetch.
  // Allow the original asker (referenced message's author) OR a manager.
  const isAdmin = interaction.member?.permissions?.has?.("ManageGuild") ?? false;
  let isOriginalAsker = false;
  try {
    const ref = interaction.message?.reference;
    if (ref?.messageId) {
      const referenced = await interaction.channel.messages
        .fetch(ref.messageId)
        .catch(() => null);
      isOriginalAsker = referenced?.author?.id === interaction.user.id;
    }
  } catch {
    // Permissive fallback below.
  }
  if (!isOriginalAsker && !isAdmin) {
    return interaction.reply({
      embeds: [brandEmbed(BRAND.muted)
        .setTitle("Not yours to vote on")
        .setDescription("Only the person who asked can mark this match as helpful or wrong.")],
      flags: 64,
    });
  }

  const ok = Index.vote({
    guildId: interaction.guild.id,
    messageId: entryId,
    helpful: verdict === "yes",
  });

  const label = verdict === "yes" ? "Thanks — noted as helpful." : "Got it — Maven will prefer different matches next time.";
  await interaction.reply({
    embeds: [brandEmbed(verdict === "yes" ? BRAND.success : BRAND.muted)
      .setTitle(ok ? "Recorded" : "Couldn't find that entry")
      .setDescription(ok ? label : "It may have been removed since this message was posted.")],
    flags: 64,
  });
}
