import { guildVisuals } from "../lib/discord-data.js";

/** Keep the cached name / icon / banner / NSFW flag in step with Discord. */
export default {
  name: "guildUpdate",
  async execute(_old, guild, client) {
    const { store, directory } = client.beacon;
    if (!store.getGuild(guild.id)) return;
    const v = guildVisuals(guild);
    store.updateGuild(guild.id, {
      name: v.name,
      icon_url: v.iconUrl,
      banner_url: v.bannerUrl,
      nsfw: v.nsfw ? 1 : 0,
      // An age-restricted server drops out of the directory automatically.
      ...(v.nsfw ? { published: 0 } : {}),
    });
    directory.invalidate();
  },
};
