export default {
  name: "clientReady",
  once: true,
  async execute(client) {
    console.log(`\n🤖 Forge Bot online as ${client.user.tag}`);
    console.log(`   Serving ${client.guilds.cache.size} guild(s)\n`);
    client.user.setActivity("🔨 Building servers | /setup");
  },
};
