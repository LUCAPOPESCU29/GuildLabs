import { registerCommandsEverywhere } from "../lib/register-commands.js";

export default {
  name: "clientReady",
  once: true,
  async execute(client) {
    console.log(`\n🐝 Maven online as ${client.user.tag}`);
    console.log(`   Watching ${client.guilds.cache.size} guild(s)\n`);
    client.user.setActivity("📚 surfacing past wisdom · /maven help");
    await registerCommandsEverywhere(client);
    console.log(`✅ Maven is listening.\n`);
  },
};
