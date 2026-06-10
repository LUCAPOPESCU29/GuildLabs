import { Index } from "../features/index-store.js";

/**
 * Two responsibilities:
 *   1. If the deleted message was an indexed question — drop the entry.
 *   2. If the deleted message was an indexed answer — drop just the answer.
 *
 * The Index is permissive: removing a non-existent entry/answer is a no-op,
 * so we can call both without checking first.
 */
export default {
  name: "messageDelete",
  async execute(message) {
    if (!message.guild) return;
    const guildId = message.guild.id;
    Index.remove({ guildId, messageId: message.id });
    Index.removeAnswer({ guildId, messageId: message.id });
  },
};
