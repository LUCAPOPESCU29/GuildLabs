import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { Config } from "../lib/config-store.js";
import { Users } from "../lib/user-store.js";
import { normalizeSymbol } from "../lib/symbols.js";
import { getQuote } from "../lib/market.js";
import {
  brandEmbed,
  successEmbed,
  formatNumber,
  replyError,
  EPHEMERAL,
} from "../lib/embeds.js";

const MAX_ALERTS = 25;       // per server (channel alerts)
const MAX_USER_ALERTS = 25;  // per user (DM alerts)

/** Server (channel-delivered) alerts, stored in guild config. */
export function getAlerts(guildId) {
  const a = Config.getKey(guildId, "alerts");
  return Array.isArray(a) ? a : [];
}

/** Personal (DM-delivered) alerts, stored per user. */
export function getUserAlerts(userId) {
  const a = Users.getKey(userId, "alerts");
  return Array.isArray(a) ? a : [];
}

/** Next free integer id for a list of alerts. */
function nextId(alerts) {
  return alerts.reduce((m, a) => Math.max(m, a.id), 0) + 1;
}

export default {
  data: new SlashCommandBuilder()
    .setName("alert")
    .setDescription("Price alerts — ping a channel, or DM you, when a threshold is crossed")
    .addSubcommand((s) =>
      s.setName("add").setDescription("Create a price alert")
        .addStringOption((o) => o.setName("symbol").setDescription("Ticker — e.g. TSLA or BTC-USD").setRequired(true))
        .addStringOption((o) =>
          o.setName("direction").setDescription("Trigger when price goes…").setRequired(true)
            .addChoices({ name: "above", value: "above" }, { name: "below", value: "below" })
        )
        .addNumberOption((o) => o.setName("price").setDescription("Threshold price").setRequired(true).setMinValue(0))
        .addStringOption((o) =>
          o.setName("target").setDescription("Where the alert fires (default: this channel)").setRequired(false)
            .addChoices(
              { name: "this channel (needs Manage Server)", value: "channel" },
              { name: "DM me (personal)", value: "dm" },
            )
        )
    )
    .addSubcommand((s) => s.setName("list").setDescription("List your DM alerts and this server's channel alerts"))
    .addSubcommand((s) =>
      s.setName("remove").setDescription("Remove an alert by its id (e.g. 3 for a server alert, P3 for a DM alert)")
        .addStringOption((o) => o.setName("id").setDescription("Alert id from /alert list — e.g. 3 or P3").setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "add") return handleAdd(interaction);
    if (sub === "remove") return handleRemove(interaction);
    return handleList(interaction);
  },
};

async function handleAdd(interaction) {
  const guildId = interaction.guild.id;
  const symbol = normalizeSymbol(interaction.options.getString("symbol"));
  const direction = interaction.options.getString("direction");
  const price = interaction.options.getNumber("price");
  const target = interaction.options.getString("target") ?? "channel";
  if (!symbol) return replyError(interaction, "Invalid ticker", "Try **TSLA** or **BTC-USD**.");

  await interaction.deferReply(EPHEMERAL);
  let quote;
  try { quote = await getQuote(symbol); }
  catch (err) { return replyError(interaction, "Couldn't verify that ticker", err.message); }

  // lastState records whether price is already past the threshold, so we only
  // fire on an actual crossing (edge-triggered), not every poll.
  const lastState = quote.price >= price ? "above" : "below";

  if (target === "dm") {
    // Personal alert — any member can create one; delivered via DM.
    const alerts = getUserAlerts(interaction.user.id);
    if (alerts.length >= MAX_USER_ALERTS) {
      return replyError(interaction, "Too many DM alerts", `You already have ${MAX_USER_ALERTS} personal alerts. Remove one first.`);
    }
    const id = nextId(alerts);
    alerts.push({
      id, symbol, direction, price,
      target: "dm",
      userId: interaction.user.id,
      lastState, createdAt: Date.now(),
    });
    Users.merge(interaction.user.id, { alerts });
    return interaction.editReply({
      embeds: [successEmbed(
        "DM alert set",
        `I'll **DM you** when **${symbol}** goes **${direction} ${formatNumber(price)}**.\nCurrent price: **${formatNumber(quote.price)} ${quote.currency}**  ·  alert id \`P${id}\`\n\n*Make sure your DMs from server members are open, or I can't reach you.*`
      )],
    });
  }

  // Channel alert — admin-gated, stored on the guild.
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    return replyError(
      interaction,
      "Not allowed",
      "You need the **Manage Server** permission to add a channel alert. You can still create a personal **DM alert** — re-run with `target: DM me`."
    );
  }
  const alerts = getAlerts(guildId);
  if (alerts.length >= MAX_ALERTS) {
    return replyError(interaction, "Too many alerts", `This server already has ${MAX_ALERTS} channel alerts. Remove one first.`);
  }
  const id = nextId(alerts);
  alerts.push({
    id, symbol, direction, price,
    target: "channel",
    channelId: interaction.channelId,
    userId: interaction.user.id,
    lastState, createdAt: Date.now(),
  });
  Config.merge(guildId, { alerts });
  return interaction.editReply({
    embeds: [successEmbed(
      "Alert set",
      `I'll ping <#${interaction.channelId}> when **${symbol}** goes **${direction} ${formatNumber(price)}**.\nCurrent price: **${formatNumber(quote.price)} ${quote.currency}**  ·  alert id \`#${id}\``
    )],
  });
}

async function handleRemove(interaction) {
  const raw = interaction.options.getString("id").trim();
  // "P3"/"p3" → personal alert #3; "#3"/"3" → server channel alert #3.
  const personal = /^p/i.test(raw);
  const id = parseInt(raw.replace(/^[#pP]/i, ""), 10);
  if (!Number.isInteger(id) || id < 1) {
    return replyError(interaction, "Bad id", "Give an id from `/alert list` — e.g. `3` for a server alert or `P3` for a DM alert.");
  }

  if (personal) {
    const alerts = getUserAlerts(interaction.user.id);
    if (!alerts.some((a) => a.id === id)) {
      return replyError(interaction, "No such DM alert", `You have no personal alert \`P${id}\`. Run \`/alert list\`.`);
    }
    Users.merge(interaction.user.id, { alerts: alerts.filter((a) => a.id !== id) });
    return interaction.reply({ embeds: [successEmbed("DM alert removed", `Deleted personal alert \`P${id}\`.`)], ...EPHEMERAL });
  }

  // Server channel alert — admin-gated.
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    return replyError(interaction, "Not allowed", "You need **Manage Server** to remove a channel alert. To remove a personal DM alert, use its `P`-prefixed id.");
  }
  const alerts = getAlerts(interaction.guild.id);
  if (!alerts.some((a) => a.id === id)) {
    return replyError(interaction, "No such alert", `There's no server alert with id \`#${id}\`. Run \`/alert list\`.`);
  }
  Config.merge(interaction.guild.id, { alerts: alerts.filter((a) => a.id !== id) });
  return interaction.reply({ embeds: [successEmbed("Alert removed", `Deleted server alert \`#${id}\`.`)], ...EPHEMERAL });
}

async function handleList(interaction) {
  const userAlerts = getUserAlerts(interaction.user.id);
  const guildAlerts = getAlerts(interaction.guild.id);

  const embed = brandEmbed().setTitle("🔔 Price alerts");

  const personalBlock = userAlerts.length
    ? userAlerts.map((a) => `\`P${a.id}\` **${a.symbol}** ${a.direction} **${formatNumber(a.price)}** → DM`).join("\n")
    : "*No personal DM alerts. Create one with `/alert add … target: DM me`.*";

  const serverBlock = guildAlerts.length
    ? guildAlerts.map((a) => `\`#${a.id}\` **${a.symbol}** ${a.direction} **${formatNumber(a.price)}** → <#${a.channelId}>`).join("\n")
    : "*No server channel alerts.*";

  embed.addFields(
    { name: "📩 Your DM alerts", value: personalBlock },
    { name: "📢 Server alerts", value: serverBlock },
  );
  return interaction.reply({ embeds: [embed], ...EPHEMERAL });
}
