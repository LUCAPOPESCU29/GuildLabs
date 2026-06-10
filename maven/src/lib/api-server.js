import express from "express";
import cors from "cors";
import { Config } from "./config-store.js";
import { Index } from "../features/index-store.js";

const API_KEY = process.env.BOT_API_KEY ?? "maven-local-dev";

export function startApiServer(client, port = 3009) {
  const app = express();
  app.use(express.json());
  app.use(cors({ origin: "*" }));

  function auth(req, res, next) {
    const key = req.headers["x-api-key"];
    if (key !== API_KEY) return res.status(401).json({ error: "Unauthorized" });
    next();
  }

  app.get("/health", (req, res) => res.json({ ok: true, bot: client.user?.tag }));

  app.get("/guilds", auth, (req, res) => {
    const guilds = client.guilds.cache.map((g) => ({
      id: g.id,
      name: g.name,
      icon: g.iconURL({ size: 64 }),
      memberCount: g.memberCount,
    }));
    res.json(guilds);
  });

  app.get("/config/:guildId", auth, (req, res) => {
    res.json(Config.get(req.params.guildId));
  });

  app.post("/config/:guildId", auth, (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) return res.status(404).json({ error: "Guild not found" });
    Config.merge(req.params.guildId, req.body);
    res.json({ ok: true, config: Config.get(req.params.guildId) });
  });

  app.get("/stats/:guildId", auth, (req, res) => {
    res.json(Index.stats(req.params.guildId));
  });

  app.listen(port, () => {
    console.log(`[API] Maven API server running on http://localhost:${port}`);
  });
}
