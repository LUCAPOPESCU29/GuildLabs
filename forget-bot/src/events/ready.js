import { Events } from "discord.js";
import { isAiConfigured, MODEL } from "../lib/ai.js";

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`\n🧠 Forget online as ${client.user.tag}`);
    console.log(`   Serving ${client.guilds.cache.size} guild(s)`);
    console.log(`   AI: ${isAiConfigured() ? `enabled (${MODEL})` : "offline mode — set GROQ_API_KEY"}`);
    client.user.setActivity("your server · /forget");
  },
};
