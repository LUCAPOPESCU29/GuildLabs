import express from "express";
import { join } from "node:path";
import { createViewDeduper } from "../lib/fingerprint.js";
import { createRateLimiter } from "./rate-limit.js";
import { registerRoutes } from "./routes.js";
import { errorPage } from "./views/pages.js";

/**
 * The public web app: home, directory, tag pages, server pages, join
 * redirects, sitemap, robots, health. Server-rendered HTML, no client JS.
 *
 * `client` is optional so tests (and anyone embedding the web layer) can run
 * it against a store alone; Discord-backed extras degrade gracefully.
 */
export function createApp({ store, directory, config, client = null, deduper = createViewDeduper() }) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1); // one reverse proxy hop (Caddy, Fly, Railway)
  app.set("etag", false);

  app.use((req, res, next) => {
    res.set({
      "Content-Security-Policy":
        "default-src 'self'; img-src 'self' https://cdn.discordapp.com data:; style-src 'self'; " +
        "script-src 'none'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    });
    next();
  });

  // Static assets are cheap and cacheable — serve them before the rate limiter.
  app.use("/static", express.static(join(import.meta.dirname, "public"), { maxAge: "1d", index: false, dotfiles: "deny" }));
  app.use("/uploads", express.static(join(config.dataDir, "uploads"), { maxAge: "7d", index: false, dotfiles: "deny" }));

  app.use(createRateLimiter({ capacity: 60, refillPerSec: 1 }));
  registerRoutes(app, { store, directory, config, client, deduper });

  app.use((req, res) => {
    res.status(404).type("html").send(errorPage({ config, status: 404, message: "That page doesn't exist — or the server took it down." }));
  });

  // Express identifies error handlers by arity, so the fourth parameter must exist.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err, req, res, next) => {
    console.error("[WEB]", err);
    res.status(500).type("html").send(errorPage({ config, status: 500, message: "Something broke on our side. Try again in a moment." }));
  });

  return app;
}
