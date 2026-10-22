import { ActivityType } from "discord.js";
import { registerCommands } from "../lib/register-commands.js";
import { startJobs } from "../jobs/index.js";

export default {
  name: "clientReady",
  once: true,
  async execute(client) {
    const { config, store } = client.beacon;
    console.log(`\n🔦 Beacon online as ${client.user.tag}`);
    console.log(`   Serving ${client.guilds.cache.size} guild(s) · ${store.countPublished()} listed\n`);

    try {
      await registerCommands(client, config);
    } catch (err) {
      console.error("[CMD] Command registration failed:", err.message);
    }

    // A rotating status is the one "announcement" surface that can't be spam.
    const statuses = () => [
      "/beacon setup — get found",
      `${store.countPublished()} servers listed`,
      "ranked by activity, never bumps",
    ];
    let i = 0;
    const rotate = () => {
      const list = statuses();
      client.user.setActivity({ name: list[i++ % list.length], type: ActivityType.Watching });
    };
    rotate();
    setInterval(rotate, 5 * 60_000).unref?.();

    client.beacon.jobs = startJobs(client);
    console.log("✅ Commands registered, jobs scheduled — ready.\n");
  },
};
