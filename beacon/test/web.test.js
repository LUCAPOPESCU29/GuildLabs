import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer } from "node:http";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDatabase } from "../src/lib/db.js";
import { createStore, dayShift } from "../src/lib/store.js";
import { createDirectory } from "../src/lib/directory.js";
import { loadConfig } from "../src/lib/config.js";
import { createApp } from "../src/web/server.js";

/**
 * Boots the real express app against an in-memory database with no Discord
 * client. Everything the public sees must work in this mode.
 */
let server;
let base;
let store;

const UA = "Mozilla/5.0 (vitest)";
const get = (path, headers = {}) => fetch(`${base}${path}`, { headers: { "user-agent": UA, ...headers }, redirect: "manual" });

beforeAll(async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "beacon-test-"));
  const config = loadConfig({
    DISCORD_TOKEN: "test-token",
    CLIENT_ID: "123",
    DATA_DIR: dataDir,
    BEACON_PUBLIC_URL: "http://beacon.test",
    BEACON_REPORT_EMAIL: "abuse@beacon.test",
  });
  store = createStore(openDatabase(":memory:"));
  const directory = createDirectory(store, { ttlMs: 0 });

  // Two listed servers, one unlisted-but-complete, one banned, one draft.
  const make = (id, name, patch) => {
    store.upsertDraft({ guildId: id, name, iconUrl: null });
    store.updateGuild(id, { tagline: `${name} tagline`, invite_code: `inv${id}`, invite_channel_id: "c", ...patch });
  };
  make("1", "Alpha Gaming", { slug: "alpha", tags: ["gaming", "esports"], published: 1, description: "Scrims nightly.\n\nAll welcome <script>." });
  make("2", "Beta Traders", { slug: "beta", tags: ["trading"], published: 1, featured: 1 });
  make("3", "Gamma Unlisted", { slug: "gamma", tags: ["art"], published: 0 });
  make("4", "Delta Banned", { slug: "delta", tags: ["memes"], published: 1, banned: 1 });
  store.upsertDraft({ guildId: "5", name: "Epsilon Draft" });

  for (let d = 9; d >= 0; d--) {
    store.addSample("1", { day: dayShift(d), members: 100 + (9 - d) * 5, online: 40, eventsUpcoming: 1 });
    store.addSample("2", { day: dayShift(d), members: 1000, online: 20 });
  }

  const app = createApp({ store, directory, config, client: null });
  server = createServer(app);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  await new Promise((r) => server.close(r));
  store.close();
});

describe("public pages", () => {
  it("serves the home page with featured and tags", async () => {
    const res = await get("/");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Featured");
    expect(html).toContain("Beta Traders");
    expect(html).toContain("/servers/gaming");
    expect(res.headers.get("content-security-policy")).toContain("script-src 'none'");
  });

  it("lists only eligible servers in the directory, ranked", async () => {
    const html = await (await get("/servers")).text();
    expect(html).toContain("Alpha Gaming");
    expect(html).toContain("Beta Traders");
    expect(html).not.toContain("Gamma Unlisted");
    expect(html).not.toContain("Delta Banned");
    expect(html).not.toContain("Epsilon Draft");
    // featured sorts first
    expect(html.indexOf("Beta Traders")).toBeLessThan(html.indexOf("Alpha Gaming"));
  });

  it("filters by tag and by search", async () => {
    expect(await (await get("/servers/trading")).text()).not.toContain("Alpha Gaming");
    expect((await get("/servers/not-a-tag")).status).toBe(404);
    const search = await (await get("/servers?q=alpha")).text();
    expect(search).toContain("Alpha Gaming");
    expect(search).not.toContain("Beta Traders");
    expect(search).toContain('name="robots" content="noindex');
  });

  it("renders a server page and escapes user content", async () => {
    const res = await get("/s/alpha");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Alpha Gaming");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>.");
    expect(html).toContain('href="/s/alpha/join"');
    expect(html).toContain("<svg class=\"spark\"");
    expect(html).toContain("mailto:abuse@beacon.test");
    expect(html).toContain('"@type":"WebPage"');
  });

  it("serves unlisted pages by link with noindex, hides banned and drafts", async () => {
    const gamma = await get("/s/gamma");
    expect(gamma.status).toBe(200);
    expect(await gamma.text()).toContain("noindex");
    expect((await get("/s/delta")).status).toBe(404);
    expect((await get("/s/nope")).status).toBe(404);
  });

  it("counts a view once per visitor per hour", async () => {
    const before = store.getHits("2", 1).views;
    await get("/s/beta");
    await get("/s/beta");
    expect(store.getHits("2", 1).views).toBe(before + 1);
    await get("/s/beta", { "user-agent": "Mozilla/5.0 (another)" });
    expect(store.getHits("2", 1).views).toBe(before + 2);
  });

  it("ignores crawler views", async () => {
    const before = store.getHits("1", 1).views;
    await get("/s/alpha", { "user-agent": "Googlebot/2.1" });
    expect(store.getHits("1", 1).views).toBe(before);
  });

  it("redirects join clicks to the invite and counts them", async () => {
    const before = store.getHits("1", 1).clicks;
    const res = await get("/s/alpha/join");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://discord.gg/inv1");
    expect(store.getHits("1", 1).clicks).toBe(before + 1);
    expect((await get("/s/delta/join")).status).toBe(404);
  });
});

describe("machine endpoints", () => {
  it("serves a sitemap with listed pages only", async () => {
    const xml = await (await get("/sitemap.xml")).text();
    expect(xml).toContain("http://beacon.test/s/alpha");
    expect(xml).toContain("http://beacon.test/servers/trading");
    expect(xml).not.toContain("/s/gamma");
  });

  it("serves robots.txt and health", async () => {
    expect(await (await get("/robots.txt")).text()).toContain("Sitemap: http://beacon.test/sitemap.xml");
    const health = await (await get("/health")).json();
    expect(health).toMatchObject({ ok: true, bot: null, published: 2 });
  });

  it("serves the stylesheet", async () => {
    const res = await get("/static/style.css");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/css");
  });

  it("returns a styled 404 page", async () => {
    const res = await get("/definitely/not/here");
    expect(res.status).toBe(404);
    expect(await res.text()).toContain("Not found");
  });
});
