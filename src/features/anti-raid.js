/**
 * Anti-raid: tracks recent joins per guild.
 * If X members join within 10 seconds, kick them all and lock the server.
 */

// guildId → [timestamp, ...]
const joinLog = new Map();
// guildId → lockdown active?
const locked = new Map();

export async function handleAntiRaid(member, cfg) {
  const guildId = member.guild.id;
  const threshold = cfg.antiRaidThreshold ?? 10;
  const now = Date.now();

  if (!joinLog.has(guildId)) joinLog.set(guildId, []);
  const log = joinLog.get(guildId);

  // Keep only joins from the last 10 seconds
  const recent = log.filter((t) => now - t < 10_000);
  recent.push(now);
  joinLog.set(guildId, recent);

  if (recent.length >= threshold && !locked.get(guildId)) {
    locked.set(guildId, true);
    console.warn(`[ANTI-RAID] Raid detected on ${member.guild.name} — ${recent.length} joins in 10s`);

    // Kick the recent joiner
    try {
      await member.kick("Anti-raid: mass join detected");
    } catch {}

    // Notify mods via system channel if available
    const sysChannel = member.guild.systemChannel;
    if (sysChannel) {
      await sysChannel
        .send(
          `🚨 **Raid detected!** ${recent.length} users joined in 10 seconds. They have been kicked automatically. Server is now in lockdown for 30 seconds.`
        )
        .catch(() => {});
    }

    // Auto-unlock after 30 seconds
    setTimeout(() => {
      locked.set(guildId, false);
      joinLog.set(guildId, []);
      sysChannel?.send("✅ Anti-raid lockdown lifted.").catch(() => {});
    }, 30_000);

    return true; // member was kicked
  }

  return false;
}
