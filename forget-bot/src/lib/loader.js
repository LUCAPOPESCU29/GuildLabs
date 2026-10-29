import { readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function loadCommands(client) {
  for (const file of readdirSync(join(__dirname, "../commands")).filter((f) => f.endsWith(".js"))) {
    const { default: cmd } = await import(`../commands/${file}`);
    if (cmd?.data && cmd?.execute) {
      client.commands.set(cmd.data.name, cmd);
      console.log(`[CMD] /${cmd.data.name}`);
    }
  }
}

export async function loadEvents(client) {
  for (const file of readdirSync(join(__dirname, "../events")).filter((f) => f.endsWith(".js"))) {
    const { default: ev } = await import(`../events/${file}`);
    const bind = ev.once ? client.once.bind(client) : client.on.bind(client);
    bind(ev.name, (...args) => ev.execute(...args, client));
    console.log(`[EVT] ${ev.name}`);
  }
}
