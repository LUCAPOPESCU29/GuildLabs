/**
 * "Build a Discord bot" curriculum for the /learn page. Authored as typed,
 * structured blocks (like the guides) so it renders with a fixed component set.
 * All code is runnable discord.js v14 (ESM).
 */

export type LearnBlock =
  | { type: "p"; text: string }
  | { type: "steps"; items: string[] }
  | { type: "code"; code: string; filename?: string; language?: string }
  | { type: "callout"; text: string };

export type Lesson = {
  n: number;
  id: string;
  title: string;
  tagline: string;
  minutes: number;
  blocks: LearnBlock[];
};

export const LESSONS: Lesson[] = [
  {
    n: 0,
    id: "setup",
    title: "Set up your machine",
    tagline: "Node, a Discord app, and a token.",
    minutes: 4,
    blocks: [
      { type: "p", text: "A Discord bot is just a small program that logs into Discord. You need two things: Node.js to run it, and a Discord application to give it an identity." },
      { type: "steps", items: [
        "Install Node.js 20+ from nodejs.org (the LTS build).",
        "Open the Discord Developer Portal → New Application → name it.",
        "Open the Bot tab. Under Privileged Gateway Intents, turn on Server Members Intent and Message Content Intent (you'll need them later).",
        "Copy the Bot Token — treat it like a password. From OAuth2 → General, copy the Client ID.",
      ] },
      { type: "p", text: "Now make a project folder and install discord.js plus dotenv (to read your token from a file)." },
      { type: "code", language: "bash", filename: "terminal", code: "mkdir my-bot && cd my-bot\nnpm init -y\nnpm install discord.js dotenv" },
      { type: "p", text: "Set the project to ES modules and create a .env for your secrets." },
      { type: "code", language: "json", filename: "package.json", code: "{\n  \"type\": \"module\",\n  \"scripts\": { \"start\": \"node index.js\" }\n}" },
      { type: "code", language: "bash", filename: ".env", code: "DISCORD_TOKEN=your_bot_token_here\nCLIENT_ID=your_client_id_here\nGUILD_ID=your_test_server_id" },
      { type: "callout", text: "Never commit your .env. Add a .gitignore with a single line: .env" },
    ],
  },
  {
    n: 1,
    id: "first-bot",
    title: "Your first bot",
    tagline: "Log in and come online.",
    minutes: 3,
    blocks: [
      { type: "p", text: "The smallest possible bot does exactly one thing: it logs in and tells you it's ready. Create index.js with this:" },
      { type: "code", language: "javascript", filename: "index.js", code: "import \"dotenv/config\";\nimport { Client, GatewayIntentBits } from \"discord.js\";\n\nconst client = new Client({ intents: [GatewayIntentBits.Guilds] });\n\nclient.once(\"clientReady\", () => {\n  console.log(`Online as ${client.user.tag}`);\n});\n\nclient.login(process.env.DISCORD_TOKEN);" },
      { type: "p", text: "Run it. The terminal should print your bot's name within a second or two." },
      { type: "code", language: "bash", filename: "terminal", code: "npm start\n# → Online as MyBot#1234" },
      { type: "callout", text: "Seeing \"Online as …\"? That's a real bot connected to Discord's gateway. It's not in a server yet — that's next." },
      { type: "p", text: "Invite it to your test server with this URL (paste your Client ID). Administrator keeps things simple while you learn; you can scope it down later." },
      { type: "code", language: "text", filename: "invite url", code: "https://discord.com/oauth2/authorize?client_id=CLIENT_ID&permissions=8&scope=bot+applications.commands" },
    ],
  },
  {
    n: 2,
    id: "slash-commands",
    title: "Make it respond",
    tagline: "Your first slash command.",
    minutes: 4,
    blocks: [
      { type: "p", text: "Modern bots respond to slash commands. First, register a /ping command with Discord (run this once, and again whenever your commands change)." },
      { type: "code", language: "javascript", filename: "deploy-commands.js", code: "import \"dotenv/config\";\nimport { REST, Routes, SlashCommandBuilder } from \"discord.js\";\n\nconst commands = [\n  new SlashCommandBuilder().setName(\"ping\").setDescription(\"Replies with Pong!\"),\n].map((c) => c.toJSON());\n\nconst rest = new REST().setToken(process.env.DISCORD_TOKEN);\nawait rest.put(\n  Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),\n  { body: commands },\n);\nconsole.log(\"Commands registered.\");" },
      { type: "code", language: "bash", filename: "terminal", code: "node deploy-commands.js" },
      { type: "p", text: "Now handle the command in your bot. Add an interactionCreate listener to index.js:" },
      { type: "code", language: "javascript", filename: "index.js", code: "client.on(\"interactionCreate\", async (interaction) => {\n  if (!interaction.isChatInputCommand()) return;\n\n  if (interaction.commandName === \"ping\") {\n    await interaction.reply(\"Pong! 🏓\");\n  }\n});" },
      { type: "callout", text: "Restart the bot, type /ping in your server, and it replies. You just built the core loop every bot runs on." },
    ],
  },
  {
    n: 3,
    id: "embeds",
    title: "Rich embeds",
    tagline: "Beautiful messages, not plain text.",
    minutes: 3,
    blocks: [
      { type: "p", text: "Plain replies are fine, but embeds are what make bots look polished — titles, colors, and fields. Swap your /ping reply for one:" },
      { type: "code", language: "javascript", filename: "index.js", code: "import { EmbedBuilder } from \"discord.js\";\n\n// inside the interactionCreate handler:\nif (interaction.commandName === \"ping\") {\n  const embed = new EmbedBuilder()\n    .setTitle(\"🏓 Pong!\")\n    .setColor(0x5865f2)\n    .setDescription(\"Your bot is alive and well.\")\n    .addFields(\n      { name: \"Latency\", value: `${client.ws.ping}ms`, inline: true },\n      { name: \"Servers\", value: `${client.guilds.cache.size}`, inline: true },\n    )\n    .setTimestamp();\n\n  await interaction.reply({ embeds: [embed] });\n}" },
      { type: "callout", text: "Want to design embeds visually first? GuildLabs has a free embed builder that exports this exact JSON." },
    ],
  },
  {
    n: 4,
    id: "events",
    title: "React to events",
    tagline: "Welcome new members automatically.",
    minutes: 4,
    blocks: [
      { type: "p", text: "Bots don't only answer commands — they react to things that happen. To greet new members, you need the GuildMembers intent (the one you enabled in step 0). Add it when you create the client:" },
      { type: "code", language: "javascript", filename: "index.js", code: "const client = new Client({\n  intents: [\n    GatewayIntentBits.Guilds,\n    GatewayIntentBits.GuildMembers,\n  ],\n});" },
      { type: "p", text: "Then listen for members joining and post a welcome in the server's system channel:" },
      { type: "code", language: "javascript", filename: "index.js", code: "client.on(\"guildMemberAdd\", (member) => {\n  const channel = member.guild.systemChannel;\n  channel?.send(`Welcome to the server, ${member}! 👋`);\n});" },
      { type: "callout", text: "That's the whole pattern: listen for an event, do something. Reactions, messages, voice — they all work the same way." },
    ],
  },
  {
    n: 5,
    id: "go-further",
    title: "Now read a real one",
    tagline: "Graduate from toy to production.",
    minutes: 2,
    blocks: [
      { type: "p", text: "You've built the core of every Discord bot: log in, register commands, reply with embeds, react to events. The fastest way to get better is to read bots that do real work — and GuildLabs' are open-source and built on exactly these pieces." },
      { type: "p", text: "Download one, open the src/ folder, and you'll recognize everything: the same Client, the same slash-command registration, the same event listeners — just more of them. Tweak it, break it, fix it. That's how it sticks." },
      { type: "callout", text: "Download a finished bot below, run it the same way (npm install, npm start), and start editing." },
    ],
  },
];
