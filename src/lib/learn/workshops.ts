/**
 * "Choose what your bot does" workshop data. Each behavior carries the code it
 * adds and a simulated terminal demo. Composer functions stitch the selected
 * behaviors into a full index.js / deploy-commands.js and a terminal script.
 * All code is runnable discord.js v14 (ESM).
 */

import type { TermLine } from "@/components/learn/terminal";

export type Behavior = {
  id: string;
  label: string;
  emoji: string;
  desc: string;
  tier: "simple" | "medium";
  /** SlashCommandBuilder expression (omitted for pure events). */
  commandDef?: string;
  /** A 2-space-indented if-block for the interactionCreate handler. */
  handler?: string;
  /** Standalone event code (e.g. guildMemberAdd). */
  eventCode?: string;
  needsMembers?: boolean;
  /** Simulated usage shown in the terminal. */
  demo: TermLine[];
};

export const BEHAVIORS: Behavior[] = [
  {
    id: "hello",
    label: "/hello",
    emoji: "👋",
    desc: "Greets whoever runs it by name.",
    tier: "simple",
    commandDef: `new SlashCommandBuilder().setName("hello").setDescription("Say hi")`,
    handler: `  if (interaction.commandName === "hello") {\n    await interaction.reply(\`Hey there, \${interaction.user}! 👋\`);\n  }`,
    demo: [{ t: "/hello", type: "cmd" }, { t: "Hey there, @you! 👋" }],
  },
  {
    id: "roll",
    label: "/roll",
    emoji: "🎲",
    desc: "Rolls a six-sided die.",
    tier: "simple",
    commandDef: `new SlashCommandBuilder().setName("roll").setDescription("Roll a die")`,
    handler: `  if (interaction.commandName === "roll") {\n    const n = 1 + Math.floor(Math.random() * 6);\n    await interaction.reply(\`🎲 You rolled a \${n}\`);\n  }`,
    demo: [{ t: "/roll", type: "cmd" }, { t: "🎲 You rolled a 4" }],
  },
  {
    id: "flip",
    label: "/flip",
    emoji: "🪙",
    desc: "Flips a coin.",
    tier: "simple",
    commandDef: `new SlashCommandBuilder().setName("flip").setDescription("Flip a coin")`,
    handler: `  if (interaction.commandName === "flip") {\n    const side = Math.random() < 0.5 ? "Heads" : "Tails";\n    await interaction.reply(\`🪙 \${side}!\`);\n  }`,
    demo: [{ t: "/flip", type: "cmd" }, { t: "🪙 Heads!" }],
  },
  {
    id: "eightball",
    label: "/8ball",
    emoji: "🎱",
    desc: "Answers a yes/no question.",
    tier: "simple",
    commandDef: `new SlashCommandBuilder()\n    .setName("8ball")\n    .setDescription("Ask the magic 8-ball")\n    .addStringOption((o) => o.setName("question").setDescription("Your question").setRequired(true))`,
    handler: `  if (interaction.commandName === "8ball") {\n    const answers = ["Without a doubt.", "Ask again later.", "Don't count on it.", "Yes, definitely."];\n    const pick = answers[Math.floor(Math.random() * answers.length)];\n    await interaction.reply(\`🎱 \${pick}\`);\n  }`,
    demo: [{ t: "/8ball question: will it work?", type: "cmd" }, { t: "🎱 Without a doubt." }],
  },
  {
    id: "say",
    label: "/say",
    emoji: "💬",
    desc: "Repeats your text back.",
    tier: "simple",
    commandDef: `new SlashCommandBuilder()\n    .setName("say")\n    .setDescription("Echo some text")\n    .addStringOption((o) => o.setName("text").setDescription("What to say").setRequired(true))`,
    handler: `  if (interaction.commandName === "say") {\n    await interaction.reply(interaction.options.getString("text"));\n  }`,
    demo: [{ t: "/say text: hello world", type: "cmd" }, { t: "hello world" }],
  },
  {
    id: "serverinfo",
    label: "/serverinfo",
    emoji: "📊",
    desc: "Posts a rich embed about the server.",
    tier: "medium",
    commandDef: `new SlashCommandBuilder().setName("serverinfo").setDescription("Show server stats")`,
    handler: `  if (interaction.commandName === "serverinfo") {\n    const { guild } = interaction;\n    const embed = new EmbedBuilder()\n      .setTitle(guild.name)\n      .setColor(0x5865f2)\n      .addFields(\n        { name: "Members", value: \`\${guild.memberCount}\`, inline: true },\n        { name: "Created", value: guild.createdAt.toDateString(), inline: true },\n      );\n    await interaction.reply({ embeds: [embed] });\n  }`,
    demo: [{ t: "/serverinfo", type: "cmd" }, { t: "┌ My Server", type: "out" }, { t: "│ Members: 128 · Created: Mon Jan 01 2024", type: "out" }],
  },
  {
    id: "quote",
    label: "/quote",
    emoji: "🌐",
    desc: "Fetches an inspirational quote from an API.",
    tier: "medium",
    commandDef: `new SlashCommandBuilder().setName("quote").setDescription("Get a random quote")`,
    handler: `  if (interaction.commandName === "quote") {\n    await interaction.deferReply();\n    const res = await fetch("https://api.quotable.io/random");\n    const data = await res.json();\n    await interaction.editReply(\`"\${data.content}" — \${data.author}\`);\n  }`,
    demo: [{ t: "/quote", type: "cmd" }, { t: "fetching api.quotable.io…", type: "comment" }, { t: '"The best way out is always through." — Robert Frost' }],
  },
  {
    id: "welcome",
    label: "Welcome message",
    emoji: "🎉",
    desc: "Greets new members automatically (an event, not a command).",
    tier: "medium",
    needsMembers: true,
    eventCode: `client.on("guildMemberAdd", (member) => {\n  member.guild.systemChannel?.send(\`Welcome to the server, \${member}! 🎉\`);\n});`,
    demo: [{ t: "a new member joins…", type: "comment" }, { t: "Welcome to the server, @newbie! 🎉" }],
  },
];

export function behaviorsFor(tier: "simple" | "medium"): Behavior[] {
  return tier === "simple" ? BEHAVIORS.filter((b) => b.tier === "simple") : BEHAVIORS;
}

const NAME = "MyBot";

/** Full index.js for the selected behaviors. */
export function composeIndex(ids: string[]): string {
  const picked = ids.map((id) => BEHAVIORS.find((b) => b.id === id)).filter((b): b is Behavior => !!b);
  const slash = picked.filter((b) => b.handler);
  const events = picked.filter((b) => b.eventCode);
  const needsMembers = picked.some((b) => b.needsMembers);
  const intents = ["GatewayIntentBits.Guilds", needsMembers ? "GatewayIntentBits.GuildMembers" : null]
    .filter(Boolean)
    .join(", ");

  const lines = [
    `import "dotenv/config";`,
    `import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";`,
    ``,
    `const client = new Client({ intents: [${intents}] });`,
    ``,
    "client.once(\"clientReady\", () => console.log(`Online as ${client.user.tag}`));",
    ``,
    `client.on("interactionCreate", async (interaction) => {`,
    `  if (!interaction.isChatInputCommand()) return;`,
    ...(slash.length ? slash.map((b) => b.handler as string) : ["  // pick a command on the left"]),
    `});`,
  ];
  for (const e of events) lines.push("", e.eventCode as string);
  lines.push("", `client.login(process.env.DISCORD_TOKEN);`);
  return lines.join("\n");
}

/** deploy-commands.js for the selected behaviors. */
export function composeDeploy(ids: string[]): string {
  const defs = ids
    .map((id) => BEHAVIORS.find((b) => b.id === id))
    .filter((b): b is Behavior => !!b && !!b.commandDef)
    .map((b) => `  ${b.commandDef},`);
  return [
    `import "dotenv/config";`,
    `import { REST, Routes, SlashCommandBuilder } from "discord.js";`,
    ``,
    `const commands = [`,
    ...(defs.length ? defs : ["  // pick a command on the left"]),
    `].map((c) => c.toJSON());`,
    ``,
    `const rest = new REST().setToken(process.env.DISCORD_TOKEN);`,
    `await rest.put(`,
    `  Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),`,
    `  { body: commands },`,
    `);`,
    `console.log("Commands registered.");`,
  ].join("\n");
}

/** Simulated terminal script for the selected behaviors. */
export function composeTerminal(ids: string[]): TermLine[] {
  const picked = ids.map((id) => BEHAVIORS.find((b) => b.id === id)).filter((b): b is Behavior => !!b);
  const out: TermLine[] = [
    { t: "npm install", type: "cmd" },
    { t: "added 89 packages in 3s", type: "ok" },
    { t: "node deploy-commands.js", type: "cmd" },
    { t: "Commands registered.", type: "ok" },
    { t: "npm start", type: "cmd" },
    { t: `Online as ${NAME}#4096`, type: "ok" },
  ];
  if (picked.length) {
    out.push({ t: "now try it in Discord", type: "comment" });
    for (const b of picked) out.push(...b.demo);
  } else {
    out.push({ t: "pick at least one behavior on the left", type: "comment" });
  }
  return out;
}
