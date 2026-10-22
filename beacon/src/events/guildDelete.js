export default {
  name: "guildDelete",
  async execute(guild, client) {
    // discord.js also emits this when a guild goes unavailable during an outage
    // — `available` is false then, and we must not treat it as a removal.
    if (guild.available === false) return;
    const { store, directory } = client.beacon;
    if (!store.getGuild(guild.id)) return;
    store.softDelete(guild.id);
    directory.invalidate();
    console.log(`[GUILD] Left ${guild.name ?? guild.id} — page unlisted, data purges in 30 days`);
  },
};
