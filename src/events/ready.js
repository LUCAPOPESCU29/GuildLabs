import { registerCommandsEverywhere } from "../lib/register-commands.js";

export default {
  name: "clientReady",
  once: true,
  async execute(client) {
    console.log(`\n🤖 GuildLabs Bot online as ${client.user.tag}`);
    console.log(`   Serving ${client.guilds.cache.size} guild(s)\n`);
    client.user.setActivity("🔨 Building servers | /setup");

    // Register slash commands to every guild for INSTANT availability
    await registerCommandsEverywhere(client);
    console.log(`\n✅ All commands registered and ready to use.\n`);
  },
};
