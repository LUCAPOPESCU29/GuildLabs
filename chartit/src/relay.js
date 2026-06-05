import "dotenv/config";
import { startHealthServer } from "./lib/health-server.js";

/**
 * Lean chart relay — serves only `GET /health` and `GET /chart`.
 *
 * Yahoo hard-blocks Vercel's datacenter IPs for intraday data, so the GuildLabs
 * web app relays those requests here, to a host (Railway) whose IP Yahoo still
 * answers. This entry point deliberately skips the Discord gateway, the headless
 * Chromium chart renderer, and the cron schedulers that `index.js` boots — the
 * relay needs none of them, which keeps the image small and the service robust.
 *
 * Railway injects the listening port as `PORT`; fall back to BOT_API_PORT/8080
 * so the same file also runs locally.
 */
const stubClient = { user: null };
const port = Number(process.env.PORT) || Number(process.env.BOT_API_PORT) || 8080;

startHealthServer(stubClient, port);
console.log(`[RELAY] ChartIt chart relay listening on :${port}`);
