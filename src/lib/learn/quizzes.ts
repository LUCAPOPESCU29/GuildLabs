export type QuizQuestion = {
  id: string;
  q: string;
  options: string[];
  answer: number;
  explain: string;
};

export const BASICS_QUIZ: QuizQuestion[] = [
  {
    id: "intents",
    q: "What are Gateway Intents in discord.js?",
    options: [
      "A list of slash commands your bot supports",
      "Permissions you grant a server admin",
      "The categories of events your bot asks Discord to send it",
      "A paid feature for verified bots",
    ],
    answer: 2,
    explain: "Intents tell Discord which events you want — e.g. GuildMembers to hear about people joining. You only request what you need.",
  },
  {
    id: "token",
    q: "Where should your bot token live?",
    options: [
      "Hard-coded in index.js",
      "In a .env file that's never committed",
      "In your README so you don't lose it",
      "In a public GitHub repo",
    ],
    answer: 1,
    explain: "A token is a password for your bot. Keep it in .env and add .env to .gitignore. If it leaks, reset it in the Developer Portal.",
  },
  {
    id: "commands",
    q: "How do users trigger a modern bot's commands?",
    options: ["By DMing the bot", "Slash commands (e.g. /ping)", "By reacting with emoji", "Only the owner can"],
    answer: 1,
    explain: "Slash commands are the standard. You register them once with the REST API, then handle them in the interactionCreate event.",
  },
  {
    id: "register",
    q: "Which call registers your slash commands with Discord?",
    options: [
      "client.login()",
      "interaction.reply()",
      "rest.put(Routes.applicationGuildCommands(...), { body })",
      "new EmbedBuilder()",
    ],
    answer: 2,
    explain: "You PUT your command definitions to the guild (instant) or global (up to an hour) route. Re-run it whenever your commands change.",
  },
  {
    id: "event",
    q: "Which event fires when someone joins your server?",
    options: ["messageCreate", "guildMemberAdd", "interactionCreate", "ready"],
    answer: 1,
    explain: "guildMemberAdd fires on join — perfect for welcome messages. It needs the GuildMembers privileged intent enabled.",
  },
];
