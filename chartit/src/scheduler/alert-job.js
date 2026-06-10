import { Config } from "../lib/config-store.js";
import { Users } from "../lib/user-store.js";
import { getAlerts, getUserAlerts } from "../commands/alert.js";
import { getQuotes } from "../lib/market.js";
import { brandEmbed, BRAND, formatNumber } from "../lib/embeds.js";

/**
 * Polls every minute. Collects every alert symbol — across all guilds (channel
 * alerts) AND all users (personal DM alerts) — into ONE batched quote call,
 * then edge-triggers: an alert fires only when the price actually crosses its
 * threshold (tracked via each alert's `lastState`).
 *
 * Fired alerts are removed (one-shot), so they don't re-ping every minute while
 * the price stays past the threshold.
 */
export async function runAlertTick(client) {
  // 1. Gather the union of symbols that have at least one alert (guild + user).
  const guildIds = Config.allGuildIds();
  const userIds = Users.allUserIds();
  const symbolSet = new Set();
  for (const gid of guildIds) {
    for (const a of getAlerts(gid)) symbolSet.add(a.symbol);
  }
  for (const uid of userIds) {
    for (const a of getUserAlerts(uid)) symbolSet.add(a.symbol);
  }
  if (symbolSet.size === 0) return;

  // 2. One batched fetch for all of them.
  const quotes = await getQuotes([...symbolSet]);
  if (quotes.size === 0) return;

  // 3a. Evaluate per guild (channel alerts), persist any changes.
  for (const gid of guildIds) {
    const alerts = getAlerts(gid);
    if (alerts.length === 0) continue;
    const { remaining, changed } = await evaluate(client, alerts, quotes);
    if (changed) Config.merge(gid, { alerts: remaining });
  }

  // 3b. Evaluate per user (DM alerts), persist any changes.
  for (const uid of userIds) {
    const alerts = getUserAlerts(uid);
    if (alerts.length === 0) continue;
    const { remaining, changed } = await evaluate(client, alerts, quotes);
    if (changed) Users.merge(uid, { alerts: remaining });
  }
}

/**
 * Edge-trigger a list of alerts against the batched quotes. Returns the alerts
 * to keep plus whether anything changed (fired or moved). Shared by guild and
 * user alert evaluation so the crossing logic lives in exactly one place.
 */
async function evaluate(client, alerts, quotes) {
  const remaining = [];
  let changed = false;

  for (const alert of alerts) {
    const q = quotes.get(alert.symbol);
    if (!q) { remaining.push(alert); continue; } // no data this tick — keep it

    const state = q.price >= alert.price ? "above" : "below";
    const crossedUp = alert.direction === "above" && alert.lastState === "below" && state === "above";
    const crossedDown = alert.direction === "below" && alert.lastState === "above" && state === "below";

    if (crossedUp || crossedDown) {
      await fireAlert(client, alert, q).catch((e) =>
        console.error(`[ALERT] deliver ${alert.target === "dm" ? "P" : "#"}${alert.id} (${alert.symbol}):`, e.message)
      );
      changed = true; // alert consumed — drop it
      continue;
    }

    if (state !== alert.lastState) {
      alert.lastState = state; // track movement without firing
      changed = true;
    }
    remaining.push(alert);
  }

  return { remaining, changed };
}

async function fireAlert(client, alert, quote) {
  const arrow = alert.direction === "above" ? "📈" : "📉";
  const color = alert.direction === "above" ? BRAND.up : BRAND.down;
  const embed = brandEmbed(color)
    .setTitle(`${arrow} ${alert.symbol} crossed ${alert.direction} ${formatNumber(alert.price)}`)
    .setDescription(
      `**${alert.symbol}** is now **${formatNumber(quote.price)} ${quote.currency}**.\n` +
      `Alert \`${alert.target === "dm" ? "P" : "#"}${alert.id}\`.`
    );

  if (alert.target === "dm") {
    // Personal alert — DM the requesting user directly.
    const user = await client.users.fetch(alert.userId).catch(() => null);
    if (!user) return;
    await user.send({ embeds: [embed] });
    return;
  }

  // Channel alert — ping the configured channel and mention the requester.
  const channel = await client.channels.fetch(alert.channelId).catch(() => null);
  if (!channel || !channel.isTextBased?.()) return;
  await channel.send({ content: `<@${alert.userId}>`, embeds: [embed] });
}
