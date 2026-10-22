import { readdirSync } from "node:fs";
import { join } from "node:path";

const here = import.meta.dirname;

export async function loadCommands(client) {
  const dir = join(here, "../commands");
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".js"))) {
    const { default: command } = await import(`../commands/${file}`);
    if (command?.data && command?.execute) {
      client.commands.set(command.data.name, command);
      console.log(`[CMD] Loaded /${command.data.name}`);
    }
  }
}

export async function loadEvents(client) {
  const dir = join(here, "../events");
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".js"))) {
    const { default: event } = await import(`../events/${file}`);
    if (!event?.name) continue;
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
    console.log(`[EVT] Loaded ${event.name}`);
  }
}
