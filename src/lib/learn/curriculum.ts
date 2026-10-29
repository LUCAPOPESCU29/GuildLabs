/**
 * Interactive bot courses. Each course has lessons (interactive coding steps +
 * a quiz), a guided workshop, and a lab (a different bot with less help). The
 * learner writes real JavaScript that runs in a sandbox; `tests` validate it.
 *
 * The code is plain JS (the logic discord.js uses) so it runs in the browser;
 * each course's final lesson shows how the logic wires into discord.js.
 */

import type { QuizQuestion } from "./quizzes";

export type Test = { text: string; check: (logs: string[], code: string) => boolean; hint?: string };

export type ChallengeStep = {
  instructions: string;
  example?: string;
  starter: string;
  solution: string;
  tests: Test[];
  hints?: string[];
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
  level: "Beginner" | "Intermediate" | "Advanced";
  hours: string;
  topics: string[];
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
  hours: "1–2 hrs",
  topics: ["variables", "if / else", "functions"],
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

// ── Course 2 · Moderation Bot ─────────────────────────────────────────────────
const MODBOT: Course = {
  slug: "moderation-bot",
  name: "Moderation Bot",
  emoji: "🛡️",
  tagline: "Track warnings, filter bad words, and auto-kick repeat offenders.",
  level: "Intermediate",
  hours: "2–3 hrs",
  topics: ["arrays", "objects", "string filtering"],
  sections: [
    {
      kind: "lesson",
      id: "arrays",
      title: "Lesson 1 · Arrays & warning lists",
      tagline: "Store multiple values and add to them.",
      steps: [
        {
          instructions:
            "Moderation bots keep lists — warned users, banned words, audit logs. In JavaScript a list is called an `Array`.\n\nCreate a `const warnings = []` (empty array). Use `warnings.push(\"User#1234 - Spam\")` to add a warning, then `console.log(warnings.length)` to see how many there are.",
          example: 'const fruits = [];\nfruits.push("apple");\nfruits.push("banana");\nconsole.log(fruits.length); // 2',
          starter: "// 1. create an empty warnings array\n\n// 2. push one warning string into it\n\n// 3. log warnings.length\n",
          solution: 'const warnings = [];\nwarnings.push("User#1234 - Spam");\nconsole.log(warnings.length);',
          tests: [
            { text: "You created an array called `warnings`", check: has(/\b(const|let)\s+warnings\s*=\s*\[/) },
            { text: "You used `.push()`", check: has(/\.push\s*\(/) },
            { text: "It logs `1`", check: logs((l) => l.includes("1")) },
          ],
        },
        {
          instructions:
            "Now check if a user is already in the list. Use `warnings.includes(value)` — it returns `true` or `false`.\n\nPush `\"User#5678\"` into `warnings`, then `console.log` whether `warnings.includes(\"User#5678\")` — it should print `true`.",
          example: 'const list = ["alpha", "beta"];\nconsole.log(list.includes("alpha")); // true\nconsole.log(list.includes("gamma")); // false',
          starter: 'const warnings = [];\n\n// push "User#5678" into warnings\n\n// log whether warnings includes "User#5678"\n',
          solution: 'const warnings = [];\nwarnings.push("User#5678");\nconsole.log(warnings.includes("User#5678"));',
          tests: [
            { text: "You used `.includes()`", check: has(/\.includes\s*\(/) },
            { text: "It logs `true`", check: logs((l) => l.includes("true")) },
          ],
        },
      ],
      quiz: [
        { id: "q1", q: "What does `array.push(value)` do?", options: ["Removes the last item", "Adds a value to the end of the array", "Sorts the array", "Returns the array length"], answer: 1, explain: "`.push()` appends to the end. Use `.pop()` to remove from the end, `.shift()` to remove from the front." },
        { id: "q2", q: "What does `array.includes('x')` return?", options: ["The index of 'x'", "A new array without 'x'", "true if 'x' is in the array, false otherwise", "The count of 'x' in the array"], answer: 2, explain: "`.includes()` returns a boolean — fast and readable for existence checks." },
        { id: "q3", q: "In a moderation bot, what's the best use for an array?", options: ["Storing a single user's warning count", "A list of warned users or banned words", "A bot config with named settings", "The bot's Discord token"], answer: 1, explain: "Arrays shine for ordered lists of the same kind of thing — like a banned-words list or an audit log." },
      ],
    },
    {
      kind: "lesson",
      id: "objects",
      title: "Lesson 2 · Objects & user records",
      tagline: "Group related data with named keys.",
      steps: [
        {
          instructions:
            "An array holds a list, but each warning needs more info — *who*, *why*, *when*. That's a job for an **object**: `{ key: value }` pairs.\n\nCreate a `const record` object with three keys: `userId` (a string), `reason` (a string), and `count` (a number). Log `record.reason`.",
          example: 'const dog = { name: "Rex", breed: "Lab", age: 3 };\nconsole.log(dog.name); // Rex',
          starter: "// create a record object with userId, reason, and count\n\n// log record.reason\n",
          solution: 'const record = { userId: "User#1234", reason: "Spam", count: 1 };\nconsole.log(record.reason);',
          tests: [
            { text: "You created an object with `userId`, `reason`, and `count`", check: has(/userId[\s\S]*reason[\s\S]*count|reason[\s\S]*userId[\s\S]*count/) },
            { text: "You logged `record.reason`", check: has(/console\.log\s*\(\s*record\.reason\s*\)/) },
            { text: "Something is printed", check: logs((l) => l.length > 0) },
          ],
        },
        {
          instructions:
            "Objects can be stored inside other objects, or inside arrays. Build a `warnings` object (not an array this time) where keys are user IDs and values are warning counts — like a lookup table.\n\nSet `warnings[\"User#1234\"] = 2`, then log it.",
          example: 'const scores = {};\nscores["Alice"] = 10;\nscores["Bob"] = 7;\nconsole.log(scores["Alice"]); // 10',
          starter: 'const warnings = {};\n\n// set warnings["User#1234"] = 2\n\n// log warnings["User#1234"]\n',
          solution: 'const warnings = {};\nwarnings["User#1234"] = 2;\nconsole.log(warnings["User#1234"]);',
          tests: [
            { text: "You used bracket notation to set a value", check: has(/warnings\s*\[/) },
            { text: "It logs `2`", check: logs((l) => l.includes("2")) },
          ],
        },
      ],
      quiz: [
        { id: "q1", q: "How do you access the `name` property of an object `user`?", options: ["user[name]", "user->name", "user.name or user[\"name\"]", "get(user, name)"], answer: 2, explain: "Both dot notation (`user.name`) and bracket notation (`user[\"name\"]`) work. Bracket notation is required when the key is dynamic (e.g. `user[someVar]`)." },
        { id: "q2", q: "What's the best structure to store per-user warning counts keyed by user ID?", options: ["A plain array", "An object (dictionary)", "A number", "A string"], answer: 1, explain: "An object acting as a lookup table — `{ 'User#1234': 2 }` — gives you O(1) lookups by ID." },
        { id: "q3", q: "How do you add a new key to an existing object?", options: ["object.push(key, value)", "object.add(key, value)", "object.key = value  or  object[key] = value", "Object.append(object, key, value)"], answer: 2, explain: "You assign directly: `obj.newKey = value` or `obj['newKey'] = value`." },
      ],
    },
    {
      kind: "lesson",
      id: "filters",
      title: "Lesson 3 · Filtering & banned words",
      tagline: "Scan messages and censor bad content.",
      steps: [
        {
          instructions:
            "Most moderation bots scan messages for banned words. `String.includes()` checks if a word appears. Write `containsBannedWord(text, banned)` that returns `true` if any word in the `banned` array is found in `text` (case-insensitive).\n\nUse `Array.some()` + `String.toLowerCase()`.",
          example: 'const words = ["spam", "junk"];\nconst found = words.some(w => "I love spam".toLowerCase().includes(w));\nconsole.log(found); // true',
          starter: "function containsBannedWord(text, banned) {\n  // return true if text contains any word in banned\n}\n\nconsole.log(containsBannedWord(\"This is spam!\", [\"spam\", \"junk\"]));\nconsole.log(containsBannedWord(\"Hello there\", [\"spam\", \"junk\"]));",
          solution: "function containsBannedWord(text, banned) {\n  return banned.some(w => text.toLowerCase().includes(w.toLowerCase()));\n}\n\nconsole.log(containsBannedWord(\"This is spam!\", [\"spam\", \"junk\"]));\nconsole.log(containsBannedWord(\"Hello there\", [\"spam\", \"junk\"]));",
          tests: [
            { text: "You defined `containsBannedWord`", check: has(/function\s+containsBannedWord|containsBannedWord\s*=/) },
            { text: "It returns `true` for a message with a banned word", check: logs((l) => l[0] === "true") },
            { text: "It returns `false` for a clean message", check: logs((l) => l[1] === "false") },
          ],
        },
        {
          instructions:
            "Now censor the message. Write `censorMessage(text, banned)` that replaces each banned word with `***` in the text. Return the cleaned string and log it.\n\nHint: Use a `for...of` loop and `String.split().join()` or `String.replace()`. Use `new RegExp(word, 'gi')` for case-insensitive replace.",
          example: 'let msg = "I hate spam";\nmsg = msg.replace(new RegExp("spam", "gi"), "***");\nconsole.log(msg); // I hate ***',
          starter: "function censorMessage(text, banned) {\n  let result = text;\n  // replace each banned word with ***\n  return result;\n}\n\nconsole.log(censorMessage(\"Stop the SPAM now\", [\"spam\"]));",
          solution: 'function censorMessage(text, banned) {\n  let result = text;\n  for (const word of banned) {\n    result = result.replace(new RegExp(word, "gi"), "***");\n  }\n  return result;\n}\n\nconsole.log(censorMessage("Stop the SPAM now", ["spam"]));',
          tests: [
            { text: "You defined `censorMessage`", check: has(/function\s+censorMessage|censorMessage\s*=/) },
            { text: "The output contains `***`", check: logs((l) => l.some((x) => x.includes("***"))) },
            { text: "The output does not contain `SPAM` or `spam`", check: logs((l) => l.every((x) => !/\bspam\b/i.test(x))) },
          ],
        },
      ],
      quiz: [
        { id: "q1", q: "What does `array.some(fn)` return?", options: ["Every element that matches", "true if at least one element passes the test", "The first matching element", "A new filtered array"], answer: 1, explain: "`.some()` short-circuits and returns true as soon as one element passes — perfect for 'does any banned word appear?' checks." },
        { id: "q2", q: "Why use `new RegExp(word, 'gi')` instead of `text.replace(word, '***')`?", options: ["Regex is always faster", "The string overload only replaces the first match; regex with /g replaces all. /i makes it case-insensitive.", "`.replace()` doesn't exist on strings", "RegExp handles emoji better"], answer: 1, explain: "Without /g, `.replace()` stops after the first match. Adding /g replaces every occurrence; /i makes it case-insensitive." },
        { id: "q3", q: "Where in discord.js would you call `censorMessage`?", options: ["In the ready event", "In the messageCreate event before forwarding the content", "In the guildMemberAdd event", "In the .env file"], answer: 1, explain: "You'd listen on `messageCreate`, check the message content, then delete-and-repost a censored version (or timeout the member)." },
      ],
    },
    {
      kind: "workshop",
      id: "build-modbot",
      title: "Workshop · Build the moderation system",
      tagline: "Guided — warnings, auto-kick, audit log.",
      steps: [
        {
          instructions:
            "Start with the warning store. Create a `warnings` object (empty `{}`). Write `warnUser(userId, reason)` that:\n1. Sets `warnings[userId]` to the current count + 1 (start at 0 if not set yet)\n2. Logs `\"⚠️ userId warned (N): reason\"` where N is the new count.\n\nCall `warnUser(\"User#99\", \"Spam\")` twice.",
          starter: 'const warnings = {};\n\nfunction warnUser(userId, reason) {\n  // increment warnings[userId] (default 0)\n  // log "⚠️ <userId> warned (<count>): <reason>"\n}\n\nwarnUser("User#99", "Spam");\nwarnUser("User#99", "Spam again");',
          solution: 'const warnings = {};\n\nfunction warnUser(userId, reason) {\n  warnings[userId] = (warnings[userId] || 0) + 1;\n  console.log("⚠️ " + userId + " warned (" + warnings[userId] + "): " + reason);\n}\n\nwarnUser("User#99", "Spam");\nwarnUser("User#99", "Spam again");',
          tests: [
            { text: "You defined `warnUser`", check: has(/function\s+warnUser|warnUser\s*=/) },
            { text: "First call logs count 1", check: logs((l) => l.some((x) => /warned \(1\)/.test(x))) },
            { text: "Second call logs count 2", check: logs((l) => l.some((x) => /warned \(2\)/.test(x))) },
          ],
        },
        {
          instructions:
            "Now add auto-kick logic. Write `shouldKick(userId)` that returns `true` if a user has 3 or more warnings.\n\nThen update `warnUser` to call `shouldKick` after incrementing, and if it returns true, log `\"🔨 Kicking userId — too many warnings\"`.\n\nTest with 3 calls to `warnUser` for the same user.",
          starter: 'const warnings = {};\n\nfunction shouldKick(userId) {\n  // return true if warnings[userId] >= 3\n}\n\nfunction warnUser(userId, reason) {\n  warnings[userId] = (warnings[userId] || 0) + 1;\n  console.log("⚠️ " + userId + " warned (" + warnings[userId] + "): " + reason);\n  // if shouldKick, log the kick message\n}\n\nwarnUser("User#99", "Spam");\nwarnUser("User#99", "Spam");\nwarnUser("User#99", "Spam");',
          solution: 'const warnings = {};\n\nfunction shouldKick(userId) {\n  return (warnings[userId] || 0) >= 3;\n}\n\nfunction warnUser(userId, reason) {\n  warnings[userId] = (warnings[userId] || 0) + 1;\n  console.log("⚠️ " + userId + " warned (" + warnings[userId] + "): " + reason);\n  if (shouldKick(userId)) {\n    console.log("🔨 Kicking " + userId + " — too many warnings");\n  }\n}\n\nwarnUser("User#99", "Spam");\nwarnUser("User#99", "Spam");\nwarnUser("User#99", "Spam");',
          tests: [
            { text: "You defined `shouldKick`", check: has(/function\s+shouldKick|shouldKick\s*=/) },
            { text: "A kick message is logged on the 3rd warning", check: logs((l) => l.some((x) => /Kick/i.test(x))) },
          ],
        },
        {
          instructions:
            "Add an audit log. Create `const auditLog = []`. Every time `warnUser` is called, push an object `{ userId, reason, count }` into `auditLog`. At the end, log `auditLog.length + \" entries in audit log\"`.\n\nTest with 2 different users, 2 warns each.",
          starter: 'const warnings = {};\nconst auditLog = [];\n\nfunction warnUser(userId, reason) {\n  warnings[userId] = (warnings[userId] || 0) + 1;\n  // push { userId, reason, count: warnings[userId] } into auditLog\n  console.log("⚠️ " + userId + " warned (" + warnings[userId] + "): " + reason);\n}\n\nwarnUser("Alice", "Flood");\nwarnUser("Bob", "Spam");\nwarnUser("Alice", "Flood again");\nwarnUser("Bob", "Spam again");\n\n// log how many entries are in the audit log',
          solution: 'const warnings = {};\nconst auditLog = [];\n\nfunction warnUser(userId, reason) {\n  warnings[userId] = (warnings[userId] || 0) + 1;\n  auditLog.push({ userId, reason, count: warnings[userId] });\n  console.log("⚠️ " + userId + " warned (" + warnings[userId] + "): " + reason);\n}\n\nwarnUser("Alice", "Flood");\nwarnUser("Bob", "Spam");\nwarnUser("Alice", "Flood again");\nwarnUser("Bob", "Spam again");\n\nconsole.log(auditLog.length + " entries in audit log");',
          tests: [
            { text: "You used `auditLog.push(...)`", check: has(/auditLog\.push\s*\(/) },
            { text: "It logs `4 entries in audit log`", check: logs((l) => l.some((x) => x.includes("4 entries"))) },
          ],
          example: '// In your real bot:\nclient.on("interactionCreate", async (i) => {\n  if (i.commandName === "warn") {\n    const target = i.options.getUser("user");\n    const reason = i.options.getString("reason");\n    warnUser(target.id, reason);\n    if (shouldKick(target.id)) await i.guild.members.kick(target);\n    await i.reply("Warned " + target.username);\n  }\n});',
        },
      ],
    },
    {
      kind: "lab",
      id: "filter-bot",
      title: "Lab · Word Filter Bot",
      tagline: "On your own — censor and warn in one system.",
      steps: [
        {
          instructions:
            "Build `filterMessage(text, bannedWords)` that returns the text with each banned word replaced by `***`. No hints this time.\n\nTest it: `filterMessage(\"Stop the spam and toxic talk\", [\"spam\", \"toxic\"])` should output `\"Stop the *** and *** talk\"`.",
          starter: 'function filterMessage(text, bannedWords) {\n  // replace each banned word with ***\n}\n\nconsole.log(filterMessage("Stop the spam and toxic talk", ["spam", "toxic"]));',
          solution: 'function filterMessage(text, bannedWords) {\n  let result = text;\n  for (const word of bannedWords) {\n    result = result.replace(new RegExp(word, "gi"), "***");\n  }\n  return result;\n}\n\nconsole.log(filterMessage("Stop the spam and toxic talk", ["spam", "toxic"]));',
          hints: [
            "Keep a `let result = text;` you can reassign as you replace each word.",
            "Loop over `bannedWords` with `for (const word of bannedWords)` and replace each one.",
            "Use `new RegExp(word, \"gi\")` so every occurrence is replaced, case-insensitively.",
          ],
          tests: [
            { text: "You defined `filterMessage`", check: has(/function\s+filterMessage|filterMessage\s*=/) },
            { text: "The output contains `***` twice", check: logs((l) => { const m = l.join(" ").match(/\*\*\*/g); return m !== null && m.length >= 2; }) },
            { text: "`spam` and `toxic` are gone", check: logs((l) => l.every((x) => !/\b(spam|toxic)\b/i.test(x))) },
          ],
        },
        {
          instructions:
            "Now wire it into a `handleMessage(userId, text, bannedWords)` function that:\n1. Calls `filterMessage` on the text\n2. If the text changed (bad words found), increments a warnings counter for the user and logs `\"[WARN] userId (N warns): cleaned text\"`\n3. Otherwise logs `\"[OK] userId: original text\"`\n\nTest with two messages — one clean, one with a banned word.",
          starter: 'const userWarns = {};\n\nfunction filterMessage(text, bannedWords) {\n  let result = text;\n  for (const word of bannedWords) {\n    result = result.replace(new RegExp(word, "gi"), "***");\n  }\n  return result;\n}\n\nfunction handleMessage(userId, text, bannedWords) {\n  // filter, compare, warn or ok\n}\n\nconst BANNED = ["spam", "toxic"];\nhandleMessage("Alice", "Hello everyone!", BANNED);\nhandleMessage("Bob", "Stop the spam", BANNED);',
          solution: 'const userWarns = {};\n\nfunction filterMessage(text, bannedWords) {\n  let result = text;\n  for (const word of bannedWords) {\n    result = result.replace(new RegExp(word, "gi"), "***");\n  }\n  return result;\n}\n\nfunction handleMessage(userId, text, bannedWords) {\n  const clean = filterMessage(text, bannedWords);\n  if (clean !== text) {\n    userWarns[userId] = (userWarns[userId] || 0) + 1;\n    console.log("[WARN] " + userId + " (" + userWarns[userId] + " warns): " + clean);\n  } else {\n    console.log("[OK] " + userId + ": " + text);\n  }\n}\n\nconst BANNED = ["spam", "toxic"];\nhandleMessage("Alice", "Hello everyone!", BANNED);\nhandleMessage("Bob", "Stop the spam", BANNED);',
          hints: [
            "Call `filterMessage(text, bannedWords)` first and store the result in `clean`.",
            "Compare `clean !== text` — if they differ, a banned word was found, so warn; otherwise it's OK.",
            "Increment the per-user count with `userWarns[userId] = (userWarns[userId] || 0) + 1;`.",
          ],
          tests: [
            { text: "You defined `handleMessage`", check: has(/function\s+handleMessage|handleMessage\s*=/) },
            { text: "Alice's message logs `[OK]`", check: logs((l) => l.some((x) => x.startsWith("[OK]") && x.includes("Alice"))) },
            { text: "Bob's message logs `[WARN]` with `***`", check: logs((l) => l.some((x) => x.startsWith("[WARN]") && x.includes("***"))) },
          ],
        },
      ],
    },
  ],
};

// ── Course 3 · Under the Hood ─────────────────────────────────────────────────
const UNDER_THE_HOOD: Course = {
  slug: "how-bots-work",
  name: "Under the Hood",
  emoji: "⚙️",
  tagline: "How bots are built, what language they run in, and how they stay online 24/7.",
  level: "Beginner",
  hours: "1–2 hrs",
  topics: ["gateway", "events", "hosting"],
  sections: [
    {
      kind: "lesson",
      id: "languages",
      title: "Lesson 1 · Languages & libraries",
      tagline: "What code actually powers a bot.",
      steps: [
        {
          instructions:
            "A bot is just a program that talks to Discord's API. The most popular language for bots is **JavaScript** (with the `discord.js` library), but Python (`discord.py`), Go, and Rust are also used.\n\nYou pick a language, use its Discord library, and the library handles the low-level API calls.\n\nWrite a `botConfig` object with three keys:\n- `language`: `\"JavaScript\"`\n- `library`: `\"discord.js\"`\n- `version`: `\"14\"`\n\nThen log `botConfig.library + \" v\" + botConfig.version`.",
          example: 'const config = { language: "Python", library: "discord.py", version: "2.3" };\nconsole.log(config.language); // Python',
          starter: "// create a botConfig object with language, library, and version\n\n// log library + \" v\" + version\n",
          solution: 'const botConfig = { language: "JavaScript", library: "discord.js", version: "14" };\nconsole.log(botConfig.library + " v" + botConfig.version);',
          tests: [
            { text: "You created `botConfig` with `language`, `library`, and `version`", check: has(/botConfig\s*=\s*\{[\s\S]*language[\s\S]*library[\s\S]*version/) },
            { text: "It logs something with `v` in it", check: logs((l) => l.some((x) => x.includes("v"))) },
          ],
        },
        {
          instructions:
            "Different languages have different trade-offs. Write a function `compareLibraries()` that logs three lines — one for each library — in the format `\"<library>: <one-word trait>\"`.\n\nFor example: `\"discord.js: popular\"`, `\"discord.py: readable\"`, `\"discordgo: fast\"`.\n\nUse an array of objects and loop over it with `.forEach()`.",
          example: 'const items = [{ name: "A" }, { name: "B" }];\nitems.forEach(item => console.log(item.name));',
          starter: "function compareLibraries() {\n  const libs = [\n    // add 3 objects with name and trait keys\n  ];\n  libs.forEach(lib => {\n    // log lib.name + \": \" + lib.trait\n  });\n}\n\ncompareLibraries();",
          solution: 'function compareLibraries() {\n  const libs = [\n    { name: "discord.js", trait: "popular" },\n    { name: "discord.py", trait: "readable" },\n    { name: "discordgo", trait: "fast" },\n  ];\n  libs.forEach(lib => console.log(lib.name + ": " + lib.trait));\n}\n\ncompareLibraries();',
          tests: [
            { text: "You defined `compareLibraries`", check: has(/function\s+compareLibraries|compareLibraries\s*=/) },
            { text: "You used `.forEach()`", check: has(/\.forEach\s*\(/) },
            { text: "It logs 3 lines", check: logs((l) => l.length >= 3) },
          ],
        },
      ],
      quiz: [
        { id: "q1", q: "Which is the most widely used Discord bot library?", options: ["discord.py", "discord.js", "discordgo", "JDA (Java)"], answer: 1, explain: "discord.js (JavaScript/Node.js) has the largest community, most examples, and the most active maintenance." },
        { id: "q2", q: "What does a Discord library actually do for you?", options: ["It hosts your bot for free", "It wraps the raw HTTP and WebSocket API so you write events and commands instead of network code", "It writes the bot for you automatically", "It replaces Node.js"], answer: 1, explain: "Libraries like discord.js handle the WebSocket connection, rate limits, caching, and expose clean classes like `Client`, `Message`, and `Guild`." },
        { id: "q3", q: "If you want the fastest possible bot and you know systems programming, which language would you pick?", options: ["JavaScript", "Python", "Go or Rust", "Java"], answer: 2, explain: "Go and Rust compile to native code with no GC pauses — ideal for high-throughput bots. But JS/Python are easier to start with." },
      ],
    },
    {
      kind: "lesson",
      id: "gateway",
      title: "Lesson 2 · The Gateway & events",
      tagline: "How your bot hears what happens in Discord.",
      steps: [
        {
          instructions:
            "Discord sends events to your bot over a **WebSocket** called the **Gateway**. Your bot connects once and keeps the socket open. Every time something happens — a message, a member joining, a reaction — Discord pushes an event payload to your bot.\n\nSimulate this with an event dispatcher. Write `dispatch(event, data)` that logs `\"→ event: \" + JSON.stringify(data)`.\n\nCall it with `\"MESSAGE_CREATE\"` and `{ author: \"Alice\", content: \"hi\" }`.",
          example: 'function dispatch(event, data) {\n  console.log("→ " + event + ": " + JSON.stringify(data));\n}\ndispatch("READY", { user: "MyBot#0001" });',
          starter: "function dispatch(event, data) {\n  // log \"→ event: \" + JSON.stringify(data)\n}\n\ndispatch(\"MESSAGE_CREATE\", { author: \"Alice\", content: \"hi\" });",
          solution: 'function dispatch(event, data) {\n  console.log("→ " + event + ": " + JSON.stringify(data));\n}\n\ndispatch("MESSAGE_CREATE", { author: "Alice", content: "hi" });',
          tests: [
            { text: "You defined `dispatch`", check: has(/function\s+dispatch|dispatch\s*=/) },
            { text: "Output starts with `→`", check: logs((l) => l.some((x) => x.startsWith("→"))) },
            { text: "Output contains `MESSAGE_CREATE`", check: logs((l) => l.some((x) => x.includes("MESSAGE_CREATE"))) },
          ],
        },
        {
          instructions:
            "Real bots register **event handlers** — functions that run when a specific event fires. Build a simple event bus:\n\n1. Create `const handlers = {}` (an object)\n2. Write `on(event, fn)` that pushes `fn` into `handlers[event]` (an array)\n3. Write `emit(event, data)` that calls every function in `handlers[event]` with `data`\n\nRegister a handler for `\"MESSAGE_CREATE\"` that logs `\"New message from: \" + data.author`, then emit that event.",
          example: '// Node.js EventEmitter works exactly like this under the hood\nconst handlers = {};\nfunction on(e, fn) {\n  handlers[e] = handlers[e] || [];\n  handlers[e].push(fn);\n}',
          starter: 'const handlers = {};\n\nfunction on(event, fn) {\n  // push fn into handlers[event]\n}\n\nfunction emit(event, data) {\n  // call every fn in handlers[event] with data\n}\n\non("MESSAGE_CREATE", (data) => {\n  console.log("New message from: " + data.author);\n});\n\nemit("MESSAGE_CREATE", { author: "Alice", content: "hi" });',
          solution: 'const handlers = {};\n\nfunction on(event, fn) {\n  handlers[event] = handlers[event] || [];\n  handlers[event].push(fn);\n}\n\nfunction emit(event, data) {\n  (handlers[event] || []).forEach(fn => fn(data));\n}\n\non("MESSAGE_CREATE", (data) => {\n  console.log("New message from: " + data.author);\n});\n\nemit("MESSAGE_CREATE", { author: "Alice", content: "hi" });',
          tests: [
            { text: "You defined `on` and `emit`", check: has(/function\s+on\s*\([\s\S]*function\s+emit\s*\(|function\s+emit[\s\S]*function\s+on/) },
            { text: "It logs a message mentioning Alice", check: logs((l) => l.some((x) => x.includes("Alice"))) },
          ],
        },
      ],
      quiz: [
        { id: "q1", q: "How does Discord send events to your bot?", options: ["Your bot polls an HTTP endpoint every second", "Discord pushes events over a persistent WebSocket (the Gateway)", "You call a function and wait for a return value", "Discord emails your server"], answer: 1, explain: "The Gateway is a WebSocket connection your bot holds open. Discord pushes events instantly — no polling needed." },
        { id: "q2", q: "What are Gateway Intents?", options: ["Paid features for verified bots", "Permissions required to run slash commands", "Flags you set to tell Discord which event categories to send you", "The OAuth2 scopes your bot requests"], answer: 2, explain: "Intents filter which events you receive. `GuildMessages` gets you message events; `GuildMembers` (a privileged intent) lets you hear about member joins." },
        { id: "q3", q: "What does `client.on('interactionCreate', handler)` do in discord.js?", options: ["Sends a message to a channel", "Registers a function to run every time someone uses a slash command or button", "Connects the bot to the Gateway", "Logs the bot in"], answer: 1, explain: "`.on()` registers an event listener. `interactionCreate` fires for slash commands, buttons, select menus, and modals." },
      ],
    },
    {
      kind: "lesson",
      id: "hosting",
      title: "Lesson 3 · Hosting & uptime",
      tagline: "How bots stay online around the clock.",
      steps: [
        {
          instructions:
            "A bot running on your laptop goes offline when you close the lid. For 24/7 uptime you need a **server** — a computer that never sleeps.\n\nCommon options:\n- **VPS** (Virtual Private Server): DigitalOcean, Linode — full control, cheapest long-term\n- **PaaS** (Platform as a Service): Railway, Render, Heroku — easy deploys, handles infra for you\n- **Containers**: Docker + Fly.io — package your bot + runtime, run anywhere\n\nWrite a `pickHosting(budget, techLevel)` function. If budget is `\"low\"` and techLevel is `\"beginner\"`, return `\"Railway\"`. If techLevel is `\"advanced\"`, return `\"VPS\"`. Otherwise return `\"Render\"`.\n\nLog the result for `(\"low\", \"beginner\")` and `(\"medium\", \"advanced\")`.",
          example: 'function recommend(criteria) {\n  if (criteria === "simple") return "PaaS";\n  return "VPS";\n}',
          starter: 'function pickHosting(budget, techLevel) {\n  // return "Railway", "VPS", or "Render" based on the inputs\n}\n\nconsole.log(pickHosting("low", "beginner"));\nconsole.log(pickHosting("medium", "advanced"));',
          solution: 'function pickHosting(budget, techLevel) {\n  if (budget === "low" && techLevel === "beginner") return "Railway";\n  if (techLevel === "advanced") return "VPS";\n  return "Render";\n}\n\nconsole.log(pickHosting("low", "beginner"));\nconsole.log(pickHosting("medium", "advanced"));',
          tests: [
            { text: "You defined `pickHosting`", check: has(/function\s+pickHosting|pickHosting\s*=/) },
            { text: "It returns `Railway` for low budget beginner", check: logs((l) => l[0] === "Railway") },
            { text: "It returns `VPS` for advanced level", check: logs((l) => l[1] === "VPS") },
          ],
        },
        {
          instructions:
            "Before deploying, you need to check that all required environment variables are set. In a real bot these live in a `.env` file: `TOKEN`, `CLIENT_ID`, `GUILD_ID`.\n\nWrite `validateEnv(env)` that takes an object and checks for those three keys. If any are missing, log `\"Missing: key\"` for each one. If all present, log `\"✅ Ready to deploy\"`.\n\nTest with `{ TOKEN: \"abc\", CLIENT_ID: \"123\" }` (missing `GUILD_ID`).",
          example: 'const required = ["A", "B"];\nrequired.forEach(k => {\n  if (!env[k]) console.log("Missing: " + k);\n});',
          starter: 'function validateEnv(env) {\n  const required = ["TOKEN", "CLIENT_ID", "GUILD_ID"];\n  // log "Missing: key" for each missing key\n  // log "✅ Ready to deploy" if all present\n}\n\nvalidateEnv({ TOKEN: "abc", CLIENT_ID: "123" });',
          solution: 'function validateEnv(env) {\n  const required = ["TOKEN", "CLIENT_ID", "GUILD_ID"];\n  const missing = required.filter(k => !env[k]);\n  if (missing.length > 0) {\n    missing.forEach(k => console.log("Missing: " + k));\n  } else {\n    console.log("✅ Ready to deploy");\n  }\n}\n\nvalidateEnv({ TOKEN: "abc", CLIENT_ID: "123" });',
          tests: [
            { text: "You defined `validateEnv`", check: has(/function\s+validateEnv|validateEnv\s*=/) },
            { text: "It logs `Missing: GUILD_ID`", check: logs((l) => l.some((x) => x.includes("Missing: GUILD_ID"))) },
            { text: "It does not log `Missing: TOKEN` or `Missing: CLIENT_ID`", check: logs((l) => !l.some((x) => x.includes("Missing: TOKEN") || x.includes("Missing: CLIENT_ID"))) },
          ],
        },
      ],
      quiz: [
        { id: "q1", q: "Why can't you just run a bot on your laptop and call it done?", options: ["Laptops don't support Node.js", "Your bot goes offline whenever your machine sleeps or restarts", "Discord blocks residential IP addresses", "Laptops are too slow to run JavaScript"], answer: 1, explain: "A bot needs a machine that's always on. A VPS or PaaS keeps the process running 24/7 independently of your laptop." },
        { id: "q2", q: "What is a `.env` file used for?", options: ["Storing your bot's commands", "Keeping secret values (token, IDs) out of your source code", "Compiling TypeScript", "Configuring the Discord developer portal"], answer: 1, explain: ".env holds secrets. You add it to .gitignore so it's never committed. Libraries like `dotenv` load it into `process.env` at runtime." },
        { id: "q3", q: "What is the easiest way to deploy a Node.js bot with zero server management?", options: ["Set up a bare-metal rack server", "Use Railway or Render — connect your GitHub repo and they handle the rest", "Write your own TCP server", "Deploy to a game server host"], answer: 1, explain: "Railway and Render auto-deploy from GitHub, give you free-tier credits, and handle process management — ideal for first-time bot hosters." },
      ],
    },
    {
      kind: "workshop",
      id: "bot-architecture",
      title: "Workshop · Design your bot's architecture",
      tagline: "Guided — build the full startup sequence.",
      steps: [
        {
          instructions:
            "Every bot starts the same way: load config → validate env → register commands → connect to Gateway. Write a `createBotManifest()` function that returns an object with:\n- `name`: your bot's name\n- `intents`: an array of at least 2 strings, e.g. `[\"Guilds\", \"GuildMessages\"]`\n- `commands`: an array of objects `{ name, description }` — at least 2 commands\n\nLog `manifest.commands.length + \" commands registered\"`.",
          starter: 'function createBotManifest() {\n  return {\n    // name, intents array, commands array\n  };\n}\n\nconst manifest = createBotManifest();\nconsole.log(manifest.commands.length + " commands registered");',
          solution: 'function createBotManifest() {\n  return {\n    name: "MyBot",\n    intents: ["Guilds", "GuildMessages"],\n    commands: [\n      { name: "ping", description: "Check if the bot is alive" },\n      { name: "help", description: "Show available commands" },\n    ],\n  };\n}\n\nconst manifest = createBotManifest();\nconsole.log(manifest.commands.length + " commands registered");',
          tests: [
            { text: "You defined `createBotManifest`", check: has(/function\s+createBotManifest|createBotManifest\s*=/) },
            { text: "manifest has `intents` as an array", check: has(/intents\s*:\s*\[/) },
            { text: "It logs a number followed by `commands registered`", check: logs((l) => l.some((x) => /\d+ commands registered/.test(x))) },
          ],
        },
        {
          instructions:
            "Write a `startup(manifest)` function that simulates the boot sequence. It should log these steps in order:\n1. `\"[1/4] Loading config: botName\"`\n2. `\"[2/4] Intents: intent1, intent2, ...\"`\n3. `\"[3/4] Registering N commands\"`\n4. `\"[4/4] Connecting to Gateway...\"`\n\nUse `Array.join()` to format the intents list.",
          starter: 'function startup(manifest) {\n  // log 4 lines following the sequence above\n}\n\nconst manifest = {\n  name: "MyBot",\n  intents: ["Guilds", "GuildMessages"],\n  commands: [{ name: "ping" }, { name: "help" }],\n};\n\nstartup(manifest);',
          solution: 'function startup(manifest) {\n  console.log("[1/4] Loading config: " + manifest.name);\n  console.log("[2/4] Intents: " + manifest.intents.join(", "));\n  console.log("[3/4] Registering " + manifest.commands.length + " commands");\n  console.log("[4/4] Connecting to Gateway...");\n}\n\nconst manifest = {\n  name: "MyBot",\n  intents: ["Guilds", "GuildMessages"],\n  commands: [{ name: "ping" }, { name: "help" }],\n};\n\nstartup(manifest);',
          tests: [
            { text: "You defined `startup`", check: has(/function\s+startup|startup\s*=/) },
            { text: "It logs `[1/4]`", check: logs((l) => l.some((x) => x.startsWith("[1/4]"))) },
            { text: "It logs `[4/4]` as the last step", check: logs((l) => l.some((x) => x.startsWith("[4/4]"))) },
            { text: "You used `.join()`", check: has(/\.join\s*\(/) },
          ],
        },
        {
          instructions:
            "Build a `commandRouter(commands, commandName)` that takes the commands array from your manifest and returns the matching command object, or `null` if not found. Then log `router output: \" + JSON.stringify(result)`.\n\nThis is exactly what `interactionCreate` does — it routes a command name to the right handler.",
          starter: 'function commandRouter(commands, commandName) {\n  // find and return the command object with matching name, or null\n}\n\nconst commands = [\n  { name: "ping", description: "Pong!" },\n  { name: "help", description: "List commands" },\n];\n\nconst result = commandRouter(commands, "ping");\nconsole.log("router output: " + JSON.stringify(result));\nconsole.log("unknown: " + JSON.stringify(commandRouter(commands, "dance")));',
          solution: 'function commandRouter(commands, commandName) {\n  return commands.find(c => c.name === commandName) || null;\n}\n\nconst commands = [\n  { name: "ping", description: "Pong!" },\n  { name: "help", description: "List commands" },\n];\n\nconst result = commandRouter(commands, "ping");\nconsole.log("router output: " + JSON.stringify(result));\nconsole.log("unknown: " + JSON.stringify(commandRouter(commands, "dance")));',
          tests: [
            { text: "You defined `commandRouter`", check: has(/function\s+commandRouter|commandRouter\s*=/) },
            { text: "It finds `ping` and logs its object", check: logs((l) => l.some((x) => x.includes("ping") && x.includes("Pong"))) },
            { text: "Unknown command returns null", check: logs((l) => l.some((x) => x.includes("null"))) },
          ],
          example: '// In discord.js:\nclient.on("interactionCreate", async (i) => {\n  if (!i.isChatInputCommand()) return;\n  const cmd = commandRouter(commands, i.commandName);\n  if (!cmd) return i.reply("Unknown command");\n  await cmd.execute(i);\n});',
        },
      ],
    },
    {
      kind: "lab",
      id: "deploy-checklist",
      title: "Lab · Deployment checklist",
      tagline: "On your own — validate and generate your deploy config.",
      steps: [
        {
          instructions:
            "Write `generateDockerfile(config)` that takes an object with `nodeVersion` (e.g. `\"20\"`) and `entrypoint` (e.g. `\"index.js\"`), and returns a multi-line Dockerfile string. It should contain:\n- `FROM node:<nodeVersion>`\n- `WORKDIR /app`\n- `COPY package*.json ./`\n- `RUN npm install`\n- `COPY . .`\n- `CMD [\"node\", \"<entrypoint>\"]`\n\nLog the result.",
          starter: 'function generateDockerfile(config) {\n  // build and return the Dockerfile string\n}\n\nconsole.log(generateDockerfile({ nodeVersion: "20", entrypoint: "index.js" }));',
          solution: 'function generateDockerfile(config) {\n  return [\n    "FROM node:" + config.nodeVersion,\n    "WORKDIR /app",\n    "COPY package*.json ./",\n    "RUN npm install",\n    "COPY . .",\n    \'CMD ["node", "\' + config.entrypoint + \'"]\',\n  ].join("\\n");\n}\n\nconsole.log(generateDockerfile({ nodeVersion: "20", entrypoint: "index.js" }));',
          tests: [
            { text: "You defined `generateDockerfile`", check: has(/function\s+generateDockerfile|generateDockerfile\s*=/) },
            { text: "Output contains `FROM node:`", check: logs((l) => l.some((x) => x.includes("FROM node:"))) },
            { text: "Output contains `CMD`", check: logs((l) => l.some((x) => x.includes("CMD"))) },
            { text: "Output contains `index.js`", check: logs((l) => l.some((x) => x.includes("index.js"))) },
          ],
        },
        {
          instructions:
            "Put it all together. Write a `preDeployCheck(env, manifest)` function that:\n1. Checks env has `TOKEN`, `CLIENT_ID`, and `GUILD_ID` — logs `\"❌ Missing: key\"` for each absent\n2. Checks `manifest.commands.length > 0` — if zero, logs `\"❌ No commands defined\"`\n3. If everything passes, logs `\"✅ All checks passed — deploy when ready!\"`\n\nTest with a complete setup and a broken one.",
          starter: 'function preDeployCheck(env, manifest) {\n  // validate env keys and manifest commands\n  // log errors or the success message\n}\n\npreDeployCheck(\n  { TOKEN: "abc", CLIENT_ID: "123", GUILD_ID: "456" },\n  { commands: [{ name: "ping" }] }\n);\n\npreDeployCheck(\n  { TOKEN: "abc" },\n  { commands: [] }\n);',
          solution: 'function preDeployCheck(env, manifest) {\n  const required = ["TOKEN", "CLIENT_ID", "GUILD_ID"];\n  const errors = [];\n  required.forEach(k => { if (!env[k]) errors.push("❌ Missing: " + k); });\n  if (!manifest.commands.length) errors.push("❌ No commands defined");\n  if (errors.length) {\n    errors.forEach(e => console.log(e));\n  } else {\n    console.log("✅ All checks passed — deploy when ready!");\n  }\n}\n\npreDeployCheck(\n  { TOKEN: "abc", CLIENT_ID: "123", GUILD_ID: "456" },\n  { commands: [{ name: "ping" }] }\n);\n\npreDeployCheck(\n  { TOKEN: "abc" },\n  { commands: [] }\n);',
          tests: [
            { text: "You defined `preDeployCheck`", check: has(/function\s+preDeployCheck|preDeployCheck\s*=/) },
            { text: "Complete setup logs the success message", check: logs((l) => l.some((x) => x.includes("All checks passed"))) },
            { text: "Broken setup logs a missing key error", check: logs((l) => l.some((x) => x.includes("❌ Missing"))) },
            { text: "Broken setup logs no commands error", check: logs((l) => l.some((x) => x.includes("No commands"))) },
          ],
        },
      ],
    },
  ],
};

// ── Course 4 · AI Bot Builder ─────────────────────────────────────────────────
const AI_BOT_BUILDER: Course = {
  slug: "ai-bot-builder",
  name: "AI Bot Builder",
  emoji: "🤖",
  tagline: "Build a Construct-style tool: describe a bot in plain English and generate its Discord code automatically.",
  level: "Advanced",
  hours: "4–6 hrs",
  topics: ["async / await", "API calls", "prompt engineering", "code generation"],
  sections: [
    // ── Lesson 1 ─────────────────────────────────────────────────────────────
    {
      kind: "lesson",
      id: "async-await",
      title: "Lesson 1 · async / await",
      tagline: "Handle delayed operations — the foundation of every AI API call.",
      steps: [
        {
          instructions:
            "Real AI calls take time. JavaScript handles this with **async functions** — they always return a Promise, and you use `await` to pause until the result arrives.\n\nIn this sandbox `await` works at the top level — no wrapper needed.\n\nWrite an `async function getStatus()` that returns the string `\"online\"`. Then `await` it and `console.log` the result.",
          example: 'async function greet() {\n  return "Hello!";\n}\nconst msg = await greet();\nconsole.log(msg); // Hello!',
          starter: 'async function getStatus() {\n  // return the string "online"\n}\n\nconst status = await getStatus();\nconsole.log(status);',
          solution: 'async function getStatus() {\n  return "online";\n}\n\nconst status = await getStatus();\nconsole.log(status);',
          tests: [
            { text: "You defined `getStatus` with the `async` keyword", check: has(/async\s+function\s+getStatus|getStatus\s*=\s*async/) },
            { text: "You used `await` to call it", check: has(/await\s+getStatus\s*\(/) },
            { text: "It logs `online`", check: logs((l) => l.includes("online")) },
          ],
        },
        {
          instructions:
            "async functions can call other async functions with `await` — this is how you build **pipelines** where each step waits for the previous one.\n\nWrite two async functions:\n- `getPrefix()` — returns `\"/\"`\n- `buildCommand(name)` — `await`s `getPrefix()` and returns `prefix + name`\n\nThen log `await buildCommand(\"help\")`.",
          example: 'async function getBase() { return "https://api"; }\nasync function getUrl(path) {\n  const base = await getBase();\n  return base + path;\n}\nconsole.log(await getUrl("/bots")); // https://api/bots',
          starter: 'async function getPrefix() {\n  // return "/"\n}\n\nasync function buildCommand(name) {\n  // await getPrefix(), return prefix + name\n}\n\nconsole.log(await buildCommand("help"));',
          solution: 'async function getPrefix() {\n  return "/";\n}\n\nasync function buildCommand(name) {\n  const prefix = await getPrefix();\n  return prefix + name;\n}\n\nconsole.log(await buildCommand("help"));',
          tests: [
            { text: "Both functions use `async`", check: has(/async\s+function\s+getPrefix[\s\S]*async\s+function\s+buildCommand|async\s+function\s+buildCommand[\s\S]*async\s+function\s+getPrefix/) },
            { text: "`buildCommand` uses `await getPrefix()`", check: has(/await\s+getPrefix\s*\(/) },
            { text: "It logs `/help`", check: logs((l) => l.includes("/help")) },
          ],
        },
      ],
      quiz: [
        { id: "q1", q: "What does an `async` function always return?", options: ["A string", "A number", "A Promise", "undefined"], answer: 2, explain: "Every async function wraps its return value in a Promise — even `return 'hello'` becomes `Promise.resolve('hello')`." },
        { id: "q2", q: "What does `await` do?", options: ["Makes code run faster", "Pauses the async function until the Promise resolves, then gives you its value", "Creates a new thread", "Cancels the request on timeout"], answer: 1, explain: "`await` suspends execution inside the async function — other code can run meanwhile — then resumes with the resolved value." },
        { id: "q3", q: "Why do AI API calls need async/await?", options: ["APIs only accept async code", "The response takes hundreds of milliseconds — async lets your app stay responsive while waiting", "AI requires multiple threads", "Async makes JSON easier to parse"], answer: 1, explain: "An AI API call might take 200ms–2s. `async/await` lets other work happen during that wait instead of freezing everything." },
      ],
    },
    // ── Lesson 2 ─────────────────────────────────────────────────────────────
    {
      kind: "lesson",
      id: "mock-api",
      title: "Lesson 2 · Simulating API calls",
      tagline: "Model the fetch → parse → handle pattern before touching a real endpoint.",
      steps: [
        {
          instructions:
            "Before hooking up a real AI API you need to understand the **shape** of the interaction: send a request, wait, parse the JSON body.\n\nWrite `async function mockFetch(endpoint)` that returns `{ ok: true, data: { reply: \"Pong!\" } }` when `endpoint` is `\"/ping\"`, and `{ ok: false, data: null }` for anything else.\n\nAwait `mockFetch(\"/ping\")` and log `response.data.reply`.",
          example: 'async function fakeAPI(path) {\n  if (path === "/health") return { ok: true, data: { status: "up" } };\n  return { ok: false, data: null };\n}\nconst r = await fakeAPI("/health");\nconsole.log(r.data.status); // up',
          starter: 'async function mockFetch(endpoint) {\n  // return { ok: true, data: { reply: "Pong!" } } for "/ping"\n  // return { ok: false, data: null } otherwise\n}\n\nconst response = await mockFetch("/ping");\nconsole.log(response.data.reply);',
          solution: 'async function mockFetch(endpoint) {\n  if (endpoint === "/ping") return { ok: true, data: { reply: "Pong!" } };\n  return { ok: false, data: null };\n}\n\nconst response = await mockFetch("/ping");\nconsole.log(response.data.reply);',
          tests: [
            { text: "You defined `mockFetch` as async", check: has(/async\s+function\s+mockFetch|mockFetch\s*=\s*async/) },
            { text: "It returns `{ ok: true }` for `/ping`", check: has(/ok\s*:\s*true/) },
            { text: "It logs `Pong!`", check: logs((l) => l.includes("Pong!")) },
          ],
        },
        {
          instructions:
            "APIs fail. A real AI endpoint can return an error status or throw entirely. Use `try / catch` to handle both gracefully.\n\nWrite `async function safeFetch(endpoint)` that:\n1. Awaits `mockFetch(endpoint)`\n2. If `response.ok` is false, `throw new Error(\"API error: \" + endpoint)`\n3. Otherwise returns `response.data`\n\nUse `try/catch` to call `safeFetch(\"/unknown\")` and log the caught error's message.",
          example: 'try {\n  const data = await safeFetch("/bad");\n} catch (err) {\n  console.log("Caught: " + err.message);\n}',
          starter: 'async function mockFetch(endpoint) {\n  if (endpoint === "/ping") return { ok: true, data: { reply: "Pong!" } };\n  return { ok: false, data: null };\n}\n\nasync function safeFetch(endpoint) {\n  const response = await mockFetch(endpoint);\n  // if not ok, throw new Error("API error: " + endpoint)\n  // otherwise return response.data\n}\n\ntry {\n  const data = await safeFetch("/unknown");\n  console.log(data);\n} catch (err) {\n  console.log("Caught: " + err.message);\n}',
          solution: 'async function mockFetch(endpoint) {\n  if (endpoint === "/ping") return { ok: true, data: { reply: "Pong!" } };\n  return { ok: false, data: null };\n}\n\nasync function safeFetch(endpoint) {\n  const response = await mockFetch(endpoint);\n  if (!response.ok) throw new Error("API error: " + endpoint);\n  return response.data;\n}\n\ntry {\n  const data = await safeFetch("/unknown");\n  console.log(data);\n} catch (err) {\n  console.log("Caught: " + err.message);\n}',
          tests: [
            { text: "You defined `safeFetch` as async", check: has(/async\s+function\s+safeFetch|safeFetch\s*=\s*async/) },
            { text: "You used `try / catch`", check: has(/\btry\s*\{[\s\S]*\bcatch\s*\(/) },
            { text: "It logs `Caught: API error: /unknown`", check: logs((l) => l.some((x) => x.includes("Caught: API error: /unknown"))) },
          ],
        },
      ],
      quiz: [
        { id: "q1", q: "Why simulate an API before using the real one?", options: ["The real API always costs money", "Mocks let you build and test logic without network latency or API keys", "Real APIs don't support async", "It's a mandatory step"], answer: 1, explain: "Mocks isolate your logic from the network — faster iteration, no cost, works offline. Swap the mock for the real call when the logic is solid." },
        { id: "q2", q: "What should you do when `response.ok` is false?", options: ["Log it and continue", "Return null silently", "Throw an error so the caller can decide how to handle it", "Retry immediately forever"], answer: 2, explain: "Throwing lets the caller use try/catch — show a user error, retry with backoff, or fall back. Silent failures hide bugs." },
        { id: "q3", q: "What does a real AI API (like Groq or OpenAI) return?", options: ["A plain string", "A Buffer", "A JSON object with a `choices` array containing the model's text", "A binary file"], answer: 2, explain: "Both Groq and OpenAI return JSON: `{ choices: [{ message: { content: '...' } }] }`. Navigate to `.choices[0].message.content` to get the text." },
      ],
    },
    // ── Lesson 3 ─────────────────────────────────────────────────────────────
    {
      kind: "lesson",
      id: "prompt-engineering",
      title: "Lesson 3 · Prompt engineering",
      tagline: "Structure instructions so the AI returns predictable, parseable output.",
      steps: [
        {
          instructions:
            "The secret to getting reliable structured output from an AI is a well-crafted **system prompt** — instructions you send alongside every request that define role and output format.\n\nWrite `buildSystemPrompt()` that returns a multi-line string. It must include:\n- A role: `\"You are a Discord bot code generator.\"`\n- An output rule: `\"Always respond with valid JSON.\"`\n- A schema: `\"The JSON must have: name (string), commands (array of {name, description, reply}).\"`\n\nJoin the lines with `\"\\n\"` and log the result.",
          example: 'function buildSystemPrompt() {\n  return [\n    "You are a helpful assistant.",\n    "Always respond in JSON.",\n  ].join("\\n");\n}',
          starter: 'function buildSystemPrompt() {\n  return [\n    // role statement\n    // output rule\n    // schema hint\n  ].join("\\n");\n}\n\nconsole.log(buildSystemPrompt());',
          solution: 'function buildSystemPrompt() {\n  return [\n    "You are a Discord bot code generator.",\n    "Always respond with valid JSON.",\n    "The JSON must have: name (string), commands (array of {name, description, reply}).",\n  ].join("\\n");\n}\n\nconsole.log(buildSystemPrompt());',
          tests: [
            { text: "You defined `buildSystemPrompt`", check: has(/function\s+buildSystemPrompt|buildSystemPrompt\s*=/) },
            { text: "Output contains `JSON`", check: logs((l) => l.some((x) => x.includes("JSON"))) },
            { text: "Output contains `commands`", check: logs((l) => l.some((x) => x.includes("commands"))) },
          ],
        },
        {
          instructions:
            "The **user prompt** carries the actual request — what bot to build. Write `buildUserPrompt(description, personality)` that returns:\n\n`\"Build a Discord bot that: <description>\\nPersonality: <personality>\\nReturn only the JSON object, no extra text.\"`\n\nLog the result for description `\"rolls dice and tells jokes\"` and personality `\"witty\"`.",
          example: 'function makeRequest(task, lang) {\n  return "Do this task: " + task + "\\nLanguage: " + lang;\n}',
          starter: 'function buildUserPrompt(description, personality) {\n  // return the formatted string with both values interpolated\n}\n\nconsole.log(buildUserPrompt("rolls dice and tells jokes", "witty"));',
          solution: 'function buildUserPrompt(description, personality) {\n  return (\n    "Build a Discord bot that: " + description +\n    "\\nPersonality: " + personality +\n    "\\nReturn only the JSON object, no extra text."\n  );\n}\n\nconsole.log(buildUserPrompt("rolls dice and tells jokes", "witty"));',
          tests: [
            { text: "You defined `buildUserPrompt`", check: has(/function\s+buildUserPrompt|buildUserPrompt\s*=/) },
            { text: "Output contains the description", check: logs((l) => l.some((x) => x.includes("rolls dice"))) },
            { text: "Output contains the personality", check: logs((l) => l.some((x) => x.includes("witty"))) },
            { text: "Output mentions `JSON`", check: logs((l) => l.some((x) => x.toLowerCase().includes("json"))) },
          ],
        },
      ],
      quiz: [
        { id: "q1", q: "What is the difference between a system prompt and a user prompt?", options: ["They're the same thing", "System prompts set behavior/rules; user prompts carry the specific request", "User prompts are encrypted", "System prompts cost more tokens"], answer: 1, explain: "The system prompt is persistent context — your bot's 'job description'. The user prompt is the specific task for this request." },
        { id: "q2", q: "Why tell the AI to return JSON instead of plain prose?", options: ["JSON is always shorter", "JSON is machine-parseable — you can reliably extract values with code", "AI can't write prose", "JSON is faster to generate"], answer: 1, explain: "Prose is ambiguous and hard to parse; JSON gives you a reliable structure you can navigate with `.commands[0].name`." },
        { id: "q3", q: "What's the risk of a vague system prompt?", options: ["The AI refuses to respond", "You get inconsistent output formats that break your parser", "The AI outputs more tokens", "Nothing — AI always returns the same format"], answer: 1, explain: "Without explicit format instructions, models improvise — sometimes JSON, sometimes markdown, sometimes prose. Be explicit." },
      ],
    },
    // ── Lesson 4 ─────────────────────────────────────────────────────────────
    {
      kind: "lesson",
      id: "parsing",
      title: "Lesson 4 · Parsing AI responses",
      tagline: "Extract and validate the JSON hidden inside AI text.",
      steps: [
        {
          instructions:
            "Even when you instruct an AI to return JSON, it sometimes wraps it in a markdown code fence:\n\n````\n```json\n{ ... }\n```\n````\n\nWrite `extractJSON(text)` that finds the first `{` and last `}` in the string and returns just that slice. Then `JSON.parse` it and log `result.name`.\n\nTest string: `'Here is your bot:\\n\\`\\`\\`json\\n{\"name\":\"DiceBot\",\"commands\":[]}\\n\\`\\`\\`'`",
          example: 'const text = \'Some text {"key":"val"} more\';\nconst start = text.indexOf("{");\nconst end = text.lastIndexOf("}");\nconsole.log(text.slice(start, end + 1)); // {"key":"val"}',
          starter: 'function extractJSON(text) {\n  // find first "{" and last "}", return that slice\n}\n\nconst aiResponse = \'Here is your bot:\\n```json\\n{"name":"DiceBot","commands":[]}\\n```\';\nconst result = JSON.parse(extractJSON(aiResponse));\nconsole.log(result.name);',
          solution: 'function extractJSON(text) {\n  const start = text.indexOf("{");\n  const end = text.lastIndexOf("}");\n  return text.slice(start, end + 1);\n}\n\nconst aiResponse = \'Here is your bot:\\n```json\\n{"name":"DiceBot","commands":[]}\\n```\';\nconst result = JSON.parse(extractJSON(aiResponse));\nconsole.log(result.name);',
          hints: [
            "`text.indexOf(\"{\")` gives you the position of the first `{`. Store it in a variable.",
            "`text.lastIndexOf(\"}\")` gives the position of the last `}`. Slice from the first `{` to that index **+ 1** (slice's end is exclusive).",
          ],
          tests: [
            { text: "You defined `extractJSON`", check: has(/function\s+extractJSON|extractJSON\s*=/) },
            { text: "You used `indexOf` and `lastIndexOf`", check: has(/\.indexOf\s*\([\s\S]{0,200}\.lastIndexOf\s*\(|\.lastIndexOf\s*\([\s\S]{0,200}\.indexOf\s*\(/), hint: "Use both `text.indexOf(\"{\")` and `text.lastIndexOf(\"}\")` to find the boundaries." },
            { text: "It logs `DiceBot`", check: logs((l) => l.includes("DiceBot")), hint: "Make sure you `return` the sliced string so `JSON.parse` can read it — then log `result.name`." },
          ],
        },
        {
          instructions:
            "Before using the parsed spec, validate it. Write `validateSpec(spec)` that checks:\n1. `spec.name` is a non-empty string\n2. `spec.commands` is an array\n3. `spec.commands.length > 0`\n\nReturn `{ valid: boolean, errors: string[] }`. Push a descriptive string for each failing check.\n\nTest with two specs — one valid, one with an empty name and no commands.",
          example: 'function validate(obj) {\n  const errors = [];\n  if (!obj.title) errors.push("Missing title");\n  return { valid: errors.length === 0, errors };\n}',
          starter: 'function validateSpec(spec) {\n  const errors = [];\n  // check name, commands array, commands.length > 0\n  return { valid: errors.length === 0, errors };\n}\n\nconsole.log(JSON.stringify(validateSpec({ name: "DiceBot", commands: [{ name: "roll" }] })));\nconsole.log(JSON.stringify(validateSpec({ name: "", commands: [] })));',
          solution: 'function validateSpec(spec) {\n  const errors = [];\n  if (!spec.name || typeof spec.name !== "string") errors.push("Missing name");\n  if (!Array.isArray(spec.commands)) errors.push("commands must be an array");\n  else if (spec.commands.length === 0) errors.push("commands array is empty");\n  return { valid: errors.length === 0, errors };\n}\n\nconsole.log(JSON.stringify(validateSpec({ name: "DiceBot", commands: [{ name: "roll" }] })));\nconsole.log(JSON.stringify(validateSpec({ name: "", commands: [] })));',
          tests: [
            { text: "You defined `validateSpec`", check: has(/function\s+validateSpec|validateSpec\s*=/) },
            { text: "Valid spec returns `{\"valid\":true}`", check: logs((l) => l.some((x) => x.includes('"valid":true'))) },
            { text: "Invalid spec returns `{\"valid\":false}` with errors", check: logs((l) => l.some((x) => x.includes('"valid":false') && x.includes('"errors"'))) },
          ],
        },
      ],
      quiz: [
        { id: "q1", q: "Why use `indexOf`/`lastIndexOf` instead of regex to extract JSON?", options: ["Regex is too slow", "indexOf/lastIndexOf is simpler and handles nested objects — regex struggles with balanced braces", "Regex doesn't exist in JavaScript", "indexOf is always faster"], answer: 1, explain: "Matching balanced `{}` with regex is complex. `indexOf`/`lastIndexOf` finds the outer boundary simply and reliably." },
        { id: "q2", q: "When should you validate an AI response before using it?", options: ["Never — the AI always follows instructions", "Always — especially before generating code from it", "Only in production", "Only if the prompt is long"], answer: 1, explain: "AI models occasionally ignore format instructions. Validate before trusting the output, especially before writing files or executing code." },
        { id: "q3", q: "What does `JSON.parse` throw if the input is malformed?", options: ["It returns null", "It returns undefined", "A SyntaxError", "A TypeError"], answer: 2, explain: "`JSON.parse` throws a `SyntaxError` on invalid JSON. Always wrap it in `try/catch` when parsing untrusted input like an AI response." },
      ],
    },
    // ── Lesson 5 ─────────────────────────────────────────────────────────────
    {
      kind: "lesson",
      id: "code-generation",
      title: "Lesson 5 · Code generation",
      tagline: "Turn a bot spec into real, runnable JavaScript strings.",
      steps: [
        {
          instructions:
            "Construct's core trick is **code generation** — filling a structured spec into templates to produce JavaScript source code.\n\nWrite `fillTemplate(template, vars)` where `vars` is an object. Replace every `{{key}}` in the template string with the matching value from `vars`. Use `.replace()` with a global regex.\n\nTest with template `\"Hello, {{name}}! You have {{count}} messages.\"` and vars `{ name: \"Alice\", count: \"3\" }`.",
          example: 'function fill(t, v) {\n  return t.replace(/\\{\\{(\\w+)\\}\\}/g, (_, k) => v[k] ?? "");\n}\nconsole.log(fill("Hi {{user}}", { user: "Bob" })); // Hi Bob',
          starter: 'function fillTemplate(template, vars) {\n  // replace {{key}} with vars[key] for each key in the template\n}\n\nconst result = fillTemplate(\n  "Hello, {{name}}! You have {{count}} messages.",\n  { name: "Alice", count: "3" }\n);\nconsole.log(result);',
          solution: 'function fillTemplate(template, vars) {\n  return template.replace(/\\{\\{(\\w+)\\}\\}/g, (_, key) => vars[key] ?? "");\n}\n\nconst result = fillTemplate(\n  "Hello, {{name}}! You have {{count}} messages.",\n  { name: "Alice", count: "3" }\n);\nconsole.log(result);',
          tests: [
            { text: "You defined `fillTemplate`", check: has(/function\s+fillTemplate|fillTemplate\s*=/) },
            { text: "You used `.replace()` with a regex", check: has(/\.replace\s*\(\s*\//) },
            { text: "It logs `Hello, Alice! You have 3 messages.`", check: logs((l) => l.some((x) => x.includes("Hello, Alice! You have 3 messages."))) },
          ],
        },
        {
          instructions:
            "Now generate a JavaScript handler function string for each bot command. Write `generateHandler(command)` that takes `{ name, description, reply }` and returns:\n\n```\n// /name: description\nfunction handle_name(user) {\n  return \"reply\";\n}\n```\n\nMap over a commands array and `console.log` each generated string.",
          example: 'function genFn(cmd) {\n  return "function " + cmd.name + "() { return \\"" + cmd.reply + "\\"; }";\n}',
          starter: 'function generateHandler(command) {\n  // return a function string: comment + function handle_name(user) { return "reply"; }\n}\n\nconst commands = [\n  { name: "roll", description: "Roll a die", reply: "🎲 You rolled a 4!" },\n  { name: "joke", description: "Tell a joke", reply: "Why did the bot cross the road?" },\n];\n\ncommands.forEach(cmd => console.log(generateHandler(cmd)));',
          solution: 'function generateHandler(command) {\n  return (\n    "// /" + command.name + ": " + command.description + "\\n" +\n    "function handle_" + command.name + "(user) {\\n" +\n    "  return \\"" + command.reply + "\\";\\n" +\n    "}"\n  );\n}\n\nconst commands = [\n  { name: "roll", description: "Roll a die", reply: "🎲 You rolled a 4!" },\n  { name: "joke", description: "Tell a joke", reply: "Why did the bot cross the road?" },\n];\n\ncommands.forEach(cmd => console.log(generateHandler(cmd)));',
          hints: [
            "You're building a string of source code. Start with the comment line: `\"// /\" + command.name + \": \" + command.description`.",
            "Use `\\n` for line breaks inside the string, and escape the inner quotes around the reply with `\\\"`.",
            "The function name is `\"handle_\" + command.name` — so a command named `roll` produces `handle_roll`.",
          ],
          tests: [
            { text: "You defined `generateHandler`", check: has(/function\s+generateHandler|generateHandler\s*=/) },
            { text: "Output contains `handle_roll`", check: logs((l) => l.some((x) => x.includes("handle_roll"))) },
            { text: "Output contains `handle_joke`", check: logs((l) => l.some((x) => x.includes("handle_joke"))) },
            { text: "Both reply strings appear in the output", check: logs((l) => l.some((x) => x.includes("rolled")) && l.some((x) => x.includes("bot cross"))) },
          ],
        },
      ],
      quiz: [
        { id: "q1", q: "What is code generation?", options: ["Writing code by hand", "Using a program to produce source code as output, based on structured input", "Running tests automatically", "Compiling TypeScript to JavaScript"], answer: 1, explain: "Code generators take a spec and produce source code — exactly what Construct does when it turns your description into discord.js files." },
        { id: "q2", q: "Why use `{{key}}` template placeholders instead of string concatenation?", options: ["Templates run faster", "Templates make the output structure visible without tracing string + calls", "Concatenation doesn't work in Node.js", "Templates are required by discord.js"], answer: 1, explain: "A template makes the output structure immediately visible. Complex concatenation becomes unreadable; templates stay clear as they grow." },
        { id: "q3", q: "What should `generateHandler` return for a command named `ping`?", options: ["A ping to the API", "A JavaScript function string named `handle_ping` that returns the reply", "A JSON object", "undefined"], answer: 1, explain: "The generator outputs source code as a string — `function handle_ping(user) { return 'Pong!'; }`. This string is what Construct writes to disk." },
      ],
    },
    // ── Workshop ──────────────────────────────────────────────────────────────
    {
      kind: "workshop",
      id: "build-ai-builder",
      title: "Workshop · Build the AI Bot Builder",
      tagline: "Guided — wire all five pieces into one end-to-end pipeline.",
      steps: [
        {
          instructions:
            "Let's build the whole thing step by step. First: **the prompt engine**.\n\nWrite `buildPrompt(description)` that returns an object with two keys:\n- `system`: `\"You are a Discord bot generator. Always respond with valid JSON matching: {name, commands: [{name, description, reply}]}.\"`\n- `user`: `\"Build a bot that: \" + description + \"\\nReturn only the JSON.\"`\n\nLog `JSON.stringify(buildPrompt(\"rolls dice\"), null, 2)` to see the structure.",
          starter: 'function buildPrompt(description) {\n  return {\n    // system: role + format instruction\n    // user: description interpolated into a request\n  };\n}\n\nconsole.log(JSON.stringify(buildPrompt("rolls dice"), null, 2));',
          solution: 'function buildPrompt(description) {\n  return {\n    system: "You are a Discord bot generator. Always respond with valid JSON matching: {name, commands: [{name, description, reply}]}.",\n    user: "Build a bot that: " + description + "\\nReturn only the JSON.",\n  };\n}\n\nconsole.log(JSON.stringify(buildPrompt("rolls dice"), null, 2));',
          tests: [
            { text: "You defined `buildPrompt`", check: has(/function\s+buildPrompt|buildPrompt\s*=/) },
            { text: "The result has a `system` key", check: logs((l) => l.some((x) => x.includes('"system"'))) },
            { text: "The result has a `user` key", check: logs((l) => l.some((x) => x.includes('"user"'))) },
            { text: "The user prompt contains `rolls dice`", check: logs((l) => l.some((x) => x.includes("rolls dice"))) },
          ],
        },
        {
          instructions:
            "Next: **the AI call**. In a real app this hits Groq or OpenAI. Here we mock it.\n\nWrite `async function callAI(prompt)` that returns a realistic AI response string — a JSON spec inside a ` ```json ` fence — for a bot named `\"DiceJokeBot\"` with two commands:\n- `roll`: description `\"Roll a die\"`, reply `\"🎲 You rolled a 4!\"`\n- `joke`: description `\"Tell a joke\"`, reply `\"Why don't scientists trust atoms? They make up everything!\"`\n\nLog the awaited result.",
          starter: 'async function callAI(prompt) {\n  // return a string: ```json\\n{...DiceJokeBot spec...}\\n```\n}\n\nconst raw = await callAI({});\nconsole.log(raw);',
          solution: 'async function callAI(prompt) {\n  return \'```json\\n{"name":"DiceJokeBot","commands":[{"name":"roll","description":"Roll a die","reply":"🎲 You rolled a 4!"},{"name":"joke","description":"Tell a joke","reply":"Why don\\\'t scientists trust atoms? They make up everything!"}]}\\n```\';\n}\n\nconst raw = await callAI({});\nconsole.log(raw);',
          tests: [
            { text: "You defined `callAI` as async", check: has(/async\s+function\s+callAI|callAI\s*=\s*async/) },
            { text: "The response contains `DiceJokeBot`", check: logs((l) => l.some((x) => x.includes("DiceJokeBot"))) },
            { text: "The response contains `commands`", check: logs((l) => l.some((x) => x.includes("commands"))) },
          ],
        },
        {
          instructions:
            "Now: **parsing**. Write `parseResponse(text)` that:\n1. Finds JSON using `text.indexOf('{')` and `text.lastIndexOf('}')`\n2. Parses it with `JSON.parse`\n3. Throws `new Error('Invalid spec')` if `name` or `commands` are missing\n4. Returns the spec\n\nTest it on a valid AI response and log `spec.name + \" — \" + spec.commands.length + \" commands\"`.",
          starter: 'function parseResponse(text) {\n  // 1. slice from first { to last }\n  // 2. JSON.parse\n  // 3. validate name and commands array\n  // 4. return spec\n}\n\nconst aiText = \'```json\\n{"name":"DiceJokeBot","commands":[{"name":"roll"},{"name":"joke"}]}\\n```\';\nconst spec = parseResponse(aiText);\nconsole.log(spec.name + " — " + spec.commands.length + " commands");',
          solution: 'function parseResponse(text) {\n  const start = text.indexOf("{");\n  const end = text.lastIndexOf("}");\n  const spec = JSON.parse(text.slice(start, end + 1));\n  if (!spec.name || !Array.isArray(spec.commands)) throw new Error("Invalid spec");\n  return spec;\n}\n\nconst aiText = \'```json\\n{"name":"DiceJokeBot","commands":[{"name":"roll"},{"name":"joke"}]}\\n```\';\nconst spec = parseResponse(aiText);\nconsole.log(spec.name + " — " + spec.commands.length + " commands");',
          tests: [
            { text: "You defined `parseResponse`", check: has(/function\s+parseResponse|parseResponse\s*=/) },
            { text: "You used `JSON.parse`", check: has(/JSON\.parse\s*\(/) },
            { text: "It logs `DiceJokeBot — 2 commands`", check: logs((l) => l.some((x) => x.includes("DiceJokeBot") && x.includes("2 commands"))) },
          ],
        },
        {
          instructions:
            "Now: **code generation**. Write `generateBotCode(spec)` that:\n1. Creates a header comment: `\"// Bot: \" + spec.name`\n2. Maps over `spec.commands`, generating `\"function handle_\" + cmd.name + \"(user) {\\n  return \\\"\" + cmd.reply + \"\\\";\\n}\"` for each\n3. Joins everything with `\"\\n\\n\"` and returns the result\n\nLog the output for a DiceJokeBot spec.",
          starter: 'function generateBotCode(spec) {\n  const header = "// Bot: " + spec.name;\n  const handlers = spec.commands.map(cmd => {\n    // return: function handle_name(user) { return "reply"; }\n  });\n  return [header, ...handlers].join("\\n\\n");\n}\n\nconst spec = {\n  name: "DiceJokeBot",\n  commands: [\n    { name: "roll", description: "Roll a die", reply: "🎲 You rolled a 4!" },\n    { name: "joke", description: "Tell a joke", reply: "Why don\'t scientists trust atoms?" },\n  ],\n};\nconsole.log(generateBotCode(spec));',
          solution: 'function generateBotCode(spec) {\n  const header = "// Bot: " + spec.name;\n  const handlers = spec.commands.map(cmd =>\n    "function handle_" + cmd.name + "(user) {\\n  return \\"" + cmd.reply + "\\";\\n}"\n  );\n  return [header, ...handlers].join("\\n\\n");\n}\n\nconst spec = {\n  name: "DiceJokeBot",\n  commands: [\n    { name: "roll", description: "Roll a die", reply: "🎲 You rolled a 4!" },\n    { name: "joke", description: "Tell a joke", reply: "Why don\'t scientists trust atoms?" },\n  ],\n};\nconsole.log(generateBotCode(spec));',
          tests: [
            { text: "You defined `generateBotCode`", check: has(/function\s+generateBotCode|generateBotCode\s*=/) },
            { text: "Output contains `// Bot: DiceJokeBot`", check: logs((l) => l.some((x) => x.includes("// Bot: DiceJokeBot"))) },
            { text: "Output contains `handle_roll`", check: logs((l) => l.some((x) => x.includes("handle_roll"))) },
            { text: "Output contains `handle_joke`", check: logs((l) => l.some((x) => x.includes("handle_joke"))) },
          ],
        },
        {
          instructions:
            "The final step: **the full pipeline**. Write `async function buildBot(description)` that chains everything:\n1. Log `\"🔨 Building: \" + description`\n2. `buildPrompt(description)`\n3. Log `\"🤖 Calling AI...\"`\n4. `await callAI(prompt)` \n5. `parseResponse(raw)`\n6. Log `\"✅ \" + spec.name + \" — \" + spec.commands.length + \" commands\"`\n7. Log `generateBotCode(spec)`\n\nCall `await buildBot(\"rolls dice and tells jokes\")`.",
          example: '// In the real Construct, callAI hits Groq:\n// const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {\n//   method: "POST",\n//   headers: { Authorization: "Bearer " + GROQ_KEY, "Content-Type": "application/json" },\n//   body: JSON.stringify({ model: "llama3-8b-8192",\n//     messages: [{ role: "system", content: prompt.system },\n//                { role: "user", content: prompt.user }] })\n// });\n// const json = await r.json();\n// return json.choices[0].message.content;',
          starter: 'function buildPrompt(description) {\n  return {\n    system: "You are a Discord bot generator. Return valid JSON: {name, commands: [{name, description, reply}]}.",\n    user: "Build a bot that: " + description + "\\nReturn only the JSON.",\n  };\n}\nasync function callAI(prompt) {\n  return \'```json\\n{"name":"DiceJokeBot","commands":[{"name":"roll","description":"Roll a die","reply":"🎲 You rolled a 4!"},{"name":"joke","description":"Tell a joke","reply":"Why don\\\'t scientists trust atoms? They make up everything!"}]}\\n```\';\n}\nfunction parseResponse(text) {\n  const start = text.indexOf("{");\n  const end = text.lastIndexOf("}");\n  const spec = JSON.parse(text.slice(start, end + 1));\n  if (!spec.name || !Array.isArray(spec.commands)) throw new Error("Invalid spec");\n  return spec;\n}\nfunction generateBotCode(spec) {\n  const header = "// Bot: " + spec.name;\n  const handlers = spec.commands.map(cmd =>\n    "function handle_" + cmd.name + "(user) {\\n  return \\"" + cmd.reply + "\\";\\n}"\n  );\n  return [header, ...handlers].join("\\n\\n");\n}\n\nasync function buildBot(description) {\n  // 1. log "🔨 Building: " + description\n  // 2. buildPrompt\n  // 3. log "🤖 Calling AI..."\n  // 4. await callAI\n  // 5. parseResponse\n  // 6. log "✅ name — N commands"\n  // 7. log generateBotCode(spec)\n}\n\nawait buildBot("rolls dice and tells jokes");',
          solution: 'function buildPrompt(description) {\n  return {\n    system: "You are a Discord bot generator. Return valid JSON: {name, commands: [{name, description, reply}]}.",\n    user: "Build a bot that: " + description + "\\nReturn only the JSON.",\n  };\n}\nasync function callAI(prompt) {\n  return \'```json\\n{"name":"DiceJokeBot","commands":[{"name":"roll","description":"Roll a die","reply":"🎲 You rolled a 4!"},{"name":"joke","description":"Tell a joke","reply":"Why don\\\'t scientists trust atoms? They make up everything!"}]}\\n```\';\n}\nfunction parseResponse(text) {\n  const start = text.indexOf("{");\n  const end = text.lastIndexOf("}");\n  const spec = JSON.parse(text.slice(start, end + 1));\n  if (!spec.name || !Array.isArray(spec.commands)) throw new Error("Invalid spec");\n  return spec;\n}\nfunction generateBotCode(spec) {\n  const header = "// Bot: " + spec.name;\n  const handlers = spec.commands.map(cmd =>\n    "function handle_" + cmd.name + "(user) {\\n  return \\"" + cmd.reply + "\\";\\n}"\n  );\n  return [header, ...handlers].join("\\n\\n");\n}\n\nasync function buildBot(description) {\n  console.log("🔨 Building: " + description);\n  const prompt = buildPrompt(description);\n  console.log("🤖 Calling AI...");\n  const raw = await callAI(prompt);\n  const spec = parseResponse(raw);\n  console.log("✅ " + spec.name + " — " + spec.commands.length + " commands");\n  console.log(generateBotCode(spec));\n}\n\nawait buildBot("rolls dice and tells jokes");',
          hints: [
            "The pipeline is linear — each line feeds the next: `buildPrompt` → `callAI` → `parseResponse` → `generateBotCode`.",
            "`callAI` is async, so you must `await` it: `const raw = await callAI(prompt);`.",
            "Log the summary between parsing and generating: `\"✅ \" + spec.name + \" — \" + spec.commands.length + \" commands\"`.",
          ],
          tests: [
            { text: "You defined `buildBot` as async", check: has(/async\s+function\s+buildBot|buildBot\s*=\s*async/), hint: "Declare it with `async function buildBot(description) { ... }` so you can `await` the AI call inside." },
            { text: "It logs the building message", check: logs((l) => l.some((x) => x.includes("🔨 Building:"))) },
            { text: "It logs `🤖 Calling AI...`", check: logs((l) => l.some((x) => x.includes("🤖 Calling AI"))) },
            { text: "It logs the parsed summary", check: logs((l) => l.some((x) => x.includes("✅") && x.includes("DiceJokeBot") && x.includes("2 commands"))) },
            { text: "Generated code contains `handle_roll` and `handle_joke`", check: logs((l) => l.some((x) => x.includes("handle_roll")) && l.some((x) => x.includes("handle_joke"))) },
          ],
        },
      ],
    },
    // ── Lab ───────────────────────────────────────────────────────────────────
    {
      kind: "lab",
      id: "extend-the-builder",
      title: "Lab · Extend the Builder",
      tagline: "On your own — add personality, sanitization, and a command registry.",
      steps: [
        {
          instructions:
            "Construct lets you choose your bot's personality. Add it to the prompt engine.\n\nWrite `buildPrompt(description, personality)` — the system prompt ends with `\"Tone: <personality>.\"` and the user prompt includes `\"Personality style: <personality>.\"` on its own line.\n\nLog `JSON.stringify(buildPrompt(\"plays music\", \"chill\"), null, 2)`.",
          starter: 'function buildPrompt(description, personality) {\n  return {\n    system: // "...generator. Tone: " + personality + "."\n    user:   // description + "\\nPersonality style: " + personality + ".\\nReturn only the JSON."\n  };\n}\n\nconsole.log(JSON.stringify(buildPrompt("plays music", "chill"), null, 2));',
          solution: 'function buildPrompt(description, personality) {\n  return {\n    system: "You are a Discord bot generator. Return valid JSON: {name, commands: [{name, description, reply}]}. Tone: " + personality + ".",\n    user: "Build a bot that: " + description + "\\nPersonality style: " + personality + ".\\nReturn only the JSON.",\n  };\n}\n\nconsole.log(JSON.stringify(buildPrompt("plays music", "chill"), null, 2));',
          tests: [
            { text: "You defined `buildPrompt` with two parameters", check: has(/function\s+buildPrompt\s*\(\s*\w+\s*,\s*\w+/) },
            { text: "The system prompt contains `chill`", check: logs((l) => l.some((x) => x.includes("chill") && (x.includes("system") || x.includes("Tone")))) },
            { text: "The user prompt contains `chill`", check: logs((l) => l.some((x) => x.includes("chill") && (x.includes("user") || x.includes("Personality")))) },
          ],
        },
        {
          instructions:
            "Bad AI output can break the generator. Write `sanitizeSpec(spec)` that:\n1. Filters out commands where `name` is empty or missing\n2. Truncates each command's `description` to 80 characters, appending `\"...\"` if it was longer\n3. Returns the cleaned spec with the same shape\n\nTest it on a messy spec with one empty-name command and one with a 100-character description.",
          starter: 'function sanitizeSpec(spec) {\n  const commands = spec.commands\n    .filter(cmd => /* remove empty names */)\n    .map(cmd => ({\n      ...cmd,\n      description: /* truncate to 80 chars + "..." */,\n    }));\n  return { ...spec, commands };\n}\n\nconst messy = {\n  name: "MyBot",\n  commands: [\n    { name: "", description: "Should be removed", reply: "nope" },\n    { name: "info", description: "A".repeat(100), reply: "Here you go" },\n    { name: "ping", description: "Pong", reply: "Pong!" },\n  ],\n};\n\nconst clean = sanitizeSpec(messy);\nconsole.log(clean.commands.length + " commands after sanitize");\nconsole.log(clean.commands[0].description.length + " chars");',
          solution: 'function sanitizeSpec(spec) {\n  const commands = spec.commands\n    .filter(cmd => cmd.name && cmd.name.trim().length > 0)\n    .map(cmd => ({\n      ...cmd,\n      description: cmd.description && cmd.description.length > 80\n        ? cmd.description.slice(0, 80) + "..."\n        : cmd.description,\n    }));\n  return { ...spec, commands };\n}\n\nconst messy = {\n  name: "MyBot",\n  commands: [\n    { name: "", description: "Should be removed", reply: "nope" },\n    { name: "info", description: "A".repeat(100), reply: "Here you go" },\n    { name: "ping", description: "Pong", reply: "Pong!" },\n  ],\n};\n\nconst clean = sanitizeSpec(messy);\nconsole.log(clean.commands.length + " commands after sanitize");\nconsole.log(clean.commands[0].description.length + " chars");',
          hints: [
            "`.filter()` keeps only commands whose `name` is truthy and non-empty after `.trim()`.",
            "For truncation: if `description.length > 80`, return `description.slice(0, 80) + \"...\"`, otherwise keep it as-is.",
            "Use the spread operator to keep the rest of each command: `{ ...cmd, description: ... }`.",
          ],
          tests: [
            { text: "You defined `sanitizeSpec`", check: has(/function\s+sanitizeSpec|sanitizeSpec\s*=/) },
            { text: "Empty-name command is removed (2 remain)", check: logs((l) => l.some((x) => x.includes("2 commands after sanitize"))) },
            { text: "Long description is truncated to 83 chars (80 + `...`)", check: logs((l) => l.some((x) => x.includes("83 chars"))) },
          ],
        },
        {
          instructions:
            "The final piece: a **command registry** — a lookup table from command name to its generated handler string.\n\nWrite `buildRegistry(spec)` that returns an object where each key is a command name and the value is the handler function string (use the `generateHandler` function below).\n\nAlso write `lookupCommand(registry, name)` — returns the handler or `\"Command not found\"`.\n\nBuild a DiceJokeBot registry, log its key count, then look up `\"roll\"` and `\"dance\"`.",
          starter: 'function generateHandler(command) {\n  return "function handle_" + command.name + "(user) {\\n  return \\"" + command.reply + "\\";\\n}";\n}\n\nfunction buildRegistry(spec) {\n  // return { commandName: handlerString, ... } for each command\n}\n\nfunction lookupCommand(registry, name) {\n  // return registry[name] or "Command not found"\n}\n\nconst spec = {\n  name: "DiceJokeBot",\n  commands: [\n    { name: "roll", description: "Roll a die", reply: "🎲 You rolled a 4!" },\n    { name: "joke", description: "Tell a joke", reply: "Why don\'t scientists trust atoms?" },\n  ],\n};\n\nconst registry = buildRegistry(spec);\nconsole.log(Object.keys(registry).length + " commands in registry");\nconsole.log(lookupCommand(registry, "roll"));\nconsole.log(lookupCommand(registry, "dance"));',
          solution: 'function generateHandler(command) {\n  return "function handle_" + command.name + "(user) {\\n  return \\"" + command.reply + "\\";\\n}";\n}\n\nfunction buildRegistry(spec) {\n  const registry = {};\n  spec.commands.forEach(cmd => { registry[cmd.name] = generateHandler(cmd); });\n  return registry;\n}\n\nfunction lookupCommand(registry, name) {\n  return registry[name] || "Command not found";\n}\n\nconst spec = {\n  name: "DiceJokeBot",\n  commands: [\n    { name: "roll", description: "Roll a die", reply: "🎲 You rolled a 4!" },\n    { name: "joke", description: "Tell a joke", reply: "Why don\'t scientists trust atoms?" },\n  ],\n};\n\nconst registry = buildRegistry(spec);\nconsole.log(Object.keys(registry).length + " commands in registry");\nconsole.log(lookupCommand(registry, "roll"));\nconsole.log(lookupCommand(registry, "dance"));',
          tests: [
            { text: "You defined `buildRegistry`", check: has(/function\s+buildRegistry|buildRegistry\s*=/) },
            { text: "You defined `lookupCommand`", check: has(/function\s+lookupCommand|lookupCommand\s*=/) },
            { text: "Registry has 2 commands", check: logs((l) => l.some((x) => x.includes("2 commands in registry"))) },
            { text: "`roll` lookup returns the handler", check: logs((l) => l.some((x) => x.includes("handle_roll"))) },
            { text: "`dance` lookup returns `Command not found`", check: logs((l) => l.some((x) => x.includes("Command not found"))) },
          ],
        },
      ],
    },
  ],
};

export const COURSES: Course[] = [GREETER, MODBOT, UNDER_THE_HOOD, AI_BOT_BUILDER];

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
