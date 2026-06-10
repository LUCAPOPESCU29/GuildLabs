import { ImageResponse } from "next/og";

/**
 * Shared dynamic OpenGraph card. Each route's `opengraph-image.tsx` is a thin
 * wrapper that calls `ogCard(...)`, so every section unfurls with the same
 * on-brand 1200×630 card (deep-twilight background, GuildLabs lockup, eyebrow +
 * title + subtitle).
 *
 * Colours are concrete hex (satori doesn't resolve our OKLCH CSS vars) chosen to
 * match the dark theme in globals.css: deep indigo surface, blurple accent.
 */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const BG = "#15131e";
const FG = "#f4f3f8";
const MUTED = "#a7a3c0";
const ACCENT = "#8b93ff"; // blurple, matches --primary in dark mode

export function ogCard({
  eyebrow,
  title,
  subtitle,
  accent = ACCENT,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  accent?: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: BG,
          // soft radial glow toward the top-left, on brand
          backgroundImage: `radial-gradient(900px 500px at 12% -10%, ${accent}26, transparent)`,
          padding: "64px 72px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Brand lockup */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 52,
              height: 52,
              borderRadius: 16,
              background: accent,
              color: BG,
              fontSize: 30,
              fontWeight: 800,
            }}
          >
            G
          </div>
          <span style={{ marginLeft: 18, fontSize: 30, color: FG, fontWeight: 700 }}>
            GuildLabs
          </span>
        </div>

        {/* Title block */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {eyebrow ? (
            <div
              style={{
                display: "flex",
                fontSize: 24,
                color: accent,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
                marginBottom: 18,
              }}
            >
              {eyebrow}
            </div>
          ) : null}
          <div style={{ display: "flex", fontSize: 76, color: FG, fontWeight: 800, lineHeight: 1.05 }}>
            {title}
          </div>
          {subtitle ? (
            <div style={{ display: "flex", fontSize: 30, color: MUTED, marginTop: 22, maxWidth: 980 }}>
              {subtitle}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", fontSize: 22, color: MUTED }}>
          guildlabs.fun · Discord tools, done right
        </div>
      </div>
    ),
    { ...OG_SIZE }
  );
}
