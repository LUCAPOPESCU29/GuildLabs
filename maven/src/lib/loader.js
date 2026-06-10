import { readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function loadCommands(client) {
  const commandsPath = join(__dirname, "../commands");
  const files = readdirSync(commandsPath).filter((f) => f.endsWith(".js"));
  for (const file of files) {
    const { default: command } = await import(`../commands/${file}`);
    if (command?.data && command?.execute) {
      client.commands.set(command.data.name, command);
      console.log(`[CMD] Loaded /${command.data.name}`);
    }
  }
}

export async function loadEvents(client) {
  const eventsPath = join(__dirname, "../events");
  const files = readdirSync(eventsPath).filter((f) => f.endsWith(".js"));
  for (const file of files) {
    const { default: event } = await import(`../events/${file}`);
    if (event?.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
    console.log(`[EVT] Loaded ${event.name}`);
  }
}
