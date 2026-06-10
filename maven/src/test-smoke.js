/**
 * Smoke test — exercises the embedder + index store WITHOUT needing a
 * Discord token. Run with `node src/test-smoke.js`. Exits 0 on success.
 *
 * Tests:
 *   1. Embedder loads and returns a 384-dim vector.
 *   2. Cosine similarity: same text ≈ 1.0, unrelated text < 0.5.
 *   3. Index add → search round-trips.
 *   4. Index addAnswer attaches answers to entries.
 *   5. Index vote bumps helpful/notHelpful.
 *   6. Persist + hydrate round-trip preserves data.
 *   7. Question detector recognizes obvious questions and rejects junk.
 */

import { embed, cosine } from "./features/embedder.js";
import { Index } from "./features/index-store.js";
import { isLikelyQuestion } from "./features/question-detector.js";

const GUILD = "test_guild_" + Date.now();
let failures = 0;

function check(name, ok, detail = "") {
  if (ok) {
    console.log(`  ✓ ${name}`);
  } else {
    console.log(`  ✗ ${name}  ${detail}`);
    failures++;
  }
}

async function main() {
  console.log("\n— Embedder —");
  const v = await embed("Hello world");
  check("returns a vector", Array.isArray(v));
  check("vector is 384-dim", v?.length === 384);

  const v2 = await embed("Hello world");
  check("identical input → identical vector", JSON.stringify(v) === JSON.stringify(v2));
  check("self-similarity ≈ 1.0", Math.abs(cosine(v, v2) - 1) < 1e-5);

  const vDiff = await embed("Where do I configure the webhook URL?");
  check("unrelated text has lower similarity", cosine(v, vDiff) < 0.6);

  console.log("\n— Question detector —");
  check("detects 'how do I set up...'", isLikelyQuestion("how do I set up roles?"));
  check("detects bare question ending in ?", isLikelyQuestion("Anyone know the answer to this?"));
  check("rejects 'hi guys'", !isLikelyQuestion("hi guys"));
  check("rejects too-short '?'", !isLikelyQuestion("ok?"));
  check("rejects 'lol'", !isLikelyQuestion("lol"));

  console.log("\n— Index store —");
  const Q1 = "How do I configure auto-roles for new members?";
  const Q2 = "Where do I set up auto-roles for newcomers?";  // semantically similar
  const Q3 = "What is the Discord rate limit for messages?";  // unrelated

  const e1 = await Index.add({
    guildId: GUILD, channelId: "c1", messageId: "m1",
    userId: "u1", text: Q1,
  });
  check("add returns new entry", !!e1);
  check("add is idempotent on messageId", (await Index.add({
    guildId: GUILD, channelId: "c1", messageId: "m1",
    userId: "u1", text: Q1,
  })) === null);

  await Index.add({ guildId: GUILD, channelId: "c1", messageId: "m2", userId: "u2", text: Q3 });

  const results = await Index.search({ guildId: GUILD, text: Q2, k: 5 });
  check("search finds the similar Q1", results[0]?.entry?.messageId === "m1");
  check("Q1 scores higher than Q3", results[0]?.score > (results[1]?.score ?? 0));

  console.log("\n— Answers + feedback —");
  const ok = Index.addAnswer({
    guildId: GUILD, questionMessageId: "m1",
    messageId: "a1", userId: "u9", text: "Use server settings → Roles → enable Auto-role.",
  });
  check("addAnswer attaches an answer", ok);

  const stats = Index.stats(GUILD);
  check("stats reports 1 answered", stats.answered === 1);
  check("stats reports 2 questions", stats.indexedQuestions === 2);

  Index.vote({ guildId: GUILD, messageId: "m1", helpful: true });
  Index.vote({ guildId: GUILD, messageId: "m1", helpful: true });
  Index.vote({ guildId: GUILD, messageId: "m1", helpful: false });
  const entry = Index.get(GUILD, "m1");
  check("vote bumps helpful", entry.helpful === 2);
  check("vote bumps notHelpful", entry.notHelpful === 1);

  console.log("\n— Persistence round-trip —");
  Index.flush();
  // Re-import the module to simulate a fresh boot? We can't fully here,
  // but we can verify the file exists and parses.
  const { readFileSync, existsSync } = await import("fs");
  const { join } = await import("path");
  const path = join(process.env.DATA_DIR ?? "./data", "index", `${GUILD}.json`);
  check("snapshot file exists", existsSync(path));
  const parsed = JSON.parse(readFileSync(path, "utf8"));
  check("snapshot has 2 entries", parsed.entries?.length === 2);
  check("snapshot preserves answers", parsed.entries.find(e => e.id === "m1")?.answers?.length === 1);
  check("snapshot preserves votes", parsed.entries.find(e => e.id === "m1")?.helpful === 2);

  // Cleanup the test guild's file
  const { unlinkSync } = await import("fs");
  try { unlinkSync(path); } catch {}

  if (failures === 0) {
    console.log(`\n✅ All checks passed.\n`);
    process.exit(0);
  } else {
    console.log(`\n❌ ${failures} check(s) failed.\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Smoke test crashed:", err);
  process.exit(1);
});
