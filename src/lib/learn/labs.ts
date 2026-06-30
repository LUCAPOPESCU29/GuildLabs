export type Lab = {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  goal: string;
  checkpoints: string[];
  hint: string;
  solution: { code: string; filename: string; language: string };
};

export const LABS: Lab[] = [
  {
    id: "dice-sides",
    title: "Roll any die",
    difficulty: "Easy",
    goal: "Extend /roll so the user can choose the number of sides — /roll sides:20 should roll a d20.",
    checkpoints: [
      "Add an integer option called `sides` to the command (default 6).",
      "Read it in the handler with interaction.options.getInteger(\"sides\").",
      "Generate a number between 1 and sides, and reply.",
    ],
    hint: "addIntegerOption((o) => o.setName(\"sides\").setDescription(\"How many sides\")). A missing option returns null, so fall back to 6.",
    solution: {
      filename: "index.js",
      language: "javascript",
      code: `// command def (deploy-commands.js)
new SlashCommandBuilder()
  .setName("roll")
  .setDescription("Roll a die")
  .addIntegerOption((o) =>
    o.setName("sides").setDescription("How many sides").setMinValue(2),
  );

// handler (index.js)
if (interaction.commandName === "roll") {
  const sides = interaction.options.getInteger("sides") ?? 6;
  const n = 1 + Math.floor(Math.random() * sides);
  await interaction.reply(\`🎲 You rolled a \${n} (d\${sides})\`);
}`,
    },
  },
  {
    id: "poll",
    title: "A /poll command",
    difficulty: "Medium",
    goal: "Build /poll question:<text> that posts an embed and adds 👍 / 👎 reactions people can vote with.",
    checkpoints: [
      "Add a required string option `question`.",
      "Reply with an EmbedBuilder containing the question.",
      "Fetch the reply message and react with 👍 and 👎.",
    ],
    hint: "await interaction.reply({ embeds: [embed], fetchReply: true }) returns the message, so you can call .react() on it.",
    solution: {
      filename: "index.js",
      language: "javascript",
      code: `if (interaction.commandName === "poll") {
  const question = interaction.options.getString("question");
  const embed = new EmbedBuilder()
    .setTitle("📊 " + question)
    .setColor(0x5865f2)
    .setFooter({ text: "React to vote" });

  const msg = await interaction.reply({ embeds: [embed], fetchReply: true });
  await msg.react("👍");
  await msg.react("👎");
}`,
    },
  },
  {
    id: "autoreply",
    title: "Keyword auto-reply",
    difficulty: "Medium",
    goal: "Make the bot reply with a link to the rules whenever someone says \"how do I verify\" in any channel.",
    checkpoints: [
      "Enable the MessageContent privileged intent (and add it to your Client).",
      "Listen to the messageCreate event.",
      "Ignore bots, then check message.content and reply if it matches.",
    ],
    hint: "Always `if (message.author.bot) return;` first, or your bot can reply to itself in a loop. Lowercase the content before matching.",
    solution: {
      filename: "index.js",
      language: "javascript",
      code: `const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return;
  if (message.content.toLowerCase().includes("how do i verify")) {
    message.reply("Head to #verify and react ✅ on the pinned message!");
  }
});`,
    },
  },
];
