# Slim production image for Beacon.
# Two stages: deps install → runtime. No native modules (storage uses Node's
# built-in node:sqlite), so the final image is just node + a few pure-JS deps.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# Production deps only; Beacon has no build step (plain ES modules)
RUN npm ci --omit=dev && npm cache clean --force

FROM node:22-alpine AS runtime
WORKDIR /app

# Run as a non-root user — defense in depth
RUN addgroup -S beacon && adduser -S beacon -G beacon

COPY --from=deps /app/node_modules ./node_modules
COPY --chown=beacon:beacon . .

# Persist the SQLite database + uploaded banners between deploys via a volume at /data
RUN mkdir -p /data && chown -R beacon:beacon /data
ENV DATA_DIR=/data
ENV PORT=8080
ENV NODE_ENV=production

USER beacon

# One port serves the public pages, the directory, and /health.
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["node", "--disable-warning=ExperimentalWarning", "src/index.js"]
