#!/usr/bin/env node
/**
 * Generate an ADMIN_PASSWORD_HASH without the password touching disk, argv, or
 * shell history. Reads from a hidden prompt (or stdin when piped) and prints
 * only the hash — safe to paste into Vercel.
 *
 *   node scripts/hash-admin-password.mjs
 */
import { randomBytes, scrypt as scryptCb } from "crypto";
import { promisify } from "util";
import { createInterface } from "readline";

const scrypt = promisify(scryptCb);

async function prompt() {
  if (!process.stdin.isTTY) {
    return (await new Promise((r) => {
      let d = "";
      process.stdin.on("data", (c) => (d += c)).on("end", () => r(d));
    })).trim();
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  process.stdout.write("New admin password: ");
  rl.output.write = () => {}; // suppress echo
  const answer = await new Promise((r) => rl.question("", r));
  rl.close();
  process.stdout.write("\n");
  return answer.trim();
}

const password = await prompt();
if (!password) {
  console.error("No password given.");
  process.exit(1);
}
if (password.length < 12) {
  console.error(`⚠️  Only ${password.length} characters — 16+ with mixed case and symbols is much stronger.`);
}

const salt = randomBytes(16);
const hash = await scrypt(password, salt, 64);
console.log(`\nscrypt$${salt.toString("hex")}$${hash.toString("hex")}\n`);
console.log("Set it with:");
console.log("  vercel env rm ADMIN_PASSWORD_HASH production --yes");
console.log("  vercel env add ADMIN_PASSWORD_HASH production   # paste the hash above");
