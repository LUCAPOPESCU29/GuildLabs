/**
 * Interactive bot courses. Each course has lessons (interactive coding steps +
 * a quiz), a guided workshop, and a lab (a different bot with less help). The
 * learner writes real JavaScript that runs in a sandbox; `tests` validate it.
 *
 * The code is plain JS (the logic discord.js uses) so it runs in the browser;
 * each course's final lesson shows how the logic wires into discord.js.
 */

import type { QuizQuestion } from "./quizzes";

export type Test = { text: string; check: (logs: string[], code: string) => boolean };

export type ChallengeStep = {
  instructions: string;
  example?: string;
  starter: string;
  solution: string;
  tests: Test[];
};

export type Section = {
  kind: "lesson" | "workshop" | "lab";
  id: string;
  title: string;
  tagline: string;
  steps: ChallengeStep[];
  quiz?: QuizQuestion[];
};

export type Course = {
  slug: string;
  name: string;
  emoji: string;
  tagline: string;
  level: "Beginner" | "Intermediate";
  sections: Section[];
};

const has = (re: RegExp) => (_l: string[], c: string) => re.test(c);
const logs = (fn: (l: string[]) => boolean) => (l: string[]) => fn(l);

// ── Course 1 · Greeter Bot ────────────────────────────────────────────────────
const GREETER: Course = {
  slug: "greeter-bot",
  name: "Greeter Bot",
  emoji: "👋",
  tagline: "Your first bot — it greets people and answers simple commands.",
  level: "Beginner",
  sections: [
    {
      kind: "lesson",
      id: "variables",
      title: "Lesson 1 · Variables & messages",
      tagline: "Store text and print it.",
      steps: [
        {
          instructions:
            "A bot's reply is just text your program builds. In JavaScript you store text in a `variable` with `const`.\n\nDeclare a variable called `botName` set to any name you like, then `console.log` a greeting that includes it, starting with the word `Hello`.",
          example: 'const food = "pizza";\nconsole.log("I love " + food);',
          starter: "// 1. make a const called botName\n\n// 2. log a greeting that starts with \"Hello\" and includes botName\n",
          solution: 'const botName = "Greeter";\nconsole.log("Hello, I am " + botName + "!");',
          tests: [
            { text: "You declared a variable named `botName`", check: has(/\b(const|let)\s+botName\s*=/) },
            { text: "The console prints a line starting with `Hello`", check: logs((l) => l.some((x) => x.startsWith("Hello"))) },
          ],
        },
      ],
      quiz: [
        { id: "q1", q: "Which keyword declares a value that won't change?", options: ["var", "const", "let", "def"], answer: 1, explain: "`const` declares a constant. Use `let` only when the value needs to change." },
        { id: "q2", q: "What does console.log do?", options: ["Sends a Discord message", "Prints output for you to see while developing", "Saves to a database", "Logs the user in"], answer: 1, explain: "console.log prints to the console — your window into what the code is doing." },
      ],
    },
    {
      kind: "lesson",
      id: "conditionals",
      title: "Lesson 2 · Make a decision",
      tagline: "Reply differently with if / else.",
      steps: [
        {
          instructions:
            "Bots decide what to say based on the command. The variable `command` below is set to `\"/hello\"`.\n\nUsing `if` / `else`, `console.log` the word `Hey!` when `command` is `\"/hello\"`, and `Unknown command` otherwise.",
          example: 'if (x === 5) {\n  console.log("five");\n} else {\n  console.log("not five");\n}',
          starter: 'const command = "/hello";\n\n// if command is "/hello" log "Hey!", otherwise log "Unknown command"\n',
          solution: 'const command = "/hello";\n\nif (command === "/hello") {\n  console.log("Hey!");\n} else {\n  console.log("Unknown command");\n}',
          tests: [
            { text: "You used an `if` statement", check: has(/\bif\s*\(/) },
            { text: "It prints `Hey!` for the /hello command", check: logs((l) => l.includes("Hey!")) },
            { text: "It does not print `Unknown command` here", check: logs((l) => !l.includes("Unknown command")) },
          ],
        },
      ],
      quiz: [
        { id: "q1", q: "Which compares two values for equality in JS?", options: ["=", "==", "===", "=>"], answer: 2, explain: "`===` checks value AND type and is the one to use. `=` assigns; `===` compares." },
        { id: "q2", q: "What runs when the `if` condition is false?", options: ["The if block again", "Nothing, unless there's an else block", "The whole program restarts", "It throws an error"], answer: 1, explain: "An optional `else` block runs when the condition is false." },
      ],
    },
    {
      kind: "lesson",
      id: "functions",
      title: "Lesson 3 · A reusable command",
      tagline: "Wrap your reply logic in a function.",
      steps: [
        {
          instructions:
            "Real bots wrap reply logic in a `function` they can call for any command. Write a function `getReply(command)` that returns `\"Hey!\"` when the command is `\"/hello\"`, and `\"???\"` otherwise. Then `console.log(getReply(\"/hello\"))`.",
          example: 'function double(n) {\n  return n * 2;\n}\nconsole.log(double(4)); // 8',
          starter: "// define getReply(command) that returns a string\n\n// then log getReply(\"/hello\")\n",
          solution: 'function getReply(command) {\n  if (command === "/hello") return "Hey!";\n  return "???";\n}\nconsole.log(getReply("/hello"));',
          tests: [
            { text: "You defined a function called `getReply`", check: has(/function\s+getReply\s*\(|getReply\s*=\s*\(/) },
            { text: "`getReply(\"/hello\")` prints `Hey!`", check: logs((l) => l.includes("Hey!")) },
          ],
        },
      ],
      quiz: [
        { id: "q1", q: "What does `return` do in a function?", options: ["Prints to the console", "Sends back a value to whoever called the function", "Ends the whole program", "Loops forever"], answer: 1, explain: "`return` hands a value back to the caller. Without it, a function returns undefined." },
        { id: "q2", q: "In discord.js, where does this getReply logic actually run?", options: ["On page load", "Inside the interactionCreate event, to build interaction.reply()", "In the .env file", "Nowhere — bots can't use functions"], answer: 1, explain: "You call your logic inside the interactionCreate handler and pass the result to interaction.reply()." },
      ],
    },
    {
      kind: "workshop",
      id: "build-greeter",
      title: "Workshop · Build the greeter",
      tagline: "Guided — handle several commands.",
      steps: [
        {
          instructions:
            "Let's build the real thing, step by step. Start your `getReply(command)` function: return `\"Hey there! 👋\"` for `\"/hello\"`. Log `getReply(\"/hello\")`.",
          starter: 'function getReply(command) {\n  // handle "/hello"\n}\n\nconsole.log(getReply("/hello"));',
          solution: 'function getReply(command) {\n  if (command === "/hello") return "Hey there! 👋";\n}\n\nconsole.log(getReply("/hello"));',
          tests: [
            { text: "`getReply(\"/hello\")` returns a greeting with `Hey`", check: logs((l) => l.some((x) => x.includes("Hey"))) },
          ],
        },
        {
          instructions:
            "Now add a second command. Make `getReply` also return `\"Goodbye! 👋\"` for `\"/bye\"`. Log both `getReply(\"/hello\")` and `getReply(\"/bye\")`.",
          starter: 'function getReply(command) {\n  if (command === "/hello") return "Hey there! 👋";\n  // add "/bye"\n}\n\nconsole.log(getReply("/hello"));\nconsole.log(getReply("/bye"));',
          solution: 'function getReply(command) {\n  if (command === "/hello") return "Hey there! 👋";\n  if (command === "/bye") return "Goodbye! 👋";\n}\n\nconsole.log(getReply("/hello"));\nconsole.log(getReply("/bye"));',
          tests: [
            { text: "It greets on `/hello`", check: logs((l) => l.some((x) => x.includes("Hey"))) },
            { text: "It says goodbye on `/bye`", check: logs((l) => l.some((x) => x.toLowerCase().includes("goodbye"))) },
          ],
        },
        {
          instructions:
            "Finally, handle anything else. If the command isn't `/hello` or `/bye`, return `\"I don't know that one.\"`. Test it by logging `getReply(\"/dance\")`.",
          starter: 'function getReply(command) {\n  if (command === "/hello") return "Hey there! 👋";\n  if (command === "/bye") return "Goodbye! 👋";\n  // default reply\n}\n\nconsole.log(getReply("/dance"));',
          solution: 'function getReply(command) {\n  if (command === "/hello") return "Hey there! 👋";\n  if (command === "/bye") return "Goodbye! 👋";\n  return "I don\'t know that one.";\n}\n\nconsole.log(getReply("/dance"));',
          tests: [
            { text: "Unknown commands get a fallback reply", check: logs((l) => l.some((x) => x.toLowerCase().includes("know"))) },
          ],
          example: '// In your real bot this plugs straight in:\nclient.on("interactionCreate", async (i) => {\n  if (!i.isChatInputCommand()) return;\n  await i.reply(getReply("/" + i.commandName));\n});',
        },
      ],
    },
    {
      kind: "lab",
      id: "dice-bot",
      title: "Lab · Build a dice bot",
      tagline: "On your own — less help.",
      steps: [
        {
          instructions:
            "Your turn, with less hand-holding. Write a function `roll()` that returns a random whole number from 1 to 6, and `console.log` the result.\n\nHint: `Math.random()` gives 0–1; `Math.floor()` rounds down.",
          starter: "function roll() {\n  // return a number from 1 to 6\n}\n\nconsole.log(roll());",
          solution: "function roll() {\n  return 1 + Math.floor(Math.random() * 6);\n}\n\nconsole.log(roll());",
          tests: [
            { text: "You defined a `roll` function", check: has(/function\s+roll\s*\(|roll\s*=\s*\(/) },
            { text: "It logs a single number between 1 and 6", check: logs((l) => l.length > 0 && /^[1-6]$/.test(l[l.length - 1].trim())) },
          ],
        },
        {
          instructions:
            "Make it feel like a bot reply. Write `getReply()` that returns the string `\"🎲 You rolled a N\"` where N is a 1–6 roll, and log it.",
          starter: "function getReply() {\n  // return a string like \"🎲 You rolled a 4\"\n}\n\nconsole.log(getReply());",
          solution: 'function getReply() {\n  const n = 1 + Math.floor(Math.random() * 6);\n  return "🎲 You rolled a " + n;\n}\n\nconsole.log(getReply());',
          tests: [
            { text: "It prints a roll message ending in 1–6", check: logs((l) => l.some((x) => /You rolled a [1-6]\b/.test(x))) },
          ],
        },
      ],
    },
  ],
};

export const COURSES: Course[] = [GREETER];

export function getCourse(slug: string): Course | undefined {
  return COURSES.find((c) => c.slug === slug);
}

/** Flattens a course into an ordered list of screens (a step, or a lesson quiz). */
export type Screen =
  | { type: "step"; section: Section; sectionIndex: number; stepIndex: number; step: ChallengeStep }
  | { type: "quiz"; section: Section; sectionIndex: number };

export function flatten(course: Course): Screen[] {
  const out: Screen[] = [];
  course.sections.forEach((section, sectionIndex) => {
    section.steps.forEach((step, stepIndex) =>
      out.push({ type: "step", section, sectionIndex, stepIndex, step })
    );
    if (section.quiz && section.quiz.length) out.push({ type: "quiz", section, sectionIndex });
  });
  return out;
}
