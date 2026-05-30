import express from "express";
import cors from "cors";
import { Config } from "./config-store.js";

const API_KEY = process.env.BOT_API_KEY ?? "forge-local-dev";

export function startApiServer(client, port = 3008) {
  const app = express();
  app.use(express.json());
  app.use(cors({ origin: "*" }));

  // Auth middleware
  function auth(req, res, next) {
    const key = req.headers["x-api-key"];
    if (key !== API_KEY) return res.status(401).json({ error: "Unauthorized" });
    next();
  }

  // GET /guilds — list all guilds the bot is in
  app.get("/guilds", auth, (req, res) => {
    const guilds = client.guilds.cache.map((g) => ({
      id: g.id,
      name: g.name,
      icon: g.iconURL({ size: 64 }),
      memberCount: g.memberCount,
    }));
    res.json(guilds);
  });

  // GET /guilds/:id — single guild details + channels/roles
  app.get("/guilds/:id", auth, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.id);
    if (!guild) return res.status(404).json({ error: "Guild not found" });

    await guild.channels.fetch().catch(() => {});
    await guild.roles.fetch().catch(() => {});

    res.json({
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL({ size: 128 }),
      memberCount: guild.memberCount,
      channels: guild.channels.cache
        .filter((c) => ["GUILD_TEXT", "GUILD_CATEGORY", 0, 4].includes(c.type))
        .map((c) => ({ id: c.id, name: c.name, type: c.type })),
      roles: guild.roles.cache
        .filter((r) => r.name !== "@everyone")
        .map((r) => ({ id: r.id, name: r.name, color: r.hexColor })),
    });
  });

  // GET /config/:guildId
  app.get("/config/:guildId", auth, (req, res) => {
    res.json(Config.get(req.params.guildId));
  });

  // POST /config/:guildId — update config
  app.post("/config/:guildId", auth, (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) return res.status(404).json({ error: "Guild not found" });
    Config.merge(req.params.guildId, req.body);
    res.json({ ok: true, config: Config.get(req.params.guildId) });
  });

  // Health check
  app.get("/health", (req, res) => res.json({ ok: true, bot: client.user?.tag }));

  app.listen(port, () => {
    console.log(`[API] Bot API server running on http://localhost:${port}`);
  });
}
