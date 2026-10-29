import { Config } from "../lib/config-store.js";
import { handleXP } from "../features/leveling.js";

export default {
  name: "messageCreate",
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    const cfg = Config.get(message.guild.id);

    // ── XP / Leveling ─────────────────────────────────────────────────────
    if (cfg.leveling) {
      await handleXP(message, cfg, client);
    }
  },
};
