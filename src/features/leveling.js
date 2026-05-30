import { EmbedBuilder } from "discord.js";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const XP_PATH = join(__dirname, "../../data/xp-store.json");

mkdirSync(join(__dirname, "../../data"), { recursive: true });

// ── Persistent XP store ──────────────────────────────────────────────────────
// Structure: { [guildId]: { [userId]: { total, lastMessage } } }
let xpStore = {};
if (existsSync(XP_PATH)) {
  try { xpStore = JSON.parse(readFileSync(XP_PATH, "utf8")); } catch {}
}

function saveXP() {
  writeFileSync(XP_PATH, JSON.stringify(xpStore, null, 2));
}

// ── Constants ────────────────────────────────────────────────────────────────
const COOLDOWN_MS = 15_000; // 15 seconds between XP gains (was 60s, too slow for testing)
const XP_MIN = 15;
const XP_MAX = 25;

// ── Helpers ──────────────────────────────────────────────────────────────────
export function getXP(guildId, userId) {
  return xpStore[guildId]?.[userId] ?? { total: 0, lastMessage: 0 };
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

  if (!xpStore[guildId]) xpStore[guildId] = {};
  const data = xpStore[guildId][userId] ?? { total: 0, lastMessage: 0 };

  // Cooldown check
  if (now - data.lastMessage < COOLDOWN_MS) return;

  const prevLevel = levelFromXP(data.total).level;
  data.total += XP_MIN + Math.floor(Math.random() * (XP_MAX - XP_MIN + 1));
  data.lastMessage = now;
  xpStore[guildId][userId] = data;
  saveXP();

  const { level } = levelFromXP(data.total);

  // Announce level-up
  if (level > prevLevel && level > 0) {
    const announceId = cfg.levelAnnounceId;
    const channel = announceId
      ? message.guild.channels.cache.get(announceId)
      : message.channel;

    if (channel) {
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("🎉 Level Up!")
        .setDescription(`${message.author} reached **Level ${level}**! Keep it up!`)
        .setThumbnail(message.author.displayAvatarURL({ size: 128 }))
        .setFooter({ text: "GuildLabs Leveling" })
        .setTimestamp();

      await channel.send({ embeds: [embed] }).catch(() => {});
    }
  }
}
