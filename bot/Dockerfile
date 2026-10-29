# Slim production image for the GuildLabs Discord bot.
# Two stages: deps install → runtime. Keeps the final image small.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# Install only production deps; bot has no build step (plain ES modules)
RUN npm ci --omit=dev && npm cache clean --force

FROM node:22-alpine AS runtime
WORKDIR /app

# Run as a non-root user — defense in depth
RUN addgroup -S guildlabs && adduser -S guildlabs -G guildlabs

COPY --from=deps /app/node_modules ./node_modules
COPY --chown=guildlabs:guildlabs . .

# Persist guild configs + XP between deploys via a Fly volume mounted at /data
RUN mkdir -p /data && chown -R guildlabs:guildlabs /data
ENV DATA_DIR=/data

USER guildlabs

# The bot listens on this port for the dashboard API (Vercel proxies here).
EXPOSE 8080

# Healthcheck — Fly checks this to know if the machine is alive.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["node", "src/index.js"]
