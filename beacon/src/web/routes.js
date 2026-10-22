import { isValidTag } from "../lib/tags.js";
import { isSetupComplete } from "../lib/store.js";
import { fetchUpcomingEvents } from "../lib/discord-data.js";
import { esc } from "../lib/html.js";
import { homePage, directoryPage, serverPage } from "./views/pages.js";

const EVENTS_TTL = 10 * 60_000;

export function registerRoutes(app, { store, directory, config, client, deduper }) {
  const eventsCache = new Map(); // guildId → { at, events }

  async function upcomingEvents(guildId) {
    if (!client) return [];
    const hit = eventsCache.get(guildId);
    if (hit && Date.now() - hit.at < EVENTS_TTL) return hit.events;
    const guild = client.guilds.cache.get(guildId);
    const events = guild ? await fetchUpcomingEvents(guild, 14).catch(() => []) : [];
    eventsCache.set(guildId, { at: Date.now(), events });
    return events;
  }

  function maybeRefresh(guildId) {
    if (!client) return;
    // Lazy import keeps the web layer free of Discord code paths in tests.
    import("../jobs/sample.js").then((m) => m.maybeRefresh(client, guildId)).catch(() => {});
  }

  // ── Home ──────────────────────────────────────────────────────────────────
  app.get("/", (req, res) => {
    res.type("html").send(
      homePage({
        config,
        featured: directory.featured(6),
        top: directory.top(12),
        tags: directory.tagCounts(),
        total: directory.entries().length,
      })
    );
  });

  // ── Directory ─────────────────────────────────────────────────────────────
  function sendDirectory(req, res, tag) {
    const q = typeof req.query.q === "string" ? req.query.q.slice(0, 80) : "";
    const page = Number.parseInt(req.query.page, 10) || 1;
    const result = directory.list({ q, tag, page, perPage: 24 });
    res.type("html").send(directoryPage({ config, q, tag, result, tags: directory.tagCounts() }));
  }

  app.get("/servers", (req, res) => {
    const tag = typeof req.query.tag === "string" && isValidTag(req.query.tag) ? req.query.tag : "";
    sendDirectory(req, res, tag);
  });

  app.get("/servers/:tag", (req, res, next) => {
    const tag = String(req.params.tag).toLowerCase();
    if (!isValidTag(tag)) return next();
    sendDirectory(req, res, tag);
  });

  // ── Server page ───────────────────────────────────────────────────────────
  app.get("/s/:slug", async (req, res, next) => {
    const row = store.getBySlug(String(req.params.slug).toLowerCase());
    if (!row || row.deleted_at || row.banned || !isSetupComplete(row)) return next();

    if (deduper.shouldCount(row.guild_id, req.ip, req.get("user-agent"))) store.recordView(row.guild_id);
    maybeRefresh(row.guild_id);

    const latest = store.latestSample(row.guild_id);
    const samples = store.getSamples(row.guild_id, 90);
    const events = await upcomingEvents(row.guild_id);
    const model = {
      row,
      members: latest?.members ?? 0,
      online: latest?.online ?? 0,
      growth7d: store.growth(row.guild_id, 7),
      series: samples.map((s) => s.members),
      events,
      // Without a live client (tests, embedded use) fall back to the sampled count.
      eventsCount: client ? events.length : latest?.events_upcoming ?? 0,
      rank: row.published && row.tags[0] ? directory.rankOf(row.guild_id, row.tags[0]) : null,
    };
    res.type("html").send(serverPage({ config, model }));
  });

  app.get("/s/:slug/join", (req, res, next) => {
    const row = store.getBySlug(String(req.params.slug).toLowerCase());
    if (!row || row.deleted_at || row.banned || !row.invite_code) return next();
    store.recordClick(row.guild_id);
    res.set("Cache-Control", "no-store");
    res.redirect(302, `https://discord.gg/${encodeURIComponent(row.invite_code)}`);
  });

  // ── Crawlers + health ─────────────────────────────────────────────────────
  app.get("/sitemap.xml", (req, res) => {
    const urls = [
      `${config.publicUrl}/`,
      `${config.publicUrl}/servers`,
      ...directory.tagCounts().map(({ tag }) => `${config.publicUrl}/servers/${tag}`),
      ...directory.entries().map((e) => `${config.publicUrl}/s/${e.slug}`),
    ];
    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls.map((u) => `  <url><loc>${esc(u)}</loc></url>`).join("\n") +
      `\n</urlset>\n`;
    res.type("application/xml").send(xml);
  });

  app.get("/robots.txt", (req, res) => {
    res.type("text/plain").send(`User-agent: *\nAllow: /\nDisallow: /s/*/join\nSitemap: ${config.publicUrl}/sitemap.xml\n`);
  });

  app.get("/health", (req, res) => {
    res.set("Cache-Control", "no-store").json({
      ok: true,
      bot: client?.user?.tag ?? null,
      ws: client?.ws?.status ?? null,
      guilds: client?.guilds?.cache?.size ?? 0,
      published: store.countPublished(),
    });
  });

  app.get("/tags", (req, res) => res.redirect(302, "/servers"));
}
