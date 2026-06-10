import { registerCommandsEverywhere } from "../lib/register-commands.js";
import { startScheduler } from "../scheduler/index.js";

export default {
  name: "clientReady",
  once: true,
  async execute(client) {
    console.log(`\n📈 ChartIt online as ${client.user.tag}`);
    console.log(`   Serving ${client.guilds.cache.size} guild(s)\n`);
    client.user.setActivity("📈 /chart AAPL");

    // Register slash commands to every guild for INSTANT availability
    await registerCommandsEverywhere(client);
    console.log(`\n✅ All commands registered.\n`);

    // Start watchlist auto-posts + alert polling
    startScheduler(client);
  },
};
