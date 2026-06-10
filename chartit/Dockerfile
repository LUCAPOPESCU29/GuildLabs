# Slim production image for the ChartIt Discord bot.
# Two stages: deps install → runtime. Keeps the final image small.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# Skip puppeteer's bundled Chromium download — the runtime stage uses Alpine's
# system chromium instead (puppeteer's build is glibc, Alpine is musl).
ENV PUPPETEER_SKIP_DOWNLOAD=true
# Install only production deps; bot has no build step (plain ES modules)
RUN npm install --omit=dev && npm cache clean --force

FROM node:22-alpine AS runtime
WORKDIR /app

# Chromium + fonts for headless chart rendering (lightweight-charts is drawn in
# a real browser and screenshotted). ttf-freefont lets axis/label text render.
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Run as a non-root user — defense in depth
RUN addgroup -S chartit && adduser -S chartit -G chartit

COPY --from=deps /app/node_modules ./node_modules
COPY --chown=chartit:chartit . .

# Persist watchlists + alerts between deploys via a Fly volume mounted at /data
RUN mkdir -p /data && chown -R chartit:chartit /data
ENV DATA_DIR=/data

USER chartit

# The bot exposes a tiny health endpoint so Fly knows the machine is alive.
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["node", "src/index.js"]
