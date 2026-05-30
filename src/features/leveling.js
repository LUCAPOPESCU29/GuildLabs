import { EmbedBuilder } from "discord.js";

/**
 * Simple XP leveling system.
 * XP is stored in-memory (persists per restart via config-store if you hook it in).
 * Formula: level = floor(sqrt(totalXP / 100))
 */

// guildId → userId → { total, lastMessage }
const xpStore = new Map();

// Cooldown: 1 XP gain per 60 seconds per user
const COOLDOWN_MS = 60_000;
const XP_PER_MESSAGE = 15;

export function getXP(guildId, userId) {
  const guild = xpStore.get(guildId) ?? new Map();
  return guild.get(userId) ?? { total: 0, lastMessage: 0 };
}

export function levelFromXP(totalXP) {
  const level = Math.floor(Math.sqrt(totalXP / 100));
  const xpForCurrent = level * level * 100;
  const xpForNext = (level + 1) * (level + 1) * 100;
  return {
    level,
    currentXP: totalXP - xpForCurrent,
    xpNeeded: xpForNext - xpForCurrent,
    totalXP,
  };
}

export async function handleXP(message, cfg, client) {
  const guildId = message.guild.id;
  const userId = message.author.id;
  const now = Date.now();

  if (!xpStore.has(guildId)) xpStore.set(guildId, new Map());
  const guild = xpStore.get(guildId);
  const data = guild.get(userId) ?? { total: 0, lastMessage: 0 };

  // Cooldown check
  if (now - data.lastMessage < COOLDOWN_MS) return;

  const prevLevel = levelFromXP(data.total).level;
  data.total += XP_PER_MESSAGE + Math.floor(Math.random() * 10); // 15-24 XP
  data.lastMessage = now;
  guild.set(userId, data);

  const { level } = levelFromXP(data.total);

  // Announce level-up
  if (level > prevLevel) {
    const announceId = cfg.levelAnnounceId;
    const channel = announceId
      ? message.guild.channels.cache.get(announceId)
      : message.channel;

    if (channel) {
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setDescription(`🎉 ${message.author} leveled up to **Level ${level}**!`)
        .setThumbnail(message.author.displayAvatarURL());

      await channel.send({ embeds: [embed] }).catch(() => {});
    }
  }
}
