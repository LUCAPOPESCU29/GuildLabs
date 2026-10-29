import { registerCommandsEverywhere } from "../lib/register-commands.js";

export default {
  name: "clientReady",
  once: true,
  async execute(client) {
    console.log(`\n🤖 GuildLabs Bot online as ${client.user.tag}`);
    console.log(`   Serving ${client.guilds.cache.size} guild(s)\n`);
    // Rotating status — the only "announcement" channel that costs nothing and
    // can't be reported as spam: it just shows in the member list of every guild.
    const STATUSES = [
      "✨ new: emoji channels | /changelog",
      "🔨 Building servers | /setup",
      "🎨 topics, slowmode, emoji | /changelog",
      `🌐 ${client.guilds.cache.size} servers | /setup`,
    ];
    let i = 0;
    const rotate = () => client.user.setActivity(STATUSES[i++ % STATUSES.length]);
    rotate();
    setInterval(rotate, 5 * 60_000).unref?.();

    // Register slash commands to every guild for INSTANT availability
    await registerCommandsEverywhere(client);
    console.log(`\n✅ All commands registered and ready to use.\n`);
  },
};
